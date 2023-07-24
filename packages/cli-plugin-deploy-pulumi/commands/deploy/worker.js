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
        const { options, package: pkg } = workerData;

        let config = require(pkg.paths.config).default || require(pkg.paths.config);
        if (typeof config === "function") {
            config = config({ options: { ...options, cwd: pkg.paths.root }, context: cli });
        }

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
})();
