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

        const hasBuildCommand = config.commands && typeof config.commands.build === "function";
        if (!hasBuildCommand) {
            throw new Error("Build command not found.");
        }

        await config.commands.build(options);
        parentPort.postMessage(JSON.stringify({ type: "success" }));
        process.exit(0);
    } catch (e) {
        console.log(e.stack);
        parentPort.postMessage(JSON.stringify({ type: "error", message: e.message }));
    }
});
