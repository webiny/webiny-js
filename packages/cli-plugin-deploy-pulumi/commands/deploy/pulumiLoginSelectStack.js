const { login } = require("../../utils");

module.exports = async ({ inputs, projectApplication, pulumi }) => {
    const { env } = inputs;

    await login(projectApplication);

    const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER;
    const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE;

    await pulumi.run({
        command: ["stack", "select", env],
        args: {
            create: true,
            secretsProvider: PULUMI_SECRETS_PROVIDER
        },
        execa: {
            env: {
                PULUMI_CONFIG_PASSPHRASE
            }
        }
    });
};
