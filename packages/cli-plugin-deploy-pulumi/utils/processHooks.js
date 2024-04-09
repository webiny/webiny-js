const { GracefulError } = require("./GracefulError");

module.exports = async (hook, { context, ...options }) => {
    const plugins = context.plugins.byType(hook);

    for (let i = 0; i < plugins.length; i++) {
        try {
            await plugins[i].hook(options, context);
        } catch (err) {
            if (err instanceof GracefulError) {
                throw err;
            }

            err.message = `An error occurred while processing ${context.error.hl(
                plugins[i].name
            )} plugin: ${err.message}`;

            throw err;
        }
    }
};
