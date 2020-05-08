const WEBINY = "webiny*";

if (!process.env.DEBUG) {
    process.env.DEBUG = WEBINY;
}

if (!process.env.DEBUG.includes(WEBINY)) {
    process.env.DEBUG += `,${WEBINY}`;
}

const tracking = require("./tracking");
const run = require("./run");

module.exports.createCommands = (yargs, context) => {
    context.plugins.register(run, tracking);

    context.loadUserPlugins();

    context.plugins.byType("cli-command").forEach(plugin => {
        plugin.create({ yargs, context });
    });
};
