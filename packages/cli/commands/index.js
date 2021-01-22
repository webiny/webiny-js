const run = require("./run");

module.exports.createCommands = (yargs, context) => {
    context.plugins.register(run);

    context.loadUserPlugins();

    context.plugins.byType("cli-command").forEach(plugin => {
        plugin.create({ yargs, context });
    });
};
