const { green } = require("chalk");

module.exports = async (hook, { context, ...options }) => {
    const plugins = context.plugins.byType(hook);

    for (let i = 0; i < plugins.length; i++) {
        try {
            await plugins[i].hook(options, context);
        } catch (err) {
            context.error(`Hook ${green(plugins[i].name)} encountered an error: ${err.message}`);
        }
    }
};
