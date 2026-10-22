import { EncryptionConfig } from "@webiny/api-core/features/encryption/index.js";
import { DEFAULT_ENCRYPTION_ALGORITHM } from "@webiny/api-core/features/encryption/index.js";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { StandaloneConfig } from "~/config/abstractions.js";
import { isEncryptionDeclared } from "~/config/declaredSecrets.js";

/**
 * Standalone: the passphrase and salt come from env (`WEBINY_ENCRYPTION_PASSPHRASE`,
 * `WEBINY_ENCRYPTION_SALT`), the algorithm from the build. Encryption is on only when the build
 * declares it, so a stray env var can't turn it on for a project that never encrypted.
 */
class StandaloneEncryptionConfigImpl implements EncryptionConfig.Interface {
    readonly passphrase: string | null;
    readonly salt: string;
    readonly algorithm: string;

    constructor(config: StandaloneConfig.Interface, buildParams: BuildParams.Interface) {
        const declared = isEncryptionDeclared(buildParams);
        this.passphrase = declared ? config.encryption.passphrase : null;
        this.salt = config.encryption.salt;
        this.algorithm =
            buildParams.get<string>("EncryptionAlgorithm") ?? DEFAULT_ENCRYPTION_ALGORITHM;
    }
}

export const StandaloneEncryptionConfig = EncryptionConfig.createImplementation({
    implementation: StandaloneEncryptionConfigImpl,
    dependencies: [StandaloneConfig, BuildParams]
});
