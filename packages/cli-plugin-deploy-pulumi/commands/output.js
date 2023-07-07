const { createPulumiCommand, getPulumiEnvVars } = require("../utils");

module.exports = createPulumiCommand({
    name: "output",
    createProjectApplicationWorkspace: false,
    command: async ({ inputs, context, pulumi }) => {
        const { env, folder, json } = inputs;

        const { PULUMI_SECRETS_PROVIDER, PULUMI_CONFIG_PASSPHRASE } = getPulumiEnvVars();

        let stackExists = true;
        try {
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

        if (stackExists) {
            return pulumi.run({
                command: ["stack", "output"],
                args: {
                    json
                },
                execa: {
                    stdio: "inherit",
                    env: {
                        PULUMI_CONFIG_PASSPHRASE
                    }
                }
            });
        }

        if (json) {
            return console.log(JSON.stringify(null));
        }

        context.error(
            `Project application ${context.error.hl(folder)} (${context.error.hl(
                env
            )} environment) does not exist.`
        );
    }
});
