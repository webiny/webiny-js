const path = require("path");
const fs = require("fs");
const { sendEvent } = require("@webiny/tracking");
const { Component } = require("@webiny/serverless-component");
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
    async default(inputs = {}, context) {
        require("./tsRequire")({
            projectRoot: context.paths.projectRoot,
            tmpDir: context.resolve(".webiny", "tmp")
        });

        validateInputs(inputs);

        let template;
        try {
            if (fs.existsSync(`resources.js`)) {
                const newTemplate = await require(path.resolve("resources.js"))({
                    cli: inputs,
                    context
                });
                template = newTemplate.resources;
            } else if (fs.existsSync(`resources.ts`)) {
                const resources = require(path.resolve("resources.ts")).default;
                const newTemplate = await resources({ cli: inputs });
                template = newTemplate.resources;
            } else {
                template = await findTemplate();
            }
        } catch (err) {
            console.log(`🚨 ${err.message}`);
            process.exit(1);
        }

        if (inputs.resources.length) {
            return await this.deployResources(inputs.resources, { ...inputs, template }, context);
        }

        // Run template
        return await this.deployAll({ ...inputs, template }, context);
    }

    async deployAll(inputs = {}, cliContext) {
        this.context.status("Deploying");

        cliContext.onExit(async code => {
            if (code === "SIGINT") {
                await sendEvent({
                    event: "stack-deploy-end",
                    data: {
                        stack: inputs.stack
                    }
                });
            }
        });

        await sendEvent({
            event: "stack-deploy-start",
            data: {
                stack: inputs.stack
            }
        });

        try {
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

            await sendEvent({
                event: "stack-deploy-end",
                data: {
                    stack: inputs.stack
                }
            });

            await inputs.afterExecute({
                output: this.state.outputs,
                duration: (Date.now() - start) / 1000
            });

            return outputs;
        } catch (e) {
            await sendEvent({
                event: "stack-deploy-error",
                data: {
                    stack: inputs.stack,
                    errorMessage: e.message,
                    errorStack: e.stack
                }
            });

            throw e;
        }
    }

    async deployResources(resources, inputs, context) {
        const template = await getTemplate(inputs);

        if (!this.state.outputs) {
            throw Error(
                `You must deploy the entire infrastructure before you can do partial deployments.`
            );
        }

        Object.keys(this.state.outputs).forEach(key => {
            if (!resources.includes(key)) {
                template[key] = this.state.outputs[key];
            }
        });

        const resolvedTemplate = resolveTemplate(inputs, template);
        const allComponents = setDependencies(getAllComponents(resolvedTemplate));
        const { debug, watch, afterExecute } = inputs;

        await new Promise(async (resolve, reject) => {
            // `firstBuild` is the first build cycle before entering the `watch` mode
            let firstBuild = true;

            // Due to internal logging/debug mechanism of `@serverless/components`, we need to execute deployments in series.
            // Otherwise, debug output will be messed up. `compose` creates a middleware similar to `express`,
            // and we can control when the next Promise is to be executed using the `next` callback.
            const middleware = compose(
                resources.map(resource => {
                    return async next => {
                        const resourceData = allComponents[resource];

                        // If a resource does not exist or an invalid resource name was provided, throw an error.
                        if (!resourceData) {
                            throw new Error(`Resource "${resource}" does not exist.`);
                        }

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
                                await afterExecute({
                                    context: this.context,
                                    output: this.state.outputs,
                                    duration: (Date.now() - start) / 1000
                                });
                            }
                        };

                        if (watch) {
                            setupFileWatchers(deployComponent, resource, resourceData, context);
                        }

                        if (resourceData.build) {
                            // Inject template values into `build` config
                            const resolvedBuild = resolveObject(
                                resourceData.build,
                                getOutputs(allComponents)
                            );

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
            try {
                await middleware();
            } catch (err) {
                return reject(err);
            }

            await afterExecute({
                context: this.context,
                output: this.state.outputs,
                duration: (Date.now() - start) / 1000
            });
            firstBuild = false;

            if (!watch) {
                resolve();
            } else {
                this.context.instance.clearStatus();
                console.log("Watching for changes...");
            }
        });

        return this.state.outputs;
    }

    async remove(inputs = {}) {
        validateInputs(inputs);

        this.context.status(`Removing`);

        await syncState({}, this);

        this.state = {};
        await this.save();

        return {};
    }
}

module.exports = Template;
