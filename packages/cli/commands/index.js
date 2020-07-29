const WEBINY = "webiny*";

if (!process.env.DEBUG) {
    process.env.DEBUG = WEBINY;
}

if (!process.env.DEBUG.includes(WEBINY)) {
    process.env.DEBUG += `,${WEBINY}`;
}

const info = require("./info");
const run = require("./run");

module.exports.createCommands = (yargs, context) => {
    context.plugins.register(run);
    context.plugins.register(info);

    context.loadUserPlugins();

    context.plugins.byType("cli-command").forEach(plugin => {
        plugin.create({ yargs, context });
    });
};
