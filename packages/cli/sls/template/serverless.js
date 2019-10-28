const fs = require("fs");
const path = require("path");
const { Component } = require("@serverless/core");
const { loadEnv } = require("../utils");

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

const findFile = () => {
    if (fs.existsSync(`serverless.yml`)) {
        return path.resolve(`serverless.yml`);
    }

    if (fs.existsSync(`serverless.yaml`)) {
        return path.resolve(`serverless.yaml`);
    }

    throw Error(
        `Template file was not found! Make sure your serverless file has either ".yml" or ".yaml" extension.`
    );
};

const validateInputs = ({ env }) => {
    if (typeof env !== "string" || env.length === 0) {
        throw Error("An `--env` parameter must be specified!");
    }
};

class Template extends Component {
    async default(inputs = {}) {
        validateInputs(inputs);

        // Load .env.json from cwd (this will change depending on command you ran)
        await loadEnv(path.resolve(".env.json"), inputs.env, { debug: inputs.debug });

        // Run template
        return await this.deploy({ ...inputs, template: findFile() });
    }

    async deploy(inputs = {}) {
        this.context.status("Deploying");

        const template = await getTemplate(inputs);

        const resolvedTemplate = resolveTemplate(inputs, template);

        this.context.debug("Collecting components from the template.");

        const allComponents = getAllComponents(resolvedTemplate);

        const allComponentsWithDependencies = setDependencies(allComponents);

        const graph = createGraph(allComponentsWithDependencies);

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

        this.context.status(`Removing`);

        this.context.debug("Flushing template state and removing all components.");
        await syncState({}, this);

        this.state = {};
        await this.save();

        return {};
    }
}

module.exports = Template;
