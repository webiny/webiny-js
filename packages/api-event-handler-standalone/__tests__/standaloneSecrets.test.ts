import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { Container } from "@webiny/feature/api";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { EncryptionConfig } from "@webiny/api-core/features/encryption/index.js";
import { HashingConfig } from "@webiny/api-core/features/hashing/index.js";
import { readStandaloneConfig } from "~/config/readStandaloneConfig.js";
import { assertDeclaredSecrets } from "~/config/declaredSecrets.js";
import { StandaloneConfig } from "~/config/abstractions.js";
import { StandaloneCryptoConfigFeature } from "~/crypto/feature.js";

const requiredEnv = {
    WEBINY_API_URL: "https://api.example.com",
    WEBINY_LOCAL_STORAGE_PATH: "/data/storage",
    WEBINY_UPLOAD_SECRET: "upload-secret"
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

describe("assertDeclaredSecrets", () => {
    it("passes when the build declares nothing", () => {
        const config = readStandaloneConfig(requiredEnv);
        const buildParams = createBuildParams({});

        expect(() => assertDeclaredSecrets(buildParams, config)).not.toThrow();
    });

    it("names every declared secret that env doesn't supply", () => {
        const config = readStandaloneConfig({ ...requiredEnv, WEBINY_HASHING_PEPPER: "  " });
        const buildParams = createBuildParams({
            EncryptionEnabled: true,
            HashingPepperEnabled: "true"
        });

        expect(() => assertDeclaredSecrets(buildParams, config)).toThrowError(
            [
                "The standalone API is missing required configuration:",
                "WEBINY_ENCRYPTION_PASSPHRASE is not set, but the build uses <Infra.Crypto.Encryption>.",
                "WEBINY_HASHING_PEPPER is not set, but the build uses <Infra.Crypto.Hashing pepper>."
            ].join("\n  ")
        );
    });

    it("refuses a build that bakes the passphrase or pepper itself", () => {
        // What the shared <Infra.Crypto.*> from @webiny/project renders: secrets, no markers.
        const config = readStandaloneConfig({
            ...requiredEnv,
            WEBINY_ENCRYPTION_PASSPHRASE: "passphrase",
            WEBINY_HASHING_PEPPER: "pepper"
        });
        const buildParams = createBuildParams({
            EncryptionPassphrase: "baked-passphrase",
            HashingPepper: "baked-pepper"
        });

        expect(() => assertDeclaredSecrets(buildParams, config)).toThrowError(
            [
                "The standalone API is missing required configuration:",
                "The build contains the encryption passphrase (EncryptionPassphrase build param), so webiny.config.tsx uses <Infra.Crypto.Encryption> from @webiny/project. Use the one from @webiny/project-standalone, which reads WEBINY_ENCRYPTION_PASSPHRASE at startup.",
                "The build contains the hashing pepper (HashingPepper build param), so webiny.config.tsx uses <Infra.Crypto.Hashing> from @webiny/project. Use the one from @webiny/project-standalone, which reads WEBINY_HASHING_PEPPER at startup."
            ].join("\n  ")
        );
    });

    it("passes when env supplies every declared secret", () => {
        const config = readStandaloneConfig({
            ...requiredEnv,
            WEBINY_ENCRYPTION_PASSPHRASE: "passphrase",
            WEBINY_HASHING_PEPPER: "pepper"
        });
        const buildParams = createBuildParams({
            EncryptionEnabled: true,
            HashingPepperEnabled: true
        });

        expect(() => assertDeclaredSecrets(buildParams, config)).not.toThrow();
    });
});

describe("standalone crypto configs", () => {
    it("take the secrets from env and the rest from the build", () => {
        const { encryption, hashing } = resolveConfigs(
            {
                WEBINY_ENCRYPTION_PASSPHRASE: "passphrase",
                WEBINY_ENCRYPTION_SALT: "salt",
                WEBINY_HASHING_PEPPER: "pepper"
            },
            {
                EncryptionEnabled: true,
                EncryptionAlgorithm: "aes-128-gcm",
                HashingPepperEnabled: true,
                HashingCost: "32768"
            }
        );

        expect(encryption).toEqual({
            passphrase: "passphrase",
            salt: "salt",
            algorithm: "aes-128-gcm"
        });
        expect(hashing).toEqual({ pepper: "pepper", costN: 32768 });
    });

    it("ignore secrets in env that the build doesn't declare", () => {
        const { encryption, hashing } = resolveConfigs(
            {
                WEBINY_ENCRYPTION_PASSPHRASE: "passphrase",
                WEBINY_HASHING_PEPPER: "pepper"
            },
            {}
        );

        expect(encryption.passphrase).toBeNull();
        expect(encryption.algorithm).toBe("aes-256-gcm");
        expect(hashing).toEqual({ pepper: "", costN: null });
    });
});
