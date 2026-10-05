import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { EncryptionImpl } from "~/features/encryption/EncryptionService.js";
import type { BuildParams } from "~/features/buildParams/abstractions.js";

const createBuildParams = (params: Record<string, string>): BuildParams.Interface => {
    return {
        get: <T>(key: string) => {
            const value: unknown = params[key] ?? null;
            return value as T | null;
        }
    };
};

describe("EncryptionService", () => {
    it("should decrypt what it encrypted", async () => {
        const buildParams = createBuildParams({
            EncryptionPassphrase: "passphrase",
            EncryptionSalt: "salt"
        });
        const encryption = new EncryptionImpl(buildParams);

        const encrypted = await encryption.encrypt("secret value");
        const decrypted = await encryption.decrypt(encrypted);

        expect(encrypted).not.toEqual("secret value");
        expect(decrypted).toEqual("secret value");
    });

    it("should decrypt values encrypted by another instance with the same build params", async () => {
        // Every request gets its own instance, and they share the derived key.
        const buildParams = createBuildParams({
            EncryptionPassphrase: "passphrase",
            EncryptionSalt: "salt"
        });
        const first = new EncryptionImpl(buildParams);
        const second = new EncryptionImpl(buildParams);

        const encrypted = await first.encrypt("secret value");
        const decrypted = await second.decrypt(encrypted);

        expect(decrypted).toEqual("secret value");
    });

    it("should not decrypt values encrypted with a different salt", async () => {
        const firstBuildParams = createBuildParams({
            EncryptionPassphrase: "passphrase",
            EncryptionSalt: "salt"
        });
        const secondBuildParams = createBuildParams({
            EncryptionPassphrase: "passphrase",
            EncryptionSalt: "other salt"
        });
        const first = new EncryptionImpl(firstBuildParams);
        const second = new EncryptionImpl(secondBuildParams);

        const encrypted = await first.encrypt("secret value");
        const decryption = second.decrypt(encrypted);

        await expect(decryption).rejects.toThrow();
    });

    it("should leave values as they are without a passphrase", async () => {
        const buildParams = createBuildParams({});
        const encryption = new EncryptionImpl(buildParams);

        const encrypted = await encryption.encrypt("secret value");
        const decrypted = await encryption.decrypt("secret value");

        expect(encrypted).toEqual("secret value");
        expect(decrypted).toEqual("secret value");
    });
});
