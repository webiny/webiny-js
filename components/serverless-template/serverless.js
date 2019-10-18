const fs = require("fs");
const path = require("path");
const { GetEnvVars } = require("env-cmd");
const { Component } = require("@serverless/core");

const {
    getTemplate,
    getAllComponents,
    setDependencies,
    createGraph,
    executeGraph,
    syncState,
    resolveTemplate,
    getOutputs
} = require("./utils");

const findFile = name => {
    if (fs.existsSync(`${name}.yml`)) {
        return `${name}.yml`;
    }

    if (fs.existsSync(`${name}.yaml`)) {
        return `${name}.yaml`;
    }

    throw Error(
        `Template file was not found! Make sure your ${name} file has either ".yml" or ".yaml" extension.`
    );
};

const validateInputs = ({ env, apps, api }) => {
    if (typeof env !== "string" || env.length === 0) {
        throw Error("An `--env` parameter must be specified!");
    }

    if (apps && api) {
        throw Error(`You can only deploy apps or api, not both at the same time.`);
    }

    if (!apps && !api) {
        throw Error("You must specify either `--apps` or `--api` parameter!");
    }
};

class Template extends Component {
    async default(inputs = {}) {
        validateInputs(inputs);

        const type = inputs.apps ? "apps" : "api";

        const slsYaml = findFile(`serverless.${type}`);
        const envJs = `.env.${type}.js`;

        // Load ENV variables
        if (fs.existsSync(envJs)) {
            const env = await GetEnvVars({
                rc: {
                    environments: ["default", inputs.env],
                    filePath: path.join(envJs)
                }
            });

            Object.assign(process.env, env);
        }

        // Run template
        return await this.deploy({ template: slsYaml });
    }

    async deploy(inputs = {}) {
        this.context.status("Deploying");

        const template = await getTemplate(inputs);

        this.context.debug(`Resolving the template's static variables.`);

        const resolvedTemplate = resolveTemplate(template);

        this.context.debug("Collecting components from the template.");

        const allComponents = await getAllComponents(resolvedTemplate);

        this.context.debug(`Analyzing the template's components dependencies.`);

        const allComponentsWithDependencies = setDependencies(allComponents);

        this.context.debug(`Creating the template's components graph.`);

        const graph = createGraph(allComponentsWithDependencies);

        this.context.debug("Syncing template state.");

        await syncState(allComponentsWithDependencies, this);

        this.context.debug(`Executing the template's components graph.`);

        const allComponentsWithOutputs = await executeGraph(
            allComponentsWithDependencies,
            graph,
            this
        );

        const outputs = getOutputs(allComponentsWithOutputs);

        this.state.outputs = outputs;
        await this.save();

        return outputs;
    }

    async remove(inputs = {}) {
        validateInputs(inputs);

        const type = inputs.apps ? "apps" : "api";

        this.context.status(`Removing ${type}`);

        this.context.debug("Flushing template state and removing all components.");
        await syncState({}, this);

        this.state = {};
        await this.save();

        return {};
    }
}

module.exports = Template;
