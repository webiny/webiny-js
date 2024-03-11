const path = require("path");
const { Worker } = require("worker_threads");
const { BasePackageBuilder } = require("./BasePackageBuilder");

class SinglePackageBuilder extends BasePackageBuilder {
    async build() {
        const pkg = this.packages[0];
        const context = this.context;
        const inputs = this.inputs;

        const { env, variant, debug } = inputs;

        context.info(`Building %s package...`, pkg.name);

        console.log();

        try {
            await new Promise((resolve, reject) => {
                let enableLogs = inputs.logs !== false;

                const workerData = {
                    options: {
                        env,
                        variant,
                        debug,
                        logs: enableLogs
                    },
                    package: { ...pkg.paths }
                };

                const worker = new Worker(path.join(__dirname, "./worker.js"), { workerData });
                worker.on("message", threadMessage => {
                    const { type, message } = parseMessage(threadMessage);

                    if (type === "success") {
                        return resolve();
                    }

                    if (type === "error") {
                        return reject();
                    }

                    if (Array.isArray(message)) {
                        const messagesArray = message.filter(Boolean);
                        if (messagesArray.length) {
                            const [first, ...rest] = messagesArray;
                            console.log(first, ...rest);
                        }
                    } else {
                        console.log(message);
                    }
                });

                worker.on("error", () => {
                    return reject();
                });
            });
        } catch (e) {
            console.log("oo");
            console.log(e)
        }
    }
}

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

module.exports = { SinglePackageBuilder };
