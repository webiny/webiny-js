module.exports = getPulumiEnvVars = () => {
    const PULUMI_SECRETS_PROVIDER = process.env.PULUMI_SECRETS_PROVIDER || "passphrase";
    const PULUMI_CONFIG_PASSPHRASE = process.env.PULUMI_CONFIG_PASSPHRASE || "";

    return { PULUMI_SECRETS_PROVIDER, PULUMI_CONFIG_PASSPHRASE };
};
