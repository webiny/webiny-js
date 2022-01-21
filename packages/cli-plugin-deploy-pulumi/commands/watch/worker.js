const { parentPort } = require("worker_threads");
const { importModule } = require("@webiny/cli/utils");

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
        const config = importModule(pckg.paths.config);
        await config.commands.watch(options);
    } catch (e) {
        console.log(e.stack);
        console.error(e);
    }
});
