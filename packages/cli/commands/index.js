const WEBINY = "webiny*";

if (!process.env.DEBUG) {
    process.env.DEBUG = WEBINY;
}

if (!process.env.DEBUG.includes(WEBINY)) {
    process.env.DEBUG += `,${WEBINY}`;
}

const path = require("path");
const tracking = require("./tracking");
const deploy = require("./components/deploy");
const remove = require("./components/remove");
const run = require("./run");

module.exports.createCommands = (yargs, context) => {
    context.plugins.register(deploy, run, remove, tracking);

    const webinyConfig = require(path.join(context.paths.projectRoot, "webiny.config.js"));

    if (webinyConfig.cli) {
        const plugins = webinyConfig.cli.plugins || [];
        context.plugins.register(
            plugins.map(plugin => {
                if (typeof plugin === "string") {
                    return require(path.join(paths.projectRoot, plugin));
                }
                return plugin;
            })
        );
    }

    context.plugins.byType("cli-command").forEach(plugin => {
        plugin.create({ yargs, context });
    });
};
