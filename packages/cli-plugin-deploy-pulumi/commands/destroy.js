const { createPulumiCommand, processHooks } = require("../utils");

module.exports = createPulumiCommand({
    name: "destroy",
    // We want to create a workspace just because there are cases where the destroy command is called
    // without the deployment happening initially (e.g. CI/CD scaffold's `pullRequestClosed.yml` workflow).
    createProjectApplicationWorkspace: true,
    command: async ({ inputs, context, projectApplication, pulumi, getDuration }) => {
        const { env, folder } = inputs;

        let stackExists = true;
        try {
            const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
            const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

            await pulumi.run({
                command: ["stack", "select", env],
                args: {
                    secretsProvider: PULUMI_SECRETS_PROVIDER
                },
                execa: {
                    env: {
                        PULUMI_CONFIG_PASSPHRASE
                    }
                }
            });
        } catch (e) {
            stackExists = false;
        }

        if (!stackExists) {
            context.error(`Project application %s (%s} environment) does not exist.`, folder, env);
            return;
        }

        const hooksParams = { context, env, projectApplication };

        await processHooks("hook-before-destroy", hooksParams);

        await pulumi.run({
            command: "destroy",
            args: {
                debug: inputs.debug,
                yes: true
            },
            execa: {
                stdio: "inherit",
                env: {
                    WEBINY_ENV: env,
                    WEBINY_PROJECT_NAME: context.project.name
                }
            }
        });

        console.log();

        context.success(`Done! Destroy finished in %s.`, getDuration());

        await processHooks("hook-after-destroy", hooksParams);
    }
});
