const { parentPort, workerData } = require("worker_threads");
require("@webiny/cli/utils/importModule");
const { cli } = require("@webiny/cli");

// We need this because tools have internal console.log calls. So,
// let's intercept those and make sure messages are just forwarded
// to the main thread.
const types = ["log", "error", "warn"];
for (let i = 0; i < types.length; i++) {
    const type = types[i];
    console[type] = (...message) => {
        parentPort.postMessage(
            JSON.stringify({
                type,
                message: message.filter(Boolean).map(m => {
                    if (m instanceof Error) {
                        return m.message;
                    }
                    return m;
                })
            })
        );
    };
}

(async () => {
    try {
        const { options, package: pckg } = workerData;
        let config = require(pckg.config);
        if (config.default) {
            config = config.default;
        }

        if (typeof config === "function") {
            config = config({ options: { ...options, cwd: pckg.root }, context: cli });
        }

        if (typeof config.commands.watch !== "function") {
            console.log(
                `Skipping watch; ${cli.warning.hl(
                    "watch"
                )} command is missing. Check package's ${cli.warning.hl("webiny.config.ts")} file.`
            );
            return;
        }

        await config.commands.watch(options, cli);
    } catch (e) {
        console.log(e.stack);
        console.error(e);
    }
})();
