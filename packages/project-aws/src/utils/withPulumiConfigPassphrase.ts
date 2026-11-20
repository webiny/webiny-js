import { createConfiguration } from "@webiny/project/utils/env/configuration.js";

export const withPulumiConfigPassphrase = (passphrase?: string) => {
    // TODO: use PulumiGetConfigPassphraseService instead.
    return createConfiguration(() => {
        return {
            PULUMI_CONFIG_PASSPHRASE: passphrase || process.env.PULUMI_CONFIG_PASSPHRASE || "webiny"
        };
    });
};
