import { EncryptionConfig } from "@webiny/api-core/features/encryption/index.js";
import { DEFAULT_ENCRYPTION_ALGORITHM } from "@webiny/api-core/features/encryption/index.js";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { StandaloneConfig } from "~/config/abstractions.js";

/**
 * Standalone: encryption is always on. The passphrase and salt come from env
 * (`WEBINY_ENCRYPTION_PASSPHRASE`, `WEBINY_ENCRYPTION_SALT`), the algorithm from the build.
 */
class StandaloneEncryptionConfigImpl implements EncryptionConfig.Interface {
    readonly passphrase: string;
    readonly salt: string;
    readonly algorithm: string;

    constructor(config: StandaloneConfig.Interface, buildParams: BuildParams.Interface) {
        this.passphrase = config.encryption.passphrase;
        this.salt = config.encryption.salt;
        this.algorithm =
            buildParams.get<string>("EncryptionAlgorithm") ?? DEFAULT_ENCRYPTION_ALGORITHM;
    }
}

export const StandaloneEncryptionConfig = EncryptionConfig.createImplementation({
    implementation: StandaloneEncryptionConfigImpl,
    dependencies: [StandaloneConfig, BuildParams]
});
