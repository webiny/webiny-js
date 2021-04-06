const execa = require("execa");
const blessed = require("blessed");
const contrib = require("blessed-contrib");
const chalk = require("chalk");
const localtunnel = require("localtunnel");
const express = require("express");
const bodyParser = require("body-parser");
const minimatch = require("minimatch");
const { login, getPulumi, loadEnvVariables, getRandomColorForString } = require("../utils");
const { getProjectApplication } = require("@webiny/cli/utils");
const path = require("path");
const get = require("lodash/get");
const merge = require("lodash/merge");

const SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;

module.exports = async (inputs, context) => {
    if (!inputs.env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    if (!inputs.build && !inputs.deploy) {
        throw new Error(`Both re-build and re-deploy actions were disabled, can't continue.`);
    }

    if (typeof inputs.logs === "string" && inputs.logs === "") {
        inputs.logs = "*";
    }

    // Get project application metadata.
    const projectApplication = getProjectApplication({
        cwd: path.join(process.cwd(), inputs.folder)
    });

    // If exists - read default inputs from "webiny.application.js" file.
    merge(get(projectApplication, "config.cli.watch"), inputs);

    // 1. Initial checks for deploy and build commands. We want to do these before initializing the
    //    blessed screen, because it messes the terminal output a bit. With this approach, we avoid that.

    // 1.1. Check if the project application and Pulumi stack exist.
    if (inputs.deploy) {
        await loadEnvVariables(inputs, context);

        const { env } = inputs;

        await login(projectApplication);

        const pulumi = await getPulumi({
            execa: {
                cwd: projectApplication.root
            }
        });

        let stackExists = true;
        try {
            await pulumi.run(
                { command: ["stack", "select", env] },
                {
                    args: {
                        secretsProvider: SECRETS_PROVIDER
                    }
                }
            );
        } catch (e) {
            stackExists = false;
        }

        if (!stackExists) {
            throw new Error(`Please specify an existing environment, for example "dev".`);
        }
    }

    // 2. Create screen on which we'll show logs.
    const { screen, logs } = createScreen(inputs);

    screen.render();

    try {
        const logging = {
            url: null
        };

        // Forward logs from the cloud to here, using the "localtunnel" library.
        if (inputs.logs) {
            const tunnel = await localtunnel({ port: 3010 });

            logging.url = tunnel.url;

            const app = express();
            app.use(bodyParser.urlencoded({ extended: false }));
            app.use(bodyParser.json());

            app.post("/", (req, res) => {
                if (Array.isArray(req.body)) {
                    req.body.forEach(consoleLog =>
                        printLog({
                            consoleLog,
                            log: logs.logs.log.bind(logs.logs),
                            pattern: inputs.logs
                        })
                    );
                }
                res.send("Message received.");
            });

            app.listen(3010);

            [
                chalk.green(`Listening for incoming logs on port 3010...`),
                `Note: everything you log in your code will be forwarded here ${chalk.underline(
                    "over public internet"
                )}.`,
                `To learn more, please visit https://www.webiny.com/docs/todo-article.`
            ].forEach(logs.logs.log.bind(logs.logs));

            logs.logs.log(""); // Log an empty line.

            if (inputs.logs !== "*") {
                logs.logs.log(
                    chalk.gray(`Only showing logs that match the following pattern: ${inputs.logs}`)
                );
            }
        }

        // Add deploy logs.
        if (inputs.deploy) {
            logs.deploy.log(chalk.green("Watching cloud infrastructure resources..."));

            const pulumi = await getPulumi({
                execa: {
                    cwd: projectApplication.root
                }
            });

            const watchCloudInfrastructure = pulumi.run({
                command: "watch",
                args: {
                    secretsProvider: SECRETS_PROVIDER,
                    color: "always"
                },
                execa: {
                    env: {
                        WEBINY_ENV: inputs.env,
                        WEBINY_PROJECT_NAME: context.projectName,
                        WEBINY_LOGS_FORWARD_URL: logging.url
                    }
                }
            });

            watchCloudInfrastructure.stdout.on("data", data => logs.deploy.log(data.toString()));
            watchCloudInfrastructure.stderr.on("data", data => logs.deploy.log(data.toString()));

            // If logs are enabled, inform user that we're updating the WEBINY_LOGS_FORWARD_URL env variable.
            if (inputs.logs) {
                setTimeout(() => {
                    logs.deploy.log(
                        `Logs enabled - updating ${chalk.gray(
                            "WEBINY_LOGS_FORWARD_URL"
                        )} environment variable...`
                    );
                }, 3000);
            }
        }

        // Add build logs.
        if (inputs.build) {
            logs.build.log(chalk.green("Watching packages..."));

            let scopes = [];
            if (inputs.scope) {
                scopes = Array.isArray(inputs.scope) ? inputs.scope : [inputs.scope];
            } else {
                scopes = await execa("yarn", [
                    "webiny",
                    "workspaces",
                    "tree",
                    "--json",
                    "--depth",
                    inputs.depth,
                    "--distinct",
                    "--folder",
                    inputs.folder
                ]).then(({ stdout }) => JSON.parse(stdout));
            }

            const watchPackages = execa("yarn", [
                "webiny",
                "workspaces",
                "run",
                "watch",
                "--env",
                inputs.env,
                ...scopes.reduce((current, item) => {
                    current.push("--scope", item);
                    return current;
                }, [])
            ]);

            watchPackages.stdout.on("data", data => {
                let message = data.toString();
                if (message.match(/error/i)) {
                    message = chalk.red(message);
                }
                logs.build.log(message);
            });
            watchPackages.stderr.on("data", data => {
                let message = data.toString();
                if (message.match(/error/i)) {
                    message = chalk.red(message);
                }
                logs.build.log(message);
            });
        }
    } catch (e) {
        screen.destroy();
        throw e;
    }
};

const createScreen = inputs => {
    // Setup blessed screen.
    const screen = blessed.screen({
        smartCSR: true,
        useBCE: true,
        dockBorders: true
    });

    const HEIGHTS = {
        build: 2,
        deploy: 1,
        logs: 2
    };

    const output = { screen, grid: null, logs: { build: null, deploy: null, logs: null } };

    // Calculate total rows needed.
    let rows = { total: 0, current: 0 };
    if (inputs.build) {
        rows.total += HEIGHTS.build;
    }

    if (inputs.deploy) {
        rows.total += HEIGHTS.deploy;
    }

    if (inputs.logs) {
        rows.total += HEIGHTS.logs;
    }

    // Create grid.
    output.grid = new contrib.grid({ rows: rows.total, cols: 1, screen: screen });

    if (inputs.build) {
        output.logs.build = output.grid.set(rows.current, 0, HEIGHTS.build, 1, contrib.log, {
            label: "Build",
            scrollable: true,
            scrollOnInput: true
        });
        rows.current += HEIGHTS.build;
    }

    if (inputs.deploy) {
        output.logs.deploy = output.grid.set(rows.current, 0, HEIGHTS.deploy, 1, contrib.log, {
            label: "Deploy",
            scrollbar: true,
            alwaysScroll: true,
            scrollable: true,
            scrollOnInput: true
        });
        rows.current += HEIGHTS.deploy;
    }

    if (inputs.logs) {
        output.logs.logs = output.grid.set(rows.current, 0, HEIGHTS.logs, 1, contrib.log, {
            label: "Logs",
            scrollOnInput: true
        });
        rows.current += HEIGHTS.logs;
    }

    return output;
};

const printLog = ({ pattern = "*", consoleLog, log }) => {
    const plainPrefix = `${consoleLog.meta.functionName}:`;
    const coloredPrefix = chalk.hex(getRandomColorForString(plainPrefix)).bold(plainPrefix);

    let output = "";
    for (let i = 0; i < consoleLog.args.length; i++) {
        const arg = consoleLog.args[i];
        const lines = String(arg).split("\n");
        if (lines.length === 1) {
            output += " " + arg;
        } else {
            if (output) {
                if (minimatch(plainPrefix + output, pattern)) {
                    log(coloredPrefix + output);
                }
                output = "";
            }

            if (minimatch(plainPrefix + arg, pattern)) {
                lines.forEach(line => {
                    printLog({ consoleLog: { ...consoleLog, args: [line] }, log, pattern: "*" });
                });
            }
        }
    }

    if (output) {
        if (minimatch(plainPrefix + output, pattern)) {
            log(coloredPrefix + output);
        }
    }
};
