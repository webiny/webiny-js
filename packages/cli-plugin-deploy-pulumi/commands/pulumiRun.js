const { createPulumiCommand } = require("../utils");

module.exports = createPulumiCommand({
    name: "pulumi",
    createProjectApplicationWorkspace: false,
    command: async ({ inputs, context, pulumi }) => {
        const [, ...command] = inputs._;
        const { env, folder, debug, variant } = inputs;

        if (env) {
            debug && context.debug(`Environment provided - selecting %s Pulumi stack.`, env);

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
            } catch {
                stackExists = false;
            }

            if (!stackExists) {
                throw new Error(
                    `Project application ${context.error.hl(folder)} (${context.error.hl(
                        env
                    )} environment) does not exist.`
                );
            }
        }

        if (debug) {
            debug &&
                context.debug(
                    `Running the following command in %s folder: %s`,
                    folder,
                    "pulumi " + command.join(" ")
                );
        }

        return pulumi.run({
            command,
            execa: {
                stdio: "inherit",
                env: {
                    WEBINY_ENV: env,
                    WEBINY_VARIANT: variant,
                    WEBINY_PROJECT_NAME: context.project.name
                }
            }
        });
    }
});
