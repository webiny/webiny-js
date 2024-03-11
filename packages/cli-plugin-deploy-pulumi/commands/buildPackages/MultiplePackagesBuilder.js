const path = require("path");
const { Worker } = require("worker_threads");
const Listr = require("listr");
const { BasePackageBuilder } = require("./BasePackageBuilder");

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

        for (let i = 0; i < packages.length; i++) {
            const pkg = packages[i];

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
                        const { type, stdout, stderr, errorMessage } = JSON.parse(threadMessage);

                        if (type === "error") {
                            return reject({
                                package: pkg,
                                stdout,
                                stderr,
                                errorMessage,
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
                })
            });
        }

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
            console.log(err);
        })
    }
}

module.exports = { MultiplePackagesBuilder };
