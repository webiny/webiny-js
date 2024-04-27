const chalk = require("chalk");
const path = require("path");
const { getProjectApplication, getProject } = require("@webiny/cli/utils");
const get = require("lodash/get");
const merge = require("lodash/merge");
const { loadEnvVariables, runHook } = require("../utils");
const { getIotEndpoint } = require("./watch/getIotEndpoint");
const { listLambdaFunctions } = require("./watch/listLambdaFunctions");
const { Worker } = require("worker_threads");
const listPackages = require("./watch/listPackages");
const { PackagesWatcher } = require("./watch/watchers/PackagesWatcher");

// Do not allow watching "prod" and "production" environments. On the Pulumi CLI side, the command
// is still in preview mode, so it's definitely not wise to use it on production environments.
const WATCH_DISABLED_ENVIRONMENTS = ["prod", "production"];

const IOT_ENDPOINT_TOPIC = "xyz";

const WEBINY_WATCH_FN_INVOCATION_EVENT =  'webiny.watch.functionInvocation';
const WEBINY_WATCH_FN_INVOCATION_RESULT_EVENT = "webiny.watch.functionInvocationResult";

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

    // TODO: separate the rest of the code below into separate "watcher" classes.
    // TODO: This was done just because of the time constraints.
    if (!projectApplicationSpecified) {
        await watchPromise;
        return;
    }

    const sessionId = new Date().getTime();
    const iotEndpoint = await getIotEndpoint();
    const lambdaFunctions = listLambdaFunctions(inputs);

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

    await client.subscribeAsync(IOT_ENDPOINT_TOPIC);

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
                const workerPath = path.join(__dirname, "watch", "./localInvocationWorker.js");

                const worker = new Worker(workerPath, {
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
                IOT_ENDPOINT_TOPIC,
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
                IOT_ENDPOINT_TOPIC,
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

    // // TODO: separate the rest of the code below into separate "watcher" classes.
    // // TODO: This was done just because of the time constraints.
    // if (!inputs.deploy) {
    //     const packages = await listPackages({ inputs });
    //     const packagesWatcher = new PackagesWatcher({ packages, context, inputs });
    //     await packagesWatcher.watch();
    //     return;
    // }
    //
    // // 1.1. Check if the project application and Pulumi stack exist.
    // let PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
    // let PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;
    //
    // if (inputs.deploy && projectApplication) {
    //     const { env } = inputs;
    //
    //     await login(projectApplication);
    //
    //     const pulumi = await getPulumi({ projectApplication });
    //
    //     let stackExists = true;
    //     try {
    //         await pulumi.run({
    //             command: ["stack", "select", env],
    //             args: {
    //                 secretsProvider: PULUMI_SECRETS_PROVIDER
    //             },
    //             execa: {
    //                 env: {
    //                     PULUMI_CONFIG_PASSPHRASE
    //                 }
    //             }
    //         });
    //     } catch (e) {
    //         stackExists = false;
    //     }
    //
    //     if (!stackExists) {
    //         throw new Error(`Please specify an existing environment, for example "dev".`);
    //     }
    // }
    //
    // const output = simpleOutput;
    //
    // if (typeof output.initialize === "function") {
    //     await output.initialize(inputs);
    // }
    //
    // const logging = {
    //     url: null
    // };
    //
    // // // Forward logs from the cloud to here, using the "localtunnel" library.
    // // if (inputs.remoteRuntimeLogs) {
    // //     try {
    // //         const tunnel = await localtunnel({ port: 3010 });
    // //
    // //         logging.url = tunnel.url;
    // //
    // //         const uniqueLocalTunnelErrorMessages = [];
    // //         tunnel.on("error", e => {
    // //             // We're ensuring the same message is not printed twice or more.
    // //             // We're doing this because we've seen the same error message being printed
    // //             // multiple times, and it's not really helpful. This way we're ensuring
    // //             // the user sees the error only once.
    // //             if (!uniqueLocalTunnelErrorMessages.includes(e.message)) {
    // //                 uniqueLocalTunnelErrorMessages.push(e.message);
    // //
    // //                 if (uniqueLocalTunnelErrorMessages.length === 1) {
    // //                     output.log({
    // //                         type: "logs",
    // //                         message: chalk.red("Could not initialize logs forwarding.")
    // //                     });
    // //                 }
    // //
    // //                 output.log({
    // //                     type: "logs",
    // //                     message: chalk.red("Could not initialize logs forwarding.")
    // //                 });
    // //
    // //                 output.log({
    // //                     type: "logs",
    // //                     message: chalk.red(e.message)
    // //                 });
    // //
    // //                 if (inputs.debug) {
    // //                     output.log({
    // //                         type: "logs",
    // //                         message: chalk.red(e.stack)
    // //                     });
    // //                 }
    // //             }
    // //         });
    // //
    // //         const app = express();
    // //         app.use(bodyParser.urlencoded({ extended: false }));
    // //         app.use(bodyParser.json());
    // //
    // //         app.post("/", (req, res) => {
    // //             if (Array.isArray(req.body)) {
    // //                 req.body.forEach(consoleLog => {
    // //                     printLog({
    // //                         output,
    // //                         consoleLog,
    // //                         pattern: inputs.logs
    // //                     });
    // //                 });
    // //             }
    // //             res.send("Message received.");
    // //         });
    // //
    // //         app.listen(3010);
    // //
    // //         [
    // //             `webiny ${chalk.blueBright(
    // //                 "info"
    // //             )}: Log forwarding enabled. Listening for incoming logs on port ${chalk.blueBright(
    // //                 3010
    // //             )}.`,
    // //             `webiny ${chalk.blueBright(
    // //                 "info"
    // //             )}: Everything you log in your application code will be forwarded here over ${chalk.bold(
    // //                 "public internet"
    // //             )}. Learn more: https://webiny.link/enable-logs-forwarding.`
    // //         ].forEach(message => output.log({ type: "logs", message }));
    // //
    // //         output.log({ type: "logs", message: "" });
    // //
    // //         if (inputs.remoteRuntimeLogs !== "*") {
    // //             output.log({
    // //                 type: "logs",
    // //                 message: chalk.gray(
    // //                     `Only showing logs that match the following pattern: ${inputs.remoteRuntimeLogs}`
    // //                 )
    // //             });
    // //         }
    // //     } catch (e) {
    // //         output.log({
    // //             type: "logs",
    // //             message: chalk.red(e.message)
    // //         });
    // //
    // //         if (inputs.debug) {
    // //             output.log({
    // //                 type: "logs",
    // //                 message: chalk.red(e.stack)
    // //             });
    // //         }
    // //     }
    // // } else if (inputs.deploy) {
    // //     [
    // //         `webiny ${chalk.blueBright(
    // //             "info"
    // //         )}: To enable log forwarding, rerun the command with the ${chalk.blueBright(
    // //             "-r"
    // //         )} flag. Learn more: https://webiny.link/enable-logs-forwarding.`
    // //     ].forEach(message => output.log({ type: "logs", message }));
    // // }
    //
    // // Add deploy logs.
    // if (inputs.deploy && projectApplication) {
    //     try {
    //         output.log({
    //             type: "deploy",
    //             message: chalk.green("Watching cloud infrastructure resources...")
    //         });
    //
    //         const buildFoldersGlob = [projectApplication.paths.workspace, "**/build/*.js"].join(
    //             "/"
    //         );
    //
    //         const buildFolders = glob.sync(buildFoldersGlob, { onlyFiles: false });
    //
    //         // The final array of values that will be sent to Pulumi CLI's "--path" argument.
    //         // NOTE: for Windows, there's a bug in Pulumi preventing us to use path filtering.
    //         let pathArg = undefined;
    //         if (PULUMI_WATCH_SUPPORTED) {
    //             pathArg = [...buildFolders];
    //
    //             const pulumiFolder = path.join(projectApplication.root, "pulumi");
    //             if (fs.existsSync(pulumiFolder)) {
    //                 pathArg.push(pulumiFolder);
    //             }
    //         }
    //
    //         // Log used values if debugging has been enabled.
    //         if (inputs.debug) {
    //             const message = pathArg
    //                 ? [
    //                       "The following files and folders are being watched:",
    //                       ...pathArg.map(p => "\n‣ " + p)
    //                   ].join("\n")
    //                 : `Watching ${projectApplication.root}.`;
    //
    //             output.log({
    //                 type: "deploy",
    //                 message
    //             });
    //         }
    //
    //         const pulumi = await getPulumi({ projectApplication });
    //
    //         const watchCloudInfrastructure = pulumi.run({
    //             command: "watch",
    //             args: {
    //                 secretsProvider: PULUMI_SECRETS_PROVIDER,
    //                 color: "always",
    //                 path: pathArg,
    //                 debug: inputs.debug
    //             },
    //             execa: {
    //                 env: {
    //                     WEBINY_ENV: inputs.env,
    //                     WEBINY_PROJECT_NAME: context.project.name,
    //                     WEBINY_LOGS_FORWARD_URL: logging.url
    //                 }
    //             }
    //         });
    //
    //         watchCloudInfrastructure.stdout.on("data", data => {
    //             const lines = data.toString().split("\n");
    //             for (let i = 0; i < lines.length; i++) {
    //                 const line = lines[i];
    //                 try {
    //                     const [, , name, message] = line
    //                         .match(/(.*)\[(.*)\] (.*)/)
    //                         .map(item => item.trim());
    //
    //                     if (name) {
    //                         const coloredName = chalk.hex(getRandomColorForString(name)).bold(name);
    //                         output.log({
    //                             type: "deploy",
    //                             message: `${coloredName}: ${message}`
    //                         });
    //                     } else {
    //                         output.log({
    //                             type: "deploy",
    //                             message
    //                         });
    //                     }
    //                 } catch (e) {
    //                     output.log({
    //                         type: "deploy",
    //                         message: line
    //                     });
    //                 }
    //             }
    //         });
    //
    //         watchCloudInfrastructure.stderr.on("data", data => {
    //             output.log({
    //                 type: "deploy",
    //                 message: data.toString()
    //             });
    //         });
    //
    //         // If logs are enabled, inform user that we're updating the WEBINY_LOGS_FORWARD_URL env variable.
    //         if (inputs.remoteRuntimeLogs) {
    //             setTimeout(() => {
    //                 output.log({
    //                     type: "deploy",
    //                     message: `Logs enabled - updating ${chalk.gray(
    //                         "WEBINY_LOGS_FORWARD_URL"
    //                     )} environment variable...`
    //                 });
    //             }, 3000);
    //         }
    //     } catch (e) {
    //         output.log({
    //             type: "deploy",
    //             message: chalk.red(e.message)
    //         });
    //
    //         if (inputs.debug) {
    //             output.log({
    //                 type: "deploy",
    //                 message: chalk.red(e.stack)
    //             });
    //         }
    //     }
    // }

    // if (inputs.build) {
    //     try {
    //         await watchPackages({
    //             inputs,
    //             context,
    //             output
    //         });
    //     } catch (e) {
    //         output.log({
    //             type: "build",
    //             message: chalk.red(e.message)
    //         });
    //
    //         if (inputs.debug) {
    //             output.log({
    //                 type: "build",
    //                 message: chalk.red(e.stack)
    //             });
    //         }
    //     }
    // }
};

