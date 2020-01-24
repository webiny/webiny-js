const { join, resolve } = require("path");
const ansiEscapes = require("ansi-escapes");
const Context = require("@serverless/cli/src/Context");
const { loadEnv } = require("./utils");

module.exports = async (inputs, method = "default") => {
    const { what, env, debug = false, alias = null } = inputs;
    const cwd = process.cwd();
    // Load .env.json from project root
    await loadEnv(resolve(".env.json"), env, { debug });

    const root = join(cwd, what);
    process.chdir(root);

    const config = {
        root,
        stateRoot: join(root, ".serverless"),
        debug,
        entity: "Webiny"
    };

    const context = new Context(config);
    if (debug) {
        const debugValue = process.env.DEBUG;
        process.env.DEBUG = "webiny*";
        context.debug = require("debug")("webiny");
        process.env.DEBUG = debugValue;
    }
    const Template = require("./template/serverless.js");
    const component = new Template(`Webiny.${env}`, context);
    await component.init();

    const output = await component[method]({ env, debug, alias });
    if (debug) {
        // Add an empty line after debug output for nicer output
        console.log();
    }
    context._.status.running = false;
    process.stdout.write(ansiEscapes.cursorLeft);
    process.stdout.write(ansiEscapes.eraseDown);
    process.stdout.write(ansiEscapes.cursorShow);
    process.chdir(cwd);

    return { output, duration: context._.seconds };
};
