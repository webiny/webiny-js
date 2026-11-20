import { EncryptionConfig } from "./abstractions.js";
import { BuildParams } from "../buildParams/abstractions.js";

export const DEFAULT_ENCRYPTION_ALGORITHM = "aes-256-gcm";

class BuildParamsEncryptionConfigImpl implements EncryptionConfig.Interface {
    readonly passphrase: string | null;
    readonly salt: string;
    readonly algorithm: string;

    constructor(buildParams: BuildParams.Interface) {
        this.passphrase = buildParams.get<string>("EncryptionPassphrase") || null;
        this.salt = buildParams.get<string>("EncryptionSalt") ?? "";
        this.algorithm =
            buildParams.get<string>("EncryptionAlgorithm") ?? DEFAULT_ENCRYPTION_ALGORITHM;
    }
}

export const BuildParamsEncryptionConfig = EncryptionConfig.createImplementation({
    implementation: BuildParamsEncryptionConfigImpl,
    dependencies: [BuildParams]
});
