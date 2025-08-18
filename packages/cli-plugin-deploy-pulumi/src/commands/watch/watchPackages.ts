import type { Context, IUserCommandInput } from "~/types";
import path from "path";
import { Worker } from "worker_threads";
import chalk from "chalk";
import execa from "execa";
import { getRandomColorForString, requireConfig } from "~/utils";
import { WebinyConfigFile } from "./WebinyConfigFile";
import type { SimpleOutput } from "./output/simpleOutput";

const parseMessage = (message: string) => {
    try {
        return JSON.parse(message);
    } catch {
        return {
            type: "error",
            message: `Could not parse received watch result (JSON): ${message}`
        };
    }
};

export interface IWatchPackagesParams {
    inputs: IUserCommandInput;
    output: SimpleOutput;
    context: Context;
}

export const watchPackages = async ({ inputs, output, context }: IWatchPackagesParams) => {
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
                    /**
                     * TODO @adrian
                     *
                     *
                     * Check this error log.
                     */
                    console.error(e);

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

interface IGetPackagesParams {
    inputs: IUserCommandInput;
    output: SimpleOutput;
    context: Context;
}

const getPackages = async ({ inputs, context, output }: IGetPackagesParams) => {
    let packagesList: string[] = [];
    if (inputs.package) {
        packagesList = Array.isArray(inputs.package) ? inputs.package : [inputs.package];
    } else {
        const command: string[] = [
            "webiny",
            "workspaces",
            "tree",
            "--json",
            "--depth",
            String(inputs.depth || ""),
            "--distinct",
            "--folder",
            inputs.folder
        ];
        packagesList = await execa("yarn", command).then(({ stdout }) => JSON.parse(stdout));
    }

    const commandArgs: string[] = [
        "webiny",
        "workspaces",
        "list",
        "--json",
        "--withPath",
        ...packagesList.reduce<string[]>((current, item) => {
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
                const config = requireConfig(configPath);
                packages.push({
                    name: packageName,
                    config,
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

interface ICreateLogParams {
    multipleWatches: boolean;
    output: SimpleOutput;
    context: Context;
}

const createLog = ({ multipleWatches, output, context }: ICreateLogParams) => {
    return (
        packageName: string,
        message: (string | Error)[] | string | Error,
        type?: "error" | "warn"
    ) => {
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
