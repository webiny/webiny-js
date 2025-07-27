import path from "path";
import chalk from "chalk";
import { BasePackagesWatcher } from "./BasePackagesWatcher";
import { getRandomColorForString } from "~/utils";
import { Context } from "~/types";
import { fork } from "child_process";
import { deserializeError } from "serialize-error";

const WORKER_PATH = path.resolve(__dirname, "worker.js");

export class MultiplePackagesWatcher extends BasePackagesWatcher {
    public override async watch(): Promise<void> {
        const packages = this.packages;
        const context = this.context;
        const inputs = this.inputs;
        context.info(`Watching %s packages...`, packages.length);
        if (inputs.debug) {
            context.debug("The following packages will be watched for changes:");
            packages.forEach(item => console.log("‣ " + item.name));
        }

        const tasksList = [];

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            const log = createLog({ context, packageName: pkg.name });

            tasksList.push(
                new Promise<void>((resolve, reject) => {
                    const buildConfig = JSON.stringify({
                        ...inputs,
                        package: { paths: pkg.paths }
                    });

                    const child = fork(WORKER_PATH, [buildConfig], {
                        env: { ...process.env },
                        stdio: ["pipe", "pipe", "pipe", "ipc"] // Use "pipe" to handle custom output
                    });

                    // Prefix each line of child stdout with the package name
                    if (child.stdout) {
                        child.stdout.on("data", (chunk: Buffer) => {
                            log(chunk.toString());
                        });
                    }

                    // Prefix each line of child stderr with the package name
                    if (child.stderr) {
                        child.stderr.on("data", (chunk: Buffer) => {
                            log(chunk.toString(), "error");
                        });
                    }

                    // We only send one message from the child process, and that is the error, if any.
                    child.on("message", (serializedError: string) => {
                        const error = deserializeError(serializedError);
                        reject(new Error("Build failed.", { cause: { pkg, error } }));
                    });

                    // Handle child process error events
                    child.on("error", (error: Error) => {
                        reject(new Error("Build failed.", { cause: { pkg, error } }));
                    });

                    // Handle child process exit and check for errors
                    child.on("exit", (code: null) => {
                        if (code !== 0) {
                            const error = new Error(`Build process exited with code ${code}.`);
                            reject(new Error("Build failed.", { cause: { pkg, error } }));
                            return;
                        }

                        resolve();
                    });
                })
            );
        }

        await Promise.all(tasksList);
    }
}

export interface ICreateLogParams {
    context: Pick<Context, "error" | "warning">;
    packageName: string;
}

const createLog = ({ context, packageName }: ICreateLogParams) => {
    const prefix = chalk.hex(getRandomColorForString(packageName))(packageName) + ": ";
    return (message: string, type?: "warn" | "error") => {
        let send = prefix + message;

        if (type) {
            if (type === "error") {
                send = context.error.hl(send);
            }
            if (type === "warn") {
                send = context.warning.hl(send);
            }
        }

        // Trim new lines.
        console.log(send.replace(/\n/g, "").trim());
    };
};

module.exports = { MultiplePackagesWatcher };
