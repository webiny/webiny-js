const { join, resolve } = require("path");
const { loadEnv } = require("../index");
const { createContext } = require("./context");

module.exports.execute = async (inputs, method = "default") => {
    const { what, env, debug } = inputs;
    const cwd = process.cwd();

    // Load .env.json from project root
    await loadEnv(resolve(".env.json"), env, { debug });

    // Change CWD to `api` or `apps`
    const root = join(cwd, what);
    process.chdir(root);
    const context = createContext({ root, debug });

    try {
        const Template = require("./template");
        const component = new Template(`Webiny.${env}`, context);
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
        process.chdir(cwd);
    }
};
