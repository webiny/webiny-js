const { PackagesBuilder } = require("./buildPackages/PackagesBuilder");
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

            console.log()

            const builder = new PackagesBuilder({
                packages: projectApplication.packages,
                inputs,
                context
            });

            await builder.build();

            console.log();

            await runHook({
                hook: "hook-after-build",
                args: hookArgs,
                context
            });
        }
    });

    return command(params, context);
};
