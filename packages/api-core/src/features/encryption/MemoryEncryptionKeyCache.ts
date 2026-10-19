import crypto from "node:crypto";
import { EncryptionKeyCache as Abstraction } from "./abstractions.js";

/**
 * Keeps every derived key for the life of the container. Keys depend only on build params, so a
 * process holds one or two at most.
 */
class MemoryEncryptionKeyCacheImpl implements Abstraction.Interface {
    private readonly keys = new Map<string, Buffer>();

    public getOrDerive(passphrase: string, salt: string, keyLength: number): Buffer {
        const cacheKey = JSON.stringify([passphrase, salt, keyLength]);
        const cached = this.keys.get(cacheKey);
        if (cached) {
            return cached;
        }

        const key = crypto.scryptSync(passphrase, salt, keyLength);
        this.keys.set(cacheKey, key);
        return key;
    }
}

export const MemoryEncryptionKeyCache = Abstraction.createImplementation({
    implementation: MemoryEncryptionKeyCacheImpl,
    dependencies: []
});
