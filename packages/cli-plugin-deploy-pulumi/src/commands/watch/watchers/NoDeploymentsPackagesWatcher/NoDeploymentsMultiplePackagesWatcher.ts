import path from "path";
import { Worker } from "worker_threads";
import chalk from "chalk";
import { getRandomColorForString } from "~/utils";
import { BasePackagesWatcher } from "../BasePackagesWatcher";
import type { Context } from "~/types";

export class NoDeploymentsMultiplePackagesWatcher extends BasePackagesWatcher {
    public override async watch(): Promise<void> {
        const packages = this.packages;
        const context = this.context;
        const inputs = this.inputs;

        const { env, debug } = inputs;

        context.info(`Watching %s packages...`, packages.length);

        if (inputs.debug) {
            context.debug("The following packages will be watched for changes:");
            packages.forEach(item => console.log("‣ " + item.name));
        }

        const commandOptions = { env, debug, logs: true };
        const log = createLog({ context });

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
                         * Check if we want to log here.
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
    }
}

interface ICreateLogParams {
    context: Context;
}

const createLog = ({ context }: ICreateLogParams) => {
    return (packageName: string, message: (string | Error)[] | string, type?: "error" | "warn") => {
        const prefix = chalk.hex(getRandomColorForString(packageName))(packageName) + ": ";

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

        send = send.trim().replace(/^\s+|\s+$/g, "");
        if (!send) {
            return;
        }

        console.log(send);
    };
};

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
