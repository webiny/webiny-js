import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { EncryptionKeyCache } from "~/features/encryption/abstractions.js";
import { EncryptionKeyCacheFeature } from "~/features/encryption/EncryptionKeyCacheFeature.js";

describe("MemoryEncryptionKeyCache", () => {
    it("should derive a key once and return the same key afterwards", () => {
        const container = new Container();
        EncryptionKeyCacheFeature.register(container);
        const cache = container.resolve(EncryptionKeyCache);

        const first = cache.getOrDerive("passphrase", "salt", 32);
        const second = cache.getOrDerive("passphrase", "salt", 32);

        expect(first).toHaveLength(32);
        expect(second).toBe(first);
    });

    it("should derive different keys for different params", () => {
        const container = new Container();
        EncryptionKeyCacheFeature.register(container);
        const cache = container.resolve(EncryptionKeyCache);

        const key = cache.getOrDerive("passphrase", "salt", 32);
        const otherSalt = cache.getOrDerive("passphrase", "other salt", 32);
        const otherLength = cache.getOrDerive("passphrase", "salt", 16);

        expect(otherSalt.equals(key)).toBe(false);
        expect(otherLength).toHaveLength(16);
    });

    it("should be shared by request containers when registered in the root", () => {
        const root = new Container();
        EncryptionKeyCacheFeature.register(root);
        const firstRequest = root.createChildContainer();
        const secondRequest = root.createChildContainer();

        const first = firstRequest.resolve(EncryptionKeyCache);
        const second = secondRequest.resolve(EncryptionKeyCache);

        expect(second).toBe(first);
    });
});
