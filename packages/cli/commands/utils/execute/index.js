const { resolve, join } = require("path");
const { loadEnv } = require("../index");
const { Context } = require("./Context");
const { paths } = require("../paths");

module.exports.execute = async (inputs, method = "default") => {
    const { env, debug, folder } = inputs;
    const { projectName } = require(join(paths.projectRoot, "webiny.config.js"));

    // Load .env.json from project root
    await loadEnv(resolve(paths.projectRoot, ".env.json"), env, { debug });
    const context = new Context({
        stateRoot: join(paths.projectRoot, ".webiny", "state", folder, env),
        id: `${projectName}_${folder}`,
        env,
        debug
    });

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
    } catch (err) {
        context.clearStatus();
        console.log();
        console.log(err);
        console.log();
    } finally {
        context.clearStatus();
    }
};
