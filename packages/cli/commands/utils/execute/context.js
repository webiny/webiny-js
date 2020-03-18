const { join } = require("path");
const ansiEscapes = require("ansi-escapes");
const Context = require("@serverless/cli/src/Context");

const createContext = ({ root, debug }) => {
    const context = new Context({
        root,
        stateRoot: join(root, ".serverless"),
        debug,
        entity: "Webiny"
    });

    if (debug) {
        const debugValue = process.env.DEBUG;
        process.env.DEBUG = "webiny*";
        context.debug = require("debug")("webiny");
        process.env.DEBUG = debugValue;
    }

    context.clearStatus = () => {
        context._.status.running = false;
        process.stdout.write(ansiEscapes.cursorLeft);
        process.stdout.write(ansiEscapes.eraseDown);
        process.stdout.write(ansiEscapes.cursorShow);
    };

    return context;
};

module.exports = { createContext };
