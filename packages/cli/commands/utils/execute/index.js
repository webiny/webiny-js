const { resolve } = require("path");
const { loadEnv } = require("../index");
const { Context } = require("./Context");
const { paths } = require("../paths");

module.exports.execute = async (inputs, method = "default") => {
    const { env, debug } = inputs;

    // Load .env.json from project root
    await loadEnv(resolve(paths.projectRoot, ".env.json"), env, { debug });
    const context = new Context({ env, debug });

    try {
        const Template = require("./template");
        const component = new Template(`Webiny`, context);
        await component.init();

        // IMPORTANT: In `watch` mode, this promise will never resolve.
        // We need it to keep webpack compilers running.
        await component[method](inputs);

        if (debug) {
            // Add an empty line after debug output for nicer output
            console.log();
        }
    } finally {
        context.clearStatus();
    }
};
