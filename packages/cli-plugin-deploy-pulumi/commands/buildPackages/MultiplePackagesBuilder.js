const path = require("path");
const { Worker } = require("worker_threads");
const Listr = require("listr");
const { BasePackageBuilder } = require("./BasePackageBuilder");

const parseMessage = message => {
    try {
        return JSON.parse(message);
    } catch (e) {
        return {
            type: "error",
            message: `Could not parse received build result (JSON): ${message}`
        };
    }
};

class MultiplePackagesBuilder extends BasePackageBuilder {
    async build() {
        const packages = [this.packages[0]];
        const context = this.context;
        const inputs = this.inputs;

        const start = new Date();
        const getDuration = () => {
            return (new Date() - start) / 1000 + "s";
        };

        const { env, variant, debug } = inputs;

        context.info(`Building %s packages...`, packages.length);

        const buildTasks = [];
        const stats = { success: 0, warning: 0, error: 0 };

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];
            const start = new Date();

            buildTasks.push({
                pkg: pkg,
                task: new Promise((resolve, reject) => {
                    const enableLogs = inputs.logs === true;

                    const workerData = {
                        options: {
                            env,
                            variant,
                            debug,
                            logs: enableLogs
                        },
                        package: { ...pkg.paths }
                    };

                    const worker = new Worker(path.join(__dirname, "./worker.js"), {
                        workerData,
                        stderr: true,
                        stdout: true
                    });

                    worker.on("message", threadMessage => {
                        const { type, stdout, stderr } = parseMessage(threadMessage);

                        if (type === "error") {
                            return reject({
                                package: pkg,
                                stdout,
                                stderr,
                                duration: getDuration()
                            });
                        }

                        if (type === "success") {
                            return resolve({
                                package: pkg,
                                stdout,
                                stderr,
                                duration: getDuration()
                            });
                        }
                    });

                    // worker.on("error", threadMessage => {
                    //     const message = "wooot";
                    //
                    //     console.log(threadMessage)
                    //     reject({
                    //         package: pkg,
                    //         error: message,
                    //         duration: getDuration()
                    //     });
                    // });
                    //
                    // worker.on("exit", (code, a) => {
                    //     console.log("EXIT EVENT", code, a);
                    //     if (code === 0) {
                    //         return;
                    //     }
                    //
                    //     stats.error++;
                    //     context.error(`An error occurred while building %s package.`, pkg.name);
                    //
                    //     reject({
                    //         package: pkg,
                    //         result: {
                    //             message: `Process exited with a non-zero exit code.`
                    //         }
                    //     });
                    // });
                })
            });
        }

        // await Promise.all(buildTasks);

        const tasks = new Listr(
            buildTasks.map(buildTask => {
                return {
                    title: buildTask.pkg.name,
                    task: () => buildTask.task
                };
            }),
            { concurrent: true }
        );

        await tasks.run().catch(err => {
            console.error(err.stdout);
        })

        // console.log();
        //
        // if (stats.error > 0) {
        //     const errorsCount = context.error.hl(stats.error);
        //     const errorsWord = stats.error === 1 ? "error" : "errors";
        //     const errorsOccurred = `(${errorsCount} ${errorsWord} occurred)`;
        //
        //     throw new Error(`Failed to build all packages ${errorsOccurred}.`);
        // }
        //
        // const duration = (new Date() - start) / 1000 + "s";
        //
        // context.success(
        //     `Successfully built %s packages in %s.`,
        //     projectApplication.packages.length,
        //     duration
        // );
    }
}

module.exports = { MultiplePackagesBuilder };
