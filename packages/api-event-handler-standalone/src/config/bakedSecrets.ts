import type { BuildParams } from "@webiny/api-core/features/buildParams/index.js";

// Baked by the shared <Infra.Crypto.*> from @webiny/project (used on AWS). Never valid in standalone.
const BAKED_ENCRYPTION_PASSPHRASE_BUILD_PARAM = "EncryptionPassphrase";
const BAKED_HASHING_PEPPER_BUILD_PARAM = "HashingPepper";

/**
 * Throws when the build contains the encryption passphrase or the hashing pepper. That happens when
 * webiny.config.tsx uses the shared <Infra.Crypto.*> from @webiny/project instead of the standalone
 * ones: the secret would sit in the image, and a different value in env would not match what the
 * project was configured with.
 */
export function assertNoBakedSecrets(buildParams: BuildParams.Interface): void {
    const problems: string[] = [];

    if (buildParams.get<string>(BAKED_ENCRYPTION_PASSPHRASE_BUILD_PARAM)) {
        problems.push(
            "The build contains the encryption passphrase (EncryptionPassphrase build param), so " +
                "webiny.config.tsx uses <Infra.Crypto.Encryption> from @webiny/project. Use the one " +
                "from @webiny/project-standalone, which reads WEBINY_ENCRYPTION_PASSPHRASE at startup."
        );
    }

    if (buildParams.get<string>(BAKED_HASHING_PEPPER_BUILD_PARAM)) {
        problems.push(
            "The build contains the hashing pepper (HashingPepper build param), so webiny.config.tsx " +
                "uses <Infra.Crypto.Hashing> from @webiny/project. Use the one from " +
                "@webiny/project-standalone, which reads WEBINY_HASHING_PEPPER at startup."
        );
    }

    if (problems.length > 0) {
        throw new Error(["The standalone API build is misconfigured:", ...problems].join("\n  "));
    }
}
