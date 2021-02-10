const run = require("./run");
const tracking = require("./tracking");

module.exports.createCommands = (yargs, context) => {
    context.plugins.register(run, tracking);

    context.loadUserPlugins();

    context.plugins.byType("cli-command").forEach(plugin => {
        plugin.create({ yargs, context });
    });
};
