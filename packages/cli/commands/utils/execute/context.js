const { join } = require("path");
const ansiEscapes = require("ansi-escapes");
const Context = require("@serverless/cli/src/Context");

const createContext = ({ root, debug }) => {
    const context = new Context({
        root,
        stateRoot: join(root, ".webiny"),
        debug,
        entity: "Webiny"
    });

    if (debug) {
        context.debug = require("debug")("webiny");
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
