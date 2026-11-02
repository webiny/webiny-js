import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { EncryptionImpl } from "~/features/encryption/EncryptionService.js";
import { Container } from "@webiny/di";
import { EncryptionKeyCache } from "~/features/encryption/abstractions.js";
import { EncryptionKeyCacheFeature } from "~/features/encryption/EncryptionKeyCacheFeature.js";
import { BuildParams } from "~/features/buildParams/abstractions.js";
import { EncryptionConfig } from "~/features/encryption/abstractions.js";
import { BuildParamsEncryptionConfig } from "~/features/encryption/BuildParamsEncryptionConfig.js";

/**
 * Resolves the default `EncryptionConfig` over the given build params, the way AWS projects get it,
 * so these tests also cover the build param names.
 */
const createConfig = (params: Record<string, string>): EncryptionConfig.Interface => {
    const container = new Container();
    container.registerInstance(BuildParams, {
        get: <T>(key: string) => {
            const value: unknown = params[key] ?? null;
            return value as T | null;
        }
    });
    container.register(BuildParamsEncryptionConfig);
    return container.resolve(EncryptionConfig);
};

describe("EncryptionService", () => {
    it("should decrypt what it encrypted", async () => {
        const config = createConfig({
            EncryptionPassphrase: "passphrase",
            EncryptionSalt: "salt"
        });
        const encryption = new EncryptionImpl(config, undefined);

        const encrypted = await encryption.encrypt("secret value");
        const decrypted = await encryption.decrypt(encrypted);

        expect(encrypted).not.toEqual("secret value");
        expect(decrypted).toEqual("secret value");
    });

    it("should decrypt values encrypted by another instance with the same build params", async () => {
        // Every request gets its own instance, and they share the derived key through the cache.
        const container = new Container();
        EncryptionKeyCacheFeature.register(container);
        const keyCache = container.resolve(EncryptionKeyCache);
        const config = createConfig({
            EncryptionPassphrase: "passphrase",
            EncryptionSalt: "salt"
        });
        const first = new EncryptionImpl(config, keyCache);
        const second = new EncryptionImpl(config, keyCache);

        const encrypted = await first.encrypt("secret value");
        const decrypted = await second.decrypt(encrypted);

        expect(decrypted).toEqual("secret value");
    });

    it("should not decrypt values encrypted with a different salt", async () => {
        const firstConfig = createConfig({
            EncryptionPassphrase: "passphrase",
            EncryptionSalt: "salt"
        });
        const secondConfig = createConfig({
            EncryptionPassphrase: "passphrase",
            EncryptionSalt: "other salt"
        });
        const first = new EncryptionImpl(firstConfig, undefined);
        const second = new EncryptionImpl(secondConfig, undefined);

        const encrypted = await first.encrypt("secret value");
        const decryption = second.decrypt(encrypted);

        await expect(decryption).rejects.toThrow();
    });

    it("should leave values as they are without a passphrase", async () => {
        const config = createConfig({});
        const encryption = new EncryptionImpl(config, undefined);

        const encrypted = await encryption.encrypt("secret value");
        const decrypted = await encryption.decrypt("secret value");

        expect(encrypted).toEqual("secret value");
        expect(decrypted).toEqual("secret value");
    });
});
