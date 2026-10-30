import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/feature/api";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { EncryptionConfig } from "@webiny/api-core/features/encryption/index.js";
import { HashingConfig } from "@webiny/api-core/features/hashing/index.js";
import { readStandaloneConfig } from "~/config/readStandaloneConfig.js";
import { assertNoBakedSecrets } from "~/config/bakedSecrets.js";
import { StandaloneConfig } from "~/config/abstractions.js";
import { StandaloneCryptoConfigFeature } from "~/crypto/feature.js";

const requiredEnv = {
    WEBINY_API_URL: "https://api.example.com",
    WEBINY_LOCAL_STORAGE_PATH: "/data/storage",
    WEBINY_UPLOAD_SECRET: "upload-secret",
    WEBINY_ENCRYPTION_PASSPHRASE: "passphrase",
    WEBINY_HASHING_PEPPER: "pepper"
};

const createBuildParams = (params: Record<string, unknown>): BuildParams.Interface => {
    return {
        get: <T>(key: string) => (params[key] ?? null) as T | null
    };
};

const resolveConfigs = (env: Record<string, string>, params: Record<string, unknown>) => {
    const container = new Container();
    container.registerInstance(StandaloneConfig, readStandaloneConfig({ ...requiredEnv, ...env }));
    container.registerInstance(BuildParams, createBuildParams(params));
    StandaloneCryptoConfigFeature.register(container);
    const encryption = container.resolve(EncryptionConfig);
    const hashing = container.resolve(HashingConfig);
    return { encryption, hashing };
};

describe("assertNoBakedSecrets", () => {
    it("passes a build that bakes no secrets", () => {
        const buildParams = createBuildParams({
            EncryptionAlgorithm: "aes-128-gcm",
            HashingCost: 32768
        });

        expect(() => assertNoBakedSecrets(buildParams)).not.toThrow();
    });

    it("refuses a build that bakes the passphrase or pepper", () => {
        // What the shared <Infra.Crypto.*> from @webiny/project renders.
        const buildParams = createBuildParams({
            EncryptionPassphrase: "baked-passphrase",
            HashingPepper: "baked-pepper"
        });

        expect(() => assertNoBakedSecrets(buildParams)).toThrowError(
            [
                "The standalone API build is misconfigured:",
                "The build contains the encryption passphrase (EncryptionPassphrase build param), so webiny.config.tsx uses <Infra.Crypto.Encryption> from @webiny/project. Use the one from @webiny/project-standalone, which reads WEBINY_ENCRYPTION_PASSPHRASE at startup.",
                "The build contains the hashing pepper (HashingPepper build param), so webiny.config.tsx uses <Infra.Crypto.Hashing> from @webiny/project. Use the one from @webiny/project-standalone, which reads WEBINY_HASHING_PEPPER at startup."
            ].join("\n  ")
        );
    });
});

describe("standalone crypto configs", () => {
    it("take the secrets from env and the rest from the build", () => {
        const { encryption, hashing } = resolveConfigs(
            { WEBINY_ENCRYPTION_SALT: "salt" },
            { EncryptionAlgorithm: "aes-128-gcm", HashingCost: "32768" }
        );

        expect(encryption).toEqual({
            passphrase: "passphrase",
            salt: "salt",
            algorithm: "aes-128-gcm"
        });
        expect(hashing).toEqual({ pepper: "pepper", costN: 32768 });
    });

    it("always encrypt and pepper, with defaults for the algorithm and cost", () => {
        const { encryption, hashing } = resolveConfigs({}, {});

        expect(encryption.passphrase).toBe("passphrase");
        expect(encryption.algorithm).toBe("aes-256-gcm");
        expect(hashing).toEqual({ pepper: "pepper", costN: null });
    });
});
