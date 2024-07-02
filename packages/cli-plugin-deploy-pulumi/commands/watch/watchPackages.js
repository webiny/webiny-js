const path = require("path");
const { Worker } = require("worker_threads");
const chalk = require("chalk");
const execa = require("execa");
const { getRandomColorForString } = require("../../utils");
const { WebinyConfigFile } = require("./WebinyConfigFile");

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
    const packages = await getPackages({ inputs, output, context });
    if (packages.length === 0) {
        output.log({
            type: "build",
            message: `Could not watch any of the specified packages.`
        });
        return;
    }

    if (inputs.debug) {
        context.debug("The following packages will be watched for changes:");
        packages.forEach(item => console.log("‣ " + item.name));
    }

    const { env, debug, logs } = inputs;
    const multipleWatches = packages.length > 1;
    if (multipleWatches) {
        output.log({
            type: "build",
            message: `Watching ${context.info.hl(packages.length)} packages...`
        });
    } else {
        output.log({
            type: "build",
            message: `Watching ${context.info.hl(packages[0].name)} package...`
        });
    }

    const log = createLog({ multipleWatches, output, context });

    const commandOptions = { env, debug, logs: !multipleWatches || logs };
    const promises = [];
    for (let i = 0; i < packages.length; i++) {
        const current = packages[i];
        promises.push(
            new Promise(resolve => {
                const worker = new Worker(path.join(__dirname, "./worker.js"), {
                    workerData: {
                        options: commandOptions,
                        package: { ...current.paths }
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
    } else {
        packagesList = await execa("yarn", [
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
            const configPath = WebinyConfigFile.forWorkspace(root).getAbsolutePath();

            if (!configPath) {
                continue;
            }

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
