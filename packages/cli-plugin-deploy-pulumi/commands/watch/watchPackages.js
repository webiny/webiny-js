const path = require("path");
const { Worker } = require("worker_threads");
const chalk = require("chalk");
const { getRandomColorForString } = require("../../utils");
const glob = require("fast-glob");
const execa = require("execa");
const fs = require("fs");
const { getProjectApplication } = require("@webiny/cli/utils");

const parseMessage = message => {
    try {
        return JSON.parse(message);
    } catch (e) {
        return {
            type: "error",
            message: `Could not parse received watch result (JSON): ${message}`
        };
    }
};

module.exports = async ({ inputs, output, context }) => {
    // Find webiny.config.ts files that have the watch command defined.
    let appConfigFiles = [];
    if (inputs.folder) {
        const projectApplication = getProjectApplication({ name: inputs.folder });
        appConfigFiles = glob
            .sync(["**/webiny.config.ts"], {
                cwd: projectApplication.paths.absolute,
                absolute: true
            })
            .map(appConfigFilePath => {
                return {
                    name: inputs.folder + path.dirname(appConfigFilePath),
                    // config: require(configPath).default || require(configPath),
                    paths: {
                        root: path.dirname(appConfigFilePath),
                        config: appConfigFilePath
                    }
                };
            });
    }
    const packagesConfigFiles = await getPackages({ inputs, output, context });

    const configFiles = [...appConfigFiles, ...packagesConfigFiles];

    if (configFiles.length === 0) {
        output.log({
            type: "build",
            message: `Could not watch any of the specified packages.`
        });
        return;
    }

    if (inputs.debug) {
        context.debug("The following packages will be watched for changes:");
        configFiles.forEach(item => console.log("‣ " + item.name));
    }

    const { env, debug, logs } = inputs;
    const multipleWatches = configFiles.length > 1;
    if (multipleWatches) {
        output.log({
            type: "build",
            message: `Watching ${context.info.hl(configFiles.length)} packages...`
        });
    } else {
        output.log({
            type: "build",
            message: `Watching ${context.info.hl(configFiles[0].name)} package...`
        });
    }

    const log = createLog({ multipleWatches, output, context });

    const commandOptions = { env, debug, logs: !multipleWatches || logs };
    const promises = [];
    for (let i = 0; i < configFiles.length; i++) {
        const current = configFiles[i];
        promises.push(
            new Promise(resolve => {
                const worker = new Worker(path.join(__dirname, "./worker.js"), {
                    workerData: {
                        options: commandOptions,
                        package: {
                            paths: current.paths
                        }
                    }
                });

                worker.on("message", threadMessage => {
                    const { type, message } = parseMessage(threadMessage);

                    if (type === "error") {
                        log(current.name, message, "error");
                    } else if (type === "warn") {
                        log(current.name, message);
                    } else {
                        log(current.name, message);
                    }
                });

                worker.on("error", e => {
                    log(
                        current.name,
                        `An unknown error occurred while watching ${context.error.hl(
                            current.name
                        )}:`
                    );

                    log(e);

                    resolve({
                        package: current,
                        result: {
                            message: `An unknown error occurred.`
                        }
                    });
                });
            })
        );
    }

    await Promise.all(promises);
};

const getPackages = async ({ inputs, context, output }) => {
    let packagesList = [];
    if (inputs.package) {
        packagesList = Array.isArray(inputs.package) ? inputs.package : [inputs.package];
    }

    if (packagesList.length === 0) {
        return [];
    }

    const commandArgs = [
        "webiny",
        "workspaces",
        "list",
        "--json",
        "--withPath",
        ...packagesList.reduce((current, item) => {
            current.push("--scope", item);
            return current;
        }, [])
    ];

    if (inputs.env) {
        commandArgs.push("--env", inputs.env);
    }

    return execa("yarn", commandArgs).then(({ stdout }) => {
        const result = JSON.parse(stdout);
        const packages = [];
        for (const packageName in result) {
            const root = result[packageName];
            const configPath = fs.existsSync(path.join(root, "webiny.config.ts"))
                ? path.join(root, "webiny.config.ts")
                : path.join(root, "webiny.config.js");

            try {
                packages.push({
                    name: packageName,
                    config: require(configPath).default || require(configPath),
                    paths: {
                        root,
                        config: configPath
                    }
                });
            } catch (e) {
                if (inputs.debug) {
                    output.log({
                        type: "build",
                        message: `Warning: could not load ${context.warning.hl(
                            configPath
                        )} configuration file:`
                    });

                    output.log({
                        type: "build",
                        message: e.message
                    });

                    output.log({
                        type: "build",
                        message: e.stack
                    });
                }
            }
        }

        return packages;
    });
};
const createLog = ({ multipleWatches, output, context }) => {
    return (packageName, message, type) => {
        let prefix = "";
        if (multipleWatches) {
            prefix = chalk.hex(getRandomColorForString(packageName))(packageName) + ": ";
        }

        let send = "";
        if (Array.isArray(message)) {
            message = message.filter(Boolean);
            if (message.length) {
                const [first, ...rest] = message;
                send = [prefix + first, ...rest].join(" ");
            }
        } else {
            send = prefix + message;
        }

        if (type) {
            if (type === "error") {
                send = context.error.hl(send);
            }
            if (type === "warn") {
                send = context.warning.hl(send);
            }
        }

        output.log({
            type: "build",
            message: send
        });
    };
};
