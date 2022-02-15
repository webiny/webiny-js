const run = require("./run");
const telemetry = require("./telemetry");
const wcp = require("./wcp");
const upgrade = require("./upgrade");

module.exports.createCommands = async (yargs, context) => {
    context.plugins.register(run, telemetry, upgrade);

    // For now, only register WCP related commands if
    // `WCP_APP_URL` and `WCP_API_URL` env vars are defined.
    if (process.env.WCP_APP_URL && process.env.WCP_API_URL) {
        context.plugins.register(wcp);
    }
    await context.loadUserPlugins();

    context.plugins.byType("cli-command").forEach(plugin => {
        plugin.create({ yargs, context });
    });
};
