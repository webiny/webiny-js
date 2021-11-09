const { parentPort } = require("worker_threads");
require("@webiny/cli/utils/importModule");

parentPort.on("message", async data => {
    try {
        const { paths } = JSON.parse(data);
        const config = require(paths.config).default || require(paths.config);

        const hasBuildCommand = config.commands && typeof config.commands.build === "function";
        if (!hasBuildCommand) {
            throw new Error("Build command not found.");
        }

        await config.commands.build({}, { log: () => {} });
        parentPort.postMessage(JSON.stringify({ error: null }));
        process.exit(0);
    } catch (e) {
        parentPort.postMessage(JSON.stringify({ error: { message: e.message } }));
        process.exit(1);
    }
});
