import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { EncryptionImpl } from "~/features/encryption/EncryptionService.js";
import type { BuildParams } from "~/features/buildParams/abstractions.js";

const createBuildParams = (params: Record<string, string>): BuildParams.Interface => {
    return {
        get: <T>(key: string) => (params[key] ?? null) as T | null
    };
};

describe("EncryptionService", () => {
    it("should decrypt what it encrypted", async () => {
        const encryption = new EncryptionImpl(
            createBuildParams({ EncryptionPassphrase: "passphrase", EncryptionSalt: "salt" })
        );

        const encrypted = await encryption.encrypt("secret value");

        expect(encrypted).not.toEqual("secret value");
        expect(await encryption.decrypt(encrypted)).toEqual("secret value");
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

        expect(await second.decrypt(encrypted)).toEqual("secret value");
    });

    it("should not decrypt values encrypted with a different salt", async () => {
        const first = new EncryptionImpl(
            createBuildParams({ EncryptionPassphrase: "passphrase", EncryptionSalt: "salt" })
        );
        const second = new EncryptionImpl(
            createBuildParams({ EncryptionPassphrase: "passphrase", EncryptionSalt: "other salt" })
        );

        const encrypted = await first.encrypt("secret value");

        await expect(second.decrypt(encrypted)).rejects.toThrow();
    });

    it("should leave values as they are without a passphrase", async () => {
        const encryption = new EncryptionImpl(createBuildParams({}));

        expect(await encryption.encrypt("secret value")).toEqual("secret value");
        expect(await encryption.decrypt("secret value")).toEqual("secret value");
    });
});
