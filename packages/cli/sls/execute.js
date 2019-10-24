const { join } = require("path");
const ansiEscapes = require("ansi-escapes");
const Context = require("@serverless/cli/src/Context");

module.exports = async (inputs, method = "default") => {
    const { what, env, debug = false } = inputs;
    const cwd = process.cwd();
    const root = join(cwd, what);
    process.chdir(root);

    const config = {
        root,
        stateRoot: join(root, ".serverless"),
        debug,
        entity: "Webiny"
    };

    const context = new Context(config);
    const Template = require("./template/serverless.js");
    const component = new Template(`Webiny.${env}`, context);
    await component.init();

    const output = await component[method]({ env, debug });
    context._.status.running = false;
    process.stdout.write(ansiEscapes.cursorLeft);
    process.stdout.write(ansiEscapes.eraseDown);
    process.stdout.write(ansiEscapes.cursorShow);
    process.chdir(cwd);

    return { output, duration: context._.seconds };
};
