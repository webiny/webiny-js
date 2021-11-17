const { parentPort } = require("worker_threads");
require("@webiny/cli/utils/importModule");

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
        console.error(e);
    }
});
