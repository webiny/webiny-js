const chalk = require("chalk");
const path = require("path");
const { getProjectApplication, getProject } = require("@webiny/cli/utils");
const get = require("lodash/get");
const merge = require("lodash/merge");
const { Worker } = require("worker_threads");
const { loadEnvVariables, runHook, getDeploymentId} = require("../utils");
const { getIotEndpoint } = require("./newWatch/getIotEndpoint");
const { listLambdaFunctions } = require("./newWatch/listLambdaFunctions");
const listPackages = require("./newWatch/listPackages");
const { PackagesWatcher } = require("./newWatch/watchers/PackagesWatcher");

// Do not allow watching "prod" and "production" environments. On the Pulumi CLI side, the command
// is still in preview mode, so it's definitely not wise to use it on production environments.
const WATCH_DISABLED_ENVIRONMENTS = ["prod", "production"];

const WEBINY_WATCH_FN_INVOCATION_EVENT = "webiny.watch.functionInvocation";
const WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT = "webiny.watch.functionInvocationResult";

const WATCH_WORKER_PATH = path.join(__dirname, "watch", "localInvocationWorker.js");

module.exports = async (inputs, context) => {
    // 1. Initial checks for deploy and build commands.
    if (!inputs.folder && !inputs.package) {
        throw new Error(
            `Either "folder" or "package" arguments must be passed. Cannot have both undefined.`
        );
    }

    const project = getProject();

    const projectApplicationSpecified = !!inputs.folder;

    // Detect if an app alias was provided.
    let projectApplication;
    if (projectApplicationSpecified) {
        if (project.config.appAliases) {
            const appAliases = project.config.appAliases;
            if (appAliases[inputs.folder]) {
                inputs.folder = appAliases[inputs.folder];
            }
        }

        // Get project application metadata. Will throw an error if invalid folder specified.
        projectApplication = getProjectApplication({
            cwd: path.join(process.cwd(), inputs.folder)
        });

        // If exists - read default inputs from "webiny.application.ts" file.
        inputs = merge({}, get(projectApplication, "config.cli.watch"), inputs);

        // We don't do anything here. We assume the workspace has already been created
        // upon running the `webiny deploy` command. We rely on that.
        // TODO: maybe we can improve this in the future, depending on the feedback.
        // await createProjectApplicationWorkspace({
        //     projectApplication,
        //     env: inputs.env,
        //     context,
        //     inputs
        // });

        // Check if there are any plugins that need to be registered.
        if (projectApplication.config.plugins) {
            context.plugins.register(projectApplication.config.plugins);
        }

        // Load env vars specified via .env files located in project application folder.
        await loadEnvVariables(inputs, context);
    }

    if (inputs.deploy && !inputs.env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    if (WATCH_DISABLED_ENVIRONMENTS.includes(inputs.env)) {
        if (!inputs.allowProduction) {
            throw new Error(
                `${chalk.red("webiny watch")} command cannot be used with production environments.`
            );
        }
    }

    const hookArgs = { context, env: inputs.env, inputs, projectApplication };

    await runHook({
        hook: "hook-before-watch",
        args: hookArgs,
        context
    });

    console.log();

    // TODO: visual feedback that the watch command has started.

    const packages = await listPackages({ inputs });
    const packagesWatcher = new PackagesWatcher({ packages, context, inputs });
    const watchPromise = packagesWatcher.watch();

    if (!projectApplicationSpecified) {
        await watchPromise;
        return;
    }

    const lambdaFunctions = listLambdaFunctions(inputs);
    if (!lambdaFunctions.length) {
        return;
    }

    const deploymentId = getDeploymentId({ env: inputs.env });
    const iotEndpointTopic = `webiny-watch-topic-${deploymentId}`;
    const iotEndpoint = await getIotEndpoint();
    const sessionId = new Date().getTime();

    const {
        LambdaClient,
        GetFunctionConfigurationCommand,
        UpdateFunctionConfigurationCommand
    } = require("@aws-sdk/client-lambda");

    const lambdaClient = new LambdaClient();

    const functionUpdatesPromises = lambdaFunctions.map(async fn => {
        const getFnConfigCmd = new GetFunctionConfigurationCommand({ FunctionName: fn.name });
        const lambdaFnConfiguration = await lambdaClient.send(getFnConfigCmd);

        const updateFnConfigCmd = new UpdateFunctionConfigurationCommand({
            FunctionName: fn.name,
            Timeout: 300, // 5 minutes
            Environment: {
                Variables: {
                    ...lambdaFnConfiguration.Environment.Variables,
                    WEBINY_WATCH: JSON.stringify({
                        enabled: true,
                        sessionId,
                        iotEndpoint,
                        functionName: fn.name
                    })
                }
            }
        });

        await lambdaClient.send(updateFnConfigCmd);
    });

    await Promise.all(functionUpdatesPromises);

    if (inputs.inspect) {
        const inspector = require("inspector");
        inspector.open(9229, "127.0.0.1");
    }

    // inspector.open(0, undefined, false);
    // fs.writeFileSync(someFileName, inspector.url());
    // inspector.waitForDebugger();

    const mqtt = require("mqtt");

    const client = await mqtt.connectAsync(iotEndpoint);
    await client.subscribeAsync(iotEndpointTopic);

    client.on("message", async (_, message) => {
        const payload = JSON.parse(message.toString());

        if (payload.eventType !== WEBINY_WATCH_FN_INVOCATION_EVENT) {
            return;
        }

        if (payload.data.sessionId !== sessionId) {
            return;
        }

        const invokedLambdaFunction = lambdaFunctions.find(
            lambdaFunction => lambdaFunction.name === payload.data.functionName
        );

        try {
            const result = await new Promise((resolve, reject) => {
                const worker = new Worker(WATCH_WORKER_PATH, {
                    env: { ...payload.data.env, WEBINY_WATCH_LOCAL_INVOCATION: "1" },
                    workerData: {
                        handler: {
                            path: invokedLambdaFunction.path,
                            args: payload.data.args
                        }
                    }
                });

                worker.on("message", message => {
                    const { success, result, error } = JSON.parse(message);
                    if (success) {
                        resolve(result);
                        worker.terminate();
                        return;
                    }
                    reject(error);
                });

                worker.on("error", reject);
                worker.on("exit", code => {
                    if (code !== 0) {
                        reject(new Error(`Worker stopped with exit code ${code}`));
                    }
                });
            });

            await client.publish(
                iotEndpointTopic,
                JSON.stringify({
                    eventType: WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT,
                    eventId: new Date().getTime(),
                    data: {
                        originalEventId: payload.eventId,
                        result,
                        error: null
                    }
                })
            );
        } catch (error) {
            console.log(
                JSON.stringify({
                    eventType: WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT,
                    eventId: new Date().getTime(),
                    data: {
                        originalEventId: payload.eventId,
                        data: null,
                        error: {
                            message: error.message,
                            stack: error.stack
                        }
                    }
                })
            );
            await client.publish(
                iotEndpointTopic,
                JSON.stringify({
                    eventType: WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT,
                    eventId: new Date().getTime(),
                    data: {
                        originalEventId: payload.eventId,
                        data: null,
                        error: {
                            message: error.message,
                            stack: error.stack
                        }
                    }
                })
            );
        }
    });
};
