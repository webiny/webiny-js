const { createPulumiCommand } = require("../utils");

module.exports = createPulumiCommand({
    name: "output",
    createProjectApplicationWorkspace: false,
    command: async ({ inputs, context, pulumi }) => {
        const { env, folder, json } = inputs;

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

        if (stackExists) {
            return pulumi.run({
                command: ["stack", "output"],
                args: {
                    json
                },
                execa: { stdio: "inherit" }
            });
        }

        if (json) {
            return console.log(JSON.stringify(null));
        }

        context.error(`Project application %s (%s environment) does not exist.`, folder, env);
    }
});
