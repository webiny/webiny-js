const run = require("./run");
const telemetry = require("./telemetry");
const wcp = require("./wcp");
const upgrade = require("./upgrade");

module.exports.createCommands = async (yargs, context) => {
    context.plugins.register(run, telemetry, upgrade, wcp);

    await context.loadUserPlugins();

    context.plugins.byType("cli-command").forEach(plugin => {
        plugin.create({ yargs, context });
    });
};
