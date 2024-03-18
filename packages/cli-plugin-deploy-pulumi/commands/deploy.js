const { createPulumiCommand, runHook, notify } = require("../utils");
const { BeforeDeployPlugin } = require("../plugins/BeforeDeployPlugin");
const { PackagesBuilder } = require("./buildPackages/PackagesBuilder");
const pulumiLoginSelectStack = require("./deploy/pulumiLoginSelectStack");
const executeDeploy = require("./deploy/executeDeploy");
const executePreview = require("./deploy/executePreview");

module.exports = (params, context) => {
    const command = createPulumiCommand({
        name: "deploy",
        createProjectApplicationWorkspace: params.build,
        telemetry: true,
        command: async commandParams => {
            const { inputs, context, projectApplication, pulumi, getDuration } = commandParams;
            const { env, folder, build, deploy } = inputs;

            const hookArgs = { context, env, inputs, projectApplication };

            if (build) {
                await runHook({
                    hook: "hook-before-build",
                    args: hookArgs,
                    context
                });

                console.log();

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
            } else {
                context.info("Skipping building of packages.");
            }

            console.log();

            if (!deploy) {
                context.info("Skipping project application deployment.");
                return;
            }

            await runHook({
                hook: BeforeDeployPlugin.type,
                args: hookArgs,
                context
            });

            await pulumiLoginSelectStack({ inputs, projectApplication, pulumi });

            console.log();

            if (inputs.preview) {
                await executePreview(commandParams);
            } else {
                await executeDeploy(commandParams);
            }

            console.log();

            await runHook({
                hook: "hook-after-deploy",
                args: hookArgs,
                context
            });

            await notify({ message: `"${folder}" stack deployed in ${getDuration()}.` });
        }
    });

    return command(params, context);
};
