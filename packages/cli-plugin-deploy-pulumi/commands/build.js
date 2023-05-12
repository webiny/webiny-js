const buildPackages = require("./deploy/buildPackages");
const { createPulumiCommand, runHook } = require("../utils");

module.exports = (params, context) => {
    const command = createPulumiCommand({
        name: "build",
        createProjectApplicationWorkspace: true,
        command: async ({ inputs, context, projectApplication }) => {
            const { env } = inputs;

            const hookArgs = { context, env, inputs, projectApplication };

            await runHook({
                hook: "hook-before-build",
                args: hookArgs,
                context
            });

            await buildPackages({ projectApplication, inputs, context });

            await runHook({
                hook: "hook-after-build",
                args: hookArgs,
                context
            });
        }
    });

    return command(params, context);
};
