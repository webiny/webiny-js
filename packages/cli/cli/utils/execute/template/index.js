const path = require("path");
const { Component } = require("@serverless/core");
const { loadEnv } = require("../../index");
const buildResource = require("./buildResource");
const { compose } = require("./compose");
const setupFileWatchers = require("./watch");

const {
    getTemplate,
    getAllComponents,
    setDependencies,
    createGraph,
    executeGraph,
    syncState,
    resolveTemplate,
    resolveObject,
    getOutputs,
    findTemplate,
    executeComponent
} = require("./utils");

const validateInputs = ({ env }) => {
    if (typeof env !== "string" || env.length === 0) {
        throw Error("An `--env` parameter must be specified!");
    }
};

class Template extends Component {
    async default(inputs = {}) {
        validateInputs(inputs);

        // Load .env.json from cwd (this will change depending on the command you ran, api|apps)
        await loadEnv(path.resolve(".env.json"), inputs.env, { debug: inputs.debug });

        const template = findTemplate();

        if (inputs.resources) {
            return await this.deployResources(inputs.resources, { ...inputs, template });
        }

        // Run template
        return await this.deployAll({ ...inputs, template });
    }

    async deployAll(inputs = {}) {
        this.context.status("Deploying");

        const template = await getTemplate(inputs);

        const resolvedTemplate = resolveTemplate(inputs, template);

        this.context.debug("Collecting components from the template.");

        const allComponents = setDependencies(getAllComponents(resolvedTemplate));

        const graph = createGraph(allComponents);

        await syncState(allComponents, this);

        this.context.debug(`Executing the template's components graph.`);

        const start = Date.now();
        const allComponentsWithOutputs = await executeGraph(
            allComponents,
            graph,
            this,
            inputs,
            async ({ resource, buildConfig }) => {
                await buildResource({
                    resource,
                    debug: inputs.debug,
                    config: buildConfig,
                    context: this.context
                });
            }
        );

        const outputs = getOutputs(allComponentsWithOutputs);

        this.state.outputs = outputs;
        await this.save();

        await inputs.callback({
            output: this.state.outputs,
            duration: (Date.now() - start) / 1000
        });

        return outputs;
    }

    async deployResources(resources, inputs) {
        const template = await getTemplate(inputs);

        if (!this.state.outputs) {
            throw Error(`You must deploy the entire API before you can deploy single components.`);
        }

        Object.keys(this.state.outputs).forEach(key => {
            if (!resources.includes(key)) {
                template[key] = this.state.outputs[key];
            }
        });

        const resolvedTemplate = resolveTemplate(inputs, template);
        const allComponents = setDependencies(getAllComponents(resolvedTemplate));
        const { debug, watch, callback } = inputs;

        await new Promise(async resolve => {
            // `firstBuild` is the first build cycle before entering the `watch` mode
            let firstBuild = true;

            // Due to internal logging/debug mechanism of `@serverless/components`, we need to execute deployments in series.
            // Otherwise, debug output will be messed up. `compose` creates a middleware similar to `express`,
            // and we can control when the next Promise is to be executed using the `next` callback.
            const middleware = compose(
                resources.map(resource => {
                    return async next => {
                        const resourceData = allComponents[resource];

                        const deployComponent = async () => {
                            const start = Date.now();
                            await executeComponent(
                                resource,
                                allComponents,
                                resourceData,
                                this,
                                inputs
                            );
                            Object.assign(this.state.outputs, getOutputs(allComponents));
                            await this.save();
                            this.context.instance.clearStatus();
                            if (firstBuild) {
                                next();
                            } else {
                                await callback({
                                    context: this.context,
                                    output: this.state.outputs,
                                    duration: (Date.now() - start) / 1000
                                });
                            }
                        };

                        if (watch) {
                            setupFileWatchers(deployComponent, resource, resourceData);
                        }

                        if (resourceData.build) {
                            // Inject template values into `build` config
                            const resolvedBuild = resolveObject(resourceData.build, allComponents);

                            // In `watch` mode, this will never resolve.
                            // Deployment is run by file watchers setup earlier.
                            await buildResource({
                                resource,
                                watch,
                                debug,
                                config: resolvedBuild,
                                context: this.context
                            });
                        }

                        await deployComponent();
                    };
                })
            );

            const start = Date.now();
            await middleware();

            await callback({
                context: this.context,
                output: this.state.outputs,
                duration: (Date.now() - start) / 1000
            });
            firstBuild = false;

            if (!watch) {
                resolve();
            } else {
                console.log("Watching for changes...");
            }
        });

        return this.state.outputs;
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
