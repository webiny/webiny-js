const run = require("./run");
const telemetry = require("./telemetry");
const upgrade = require("./upgrade");

module.exports.createCommands = async (yargs, context) => {
    context.plugins.register(run, telemetry, upgrade);

    await context.loadUserPlugins();

    context.plugins.byType("cli-command").forEach(plugin => {
        plugin.create({ yargs, context });
    });
};
