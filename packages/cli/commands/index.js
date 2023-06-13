const about = require("./about");
const run = require("./run");
const telemetry = require("./telemetry");
const upgrade = require("./upgrade");

module.exports.createCommands = async (yargs, context) => {
    context.plugins.register(about, run, telemetry, upgrade);

    try {
        const wcp = require("./wcp");
        context.plugins.register(wcp);
    } catch {
        // Skip WCP command
    }

    await context.loadUserPlugins();

    context.plugins.byType("cli-command").forEach(plugin => {
        plugin.create({ yargs, context });
    });
};
