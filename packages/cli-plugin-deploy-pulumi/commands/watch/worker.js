// We need this because tools have internal console.log calls. So,
// let's intercept those and make sure messages are just forwarded
// to the main thread.
console.log = (...message) => {
    parentPort.postMessage(JSON.stringify({ type: "message", message }));
};

const { parentPort } = require("worker_threads");
require("@webiny/cli/utils/importModule");

parentPort.on("message", async params => {
    try {
        const { options, package: pckg } = JSON.parse(params);
        const config = require(pckg.paths.config).default || require(pckg.paths.config);

        const hasWatchCommand = config.commands && typeof config.commands.watch === "function";
        if (!hasWatchCommand) {
            throw new Error("watch command not found.");
        }

        await config.commands.watch(options);
    } catch (e) {
        console.log(e.stack);
        parentPort.postMessage(JSON.stringify({ type: "error", message: e.message }));
    }
});
