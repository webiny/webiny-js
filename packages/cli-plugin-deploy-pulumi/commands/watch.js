const os = require("os");
const fs = require("fs");
const chalk = require("chalk");
const path = require("path");
const localtunnel = require("localtunnel");
const express = require("express");
const bodyParser = require("body-parser");
const { getProjectApplication } = require("@webiny/cli/utils");
const get = require("lodash/get");
const merge = require("lodash/merge");
const browserOutput = require("./watch/output/browserOutput");
const terminalOutput = require("./watch/output/terminalOutput");
const simpleOutput = require("./watch/output/simpleOutput");
const minimatch = require("minimatch");
const glob = require("fast-glob");
const watchPackages = require("./watch/watchPackages");
const { login, getPulumi, getRandomColorForString, loadEnvVariables } = require("../utils");

// Do not allow watching "prod" and "production" environments. On the Pulumi CLI side, the command
// is still in preview mode, so it's definitely not wise to use it on production environments.
const WATCH_DISABLED_ENVIRONMENTS = ["prod", "production"];

const PULUMI_WATCH_SUPPORTED = os.platform() !== "win32";

// Note: we are not using `createPulumiCommand` here because this command has a bit specific
// behaviour which is not encapsulated by `createPulumiCommand`. Maybe we can improve in the future.
module.exports = async (inputs, context) => {
    // 1. Initial checks for deploy and build commands.
    if (!inputs.folder && !inputs.package) {
        throw new Error(
            `Either "folder" or "package" arguments must be passed. Cannot have both undefined.`
        );
    }

    let projectApplication;
    if (inputs.folder) {
        // Get project application metadata. Will throw an error if invalid folder specified.
        projectApplication = getProjectApplication({
            cwd: path.join(process.cwd(), inputs.folder)
        });

        // If exists - read default inputs from "webiny.application.ts" file.
        inputs = merge({}, get(projectApplication, "config.cli.watch"), inputs);

        // We don't do anything here. We assume the workspace has already been created
        // upon running the `webiny deploy` command. We rely on that.
        // TODO: maybe we can improve this in the future, depending on the feedback.
        // if (projectApplication.type === "v5-workspaces") {
        // await createProjectApplicationWorkspace({
        //     projectApplication,
        //     env: inputs.env,
        //     context,
        //     inputs
        // });
        // }

        // Load env vars specified via .env files located in project application folder.
        await loadEnvVariables(inputs, context);
    }

    inputs.build = inputs.build !== false;
    inputs.deploy = projectApplication && inputs.deploy !== false;

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

    if (!inputs.build && !inputs.deploy) {
        throw new Error(`Both re-build and re-deploy actions were disabled, can't continue.`);
    }

    if (inputs.deploy) {
        if (typeof inputs.remoteRuntimeLogs === "string" && inputs.remoteRuntimeLogs === "") {
            inputs.remoteRuntimeLogs = "*";
        }
    }

    // 1.1. Check if the project application and Pulumi stack exist.
    let PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
    let PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

    if (inputs.deploy && projectApplication) {
        const { env } = inputs;

        await login(projectApplication);

        const pulumi = await getPulumi({ projectApplication });

        let stackExists = true;
        try {
            await pulumi.run({
                command: ["stack", "select", env],
                args: {
                    secretsProvider: PULUMI_SECRETS_PROVIDER
                },
                execa: {
                    env: {
                        PULUMI_CONFIG_PASSPHRASE
                    }
                }
            });
        } catch (e) {
            stackExists = false;
        }

        if (!stackExists) {
            throw new Error(`Please specify an existing environment, for example "dev".`);
        }
    }

    let output = terminalOutput;

    switch (inputs.output) {
        case "browser":
            output = browserOutput;
            break;
        case "simple":
            output = simpleOutput;
            break;
        default:
            output = terminalOutput;
    }

    if (typeof output.initialize === "function") {
        await output.initialize(inputs);
    }

    const logging = {
        url: null
    };

    // Forward logs from the cloud to here, using the "localtunnel" library.
    if (inputs.remoteRuntimeLogs) {
        try {
            const tunnel = await localtunnel({ port: 3010 });

            logging.url = tunnel.url;

            const app = express();
            app.use(bodyParser.urlencoded({ extended: false }));
            app.use(bodyParser.json());

            app.post("/", (req, res) => {
                if (Array.isArray(req.body)) {
                    req.body.forEach(consoleLog => {
                        printLog({
                            output,
                            consoleLog,
                            pattern: inputs.logs
                        });
                    });
                }
                res.send("Message received.");
            });

            app.listen(3010);

            [
                chalk.green(`Listening for incoming logs on port 3010...`),
                `Note: everything you log in your code will be forwarded here ${chalk.underline(
                    "over public internet"
                )}.`,
                `To learn more, please visit https://www.webiny.com/docs/how-to-guides/use-watch-command#enabling-logs-forwarding.`
            ].forEach(message => output.log({ type: "logs", message }));

            output.log({ type: "logs", message: "" });

            if (inputs.remoteRuntimeLogs !== "*") {
                output.log({
                    type: "logs",
                    message: chalk.gray(
                        `Only showing logs that match the following pattern: ${inputs.remoteRuntimeLogs}`
                    )
                });
            }
        } catch (e) {
            output.log({
                type: "logs",
                message: chalk.red(e.message)
            });

            if (inputs.debug) {
                output.log({
                    type: "logs",
                    message: chalk.red(e.stack)
                });
            }
        }
    }

    // Add deploy logs.
    if (inputs.deploy && projectApplication) {
        try {
            output.log({
                type: "deploy",
                message: chalk.green("Watching cloud infrastructure resources...")
            });

            let buildFoldersGlob = [projectApplication.paths.workspace, "**/build/*.js"].join("/");

            // For non-workspaces projects, we still want to be watching `**/build/*.js` files located
            // in user's project (for example `api/graphql/code/build/handler.js`).
            if (projectApplication.type !== "v5-workspaces") {
                buildFoldersGlob = [
                    projectApplication.paths.absolute,
                    inputs.folder,
                    "**/build/*.js"
                ].join("/");
            }

            const buildFolders = glob.sync(buildFoldersGlob, { onlyFiles: false });

            // The final array of values that will be sent to Pulumi CLI's "--path" argument.
            // NOTE: for Windows, there's a bug in Pulumi preventing us to use path filtering.
            let pathArg = undefined;
            if (PULUMI_WATCH_SUPPORTED) {
                pathArg = [...buildFolders];

                const pulumiFolder = path.join(projectApplication.root, "pulumi");
                if (fs.existsSync(pulumiFolder)) {
                    pathArg.push(pulumiFolder);
                }
            }

            // Log used values if debugging has been enabled.
            if (inputs.debug) {
                const message = pathArg
                    ? [
                          "The following files and folders are being watched:",
                          ...pathArg.map(p => "\n‣ " + p)
                      ].join("\n")
                    : `Watching ${projectApplication.root}.`;

                output.log({
                    type: "deploy",
                    message
                });
            }

            const pulumi = await getPulumi({ projectApplication });

            const watchCloudInfrastructure = pulumi.run({
                command: "watch",
                args: {
                    secretsProvider: PULUMI_SECRETS_PROVIDER,
                    color: "always",
                    path: pathArg,
                    debug: inputs.debug
                },
                execa: {
                    env: {
                        WEBINY_ENV: inputs.env,
                        WEBINY_PROJECT_NAME: context.project.name,
                        WEBINY_LOGS_FORWARD_URL: logging.url
                    }
                }
            });

            watchCloudInfrastructure.stdout.on("data", data => {
                const lines = data.toString().split("\n");
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    try {
                        const [, , name, message] = line
                            .match(/(.*)\[(.*)\] (.*)/)
                            .map(item => item.trim());

                        if (name) {
                            const coloredName = chalk.hex(getRandomColorForString(name)).bold(name);
                            output.log({
                                type: "deploy",
                                message: `${coloredName}: ${message}`
                            });
                        } else {
                            output.log({
                                type: "deploy",
                                message
                            });
                        }
                    } catch (e) {
                        output.log({
                            type: "deploy",
                            message: line
                        });
                    }
                }
            });

            watchCloudInfrastructure.stderr.on("data", data => {
                output.log({
                    type: "deploy",
                    message: data.toString()
                });
            });

            // If logs are enabled, inform user that we're updating the WEBINY_LOGS_FORWARD_URL env variable.
            if (inputs.remoteRuntimeLogs) {
                setTimeout(() => {
                    output.log({
                        type: "deploy",
                        message: `Logs enabled - updating ${chalk.gray(
                            "WEBINY_LOGS_FORWARD_URL"
                        )} environment variable...`
                    });
                }, 3000);
            }
        } catch (e) {
            output.log({
                type: "deploy",
                message: chalk.red(e.message)
            });

            if (inputs.debug) {
                output.log({
                    type: "deploy",
                    message: chalk.red(e.stack)
                });
            }
        }
    }

    if (inputs.build) {
        try {
            await watchPackages({
                inputs,
                context,
                output
            });
        } catch (e) {
            output.log({
                type: "build",
                message: chalk.red(e.message)
            });

            if (inputs.debug) {
                output.log({
                    type: "build",
                    message: chalk.red(e.stack)
                });
            }
        }
    }
};

const printLog = ({ pattern = "*", consoleLog, output }) => {
    const plainPrefix = `${consoleLog.meta.functionName}: `;
    let message = consoleLog.args.join(" ").trim();
    if (message) {
        if (minimatch(plainPrefix, pattern)) {
            const coloredPrefix = chalk.hex(getRandomColorForString(plainPrefix)).bold(plainPrefix);
            output.log({
                type: "logs",
                message: coloredPrefix + message
            });
        }
    }
};
