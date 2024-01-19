const path = require("path");
const { Worker } = require("worker_threads");
const chalk = require("chalk");

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

module.exports = async ({ projectApplication, inputs, context }) => {
    const start = new Date();

    const { env, variant, debug } = inputs;
    let multipleBuilds = false;
    switch (projectApplication.packages.length) {
        case 0:
            context.info(`No packages to build...`);
            return;
        case 1:
            context.info(`Building %s package...`, projectApplication.packages[0].name);
            break;
        default:
            multipleBuilds = true;
            context.info(`Building %s packages...`, projectApplication.packages.length);
            break;
    }

    const log = (packageName, message) => {
        let prefix = "";
        if (multipleBuilds) {
            prefix = chalk.blueBright(packageName) + ": ";
        }

        if (Array.isArray(message)) {
            message = message.filter(Boolean);
            if (message.length) {
                const [first, ...rest] = message;
                console.log(prefix + first, ...rest);
            }
        } else {
            console.log(prefix + message);
        }
    };

    console.log();

    const promises = [];
    const stats = { success: 0, warning: 0, error: 0 };
    for (let i = 0; i < projectApplication.packages.length; i++) {
        const current = projectApplication.packages[i];
        const start = new Date();

        promises.push(
            new Promise(resolve => {
                let enableLogs = inputs.logs;
                if (typeof enableLogs === "undefined") {
                    enableLogs = !multipleBuilds;
                }

                const workerData = {
                    options: {
                        env,
                        variant,
                        debug,
                        logs: enableLogs
                    },
                    package: { ...current.paths }
                };

                const worker = new Worker(path.join(__dirname, "./worker.js"), { workerData });
                worker.on("message", threadMessage => {
                    const { type, message } = parseMessage(threadMessage);

                    if (type === "error") {
                        stats.error++;
                        context.error(current.name);

                        if (Array.isArray(message)) {
                            for (const msg of message) {
                                console.log(msg);
                            }
                        } else {
                            console.log(message);
                        }

                        console.log();
                        return resolve({
                            package: current,
                            error: message
                        });
                    }

                    if (type === "success") {
                        if (multipleBuilds) {
                            stats.success++;
                            const duration = (new Date() - start) / 1000 + "s";
                            context.success(`${current.name} (%s)`, duration);
                        }

                        return resolve({
                            package: current,
                            error: message
                        });
                    }

                    log(current.name, message);
                });

                worker.on("error", () => {
                    stats.error++;
                    context.error(
                        `An unknown error occurred while building %s package.`,
                        current.name
                    );

                    resolve({
                        package: current,
                        result: {
                            message: `An unknown error occurred.`
                        }
                    });
                });

                worker.on("exit", code => {
                    if (code === 0) {
                        return;
                    }

                    stats.error++;
                    context.error(`An error occurred while building %s package.`, current.name);

                    resolve({
                        package: current,
                        result: {
                            message: `Process exited with a non-zero exit code.`
                        }
                    });
                });
            })
        );
    }

    await Promise.all(promises);

    console.log();

    if (stats.error > 0) {
        const errorsCount = context.error.hl(stats.error);
        const errorsWord = stats.error === 1 ? "error" : "errors";
        const errorsOccurred = `(${errorsCount} ${errorsWord} occurred)`;

        throw new Error(`Failed to build all packages ${errorsOccurred}.`);
    }

    const duration = (new Date() - start) / 1000 + "s";

    if (multipleBuilds) {
        context.success(
            `Successfully built %s packages in %s.`,
            projectApplication.packages.length,
            duration
        );
    } else {
        context.success(
            `Successfully built %s in %s.`,
            projectApplication.packages[0].name,
            duration
        );
    }
};
