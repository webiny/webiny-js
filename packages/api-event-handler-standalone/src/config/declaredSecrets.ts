import type { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import type { StandaloneConfig } from "./abstractions.js";

/*
 * Markers baked by project-standalone's `<Infra.Crypto.Encryption>` and `<Infra.Crypto.Hashing>`
 * (src/extensions/Encryption.tsx, Hashing.tsx). They say the project uses the feature; the secret
 * itself comes from env.
 */
const ENCRYPTION_ENABLED_BUILD_PARAM = "EncryptionEnabled";
const HASHING_PEPPER_ENABLED_BUILD_PARAM = "HashingPepperEnabled";

function isSet(buildParams: BuildParams.Interface, key: string): boolean {
    const value = buildParams.get<boolean | string>(key);
    return value === true || value === "true";
}

export function isEncryptionDeclared(buildParams: BuildParams.Interface): boolean {
    return isSet(buildParams, ENCRYPTION_ENABLED_BUILD_PARAM);
}

export function isHashingPepperDeclared(buildParams: BuildParams.Interface): boolean {
    return isSet(buildParams, HASHING_PEPPER_ENABLED_BUILD_PARAM);
}

/**
 * Throws, naming every variable, when the build declares a secret that env doesn't supply. Without
 * the passphrase an encrypting project would store plaintext and fail to read what it encrypted
 * before; without the pepper no stored hash would verify.
 */
export function assertDeclaredSecrets(
    buildParams: BuildParams.Interface,
    config: StandaloneConfig.Interface
): void {
    const problems: string[] = [];

    if (isEncryptionDeclared(buildParams) && !config.encryption.passphrase) {
        problems.push(
            "WEBINY_ENCRYPTION_PASSPHRASE is not set, but the build uses <Infra.Crypto.Encryption>."
        );
    }

    if (isHashingPepperDeclared(buildParams) && !config.hashing.pepper) {
        problems.push(
            "WEBINY_HASHING_PEPPER is not set, but the build uses <Infra.Crypto.Hashing pepper>."
        );
    }

    if (problems.length > 0) {
        throw new Error(
            ["The standalone API is missing required configuration:", ...problems].join("\n  ")
        );
    }
}
