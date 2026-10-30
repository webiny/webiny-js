import { createFeature } from "@webiny/feature/api";
import { MemoryEncryptionKeyCache } from "./MemoryEncryptionKeyCache.js";

/**
 * Register in the ROOT container. Encryption is registered again in every request container, so a
 * cache registered there would start empty on each request and derive the key every time.
 */
export const EncryptionKeyCacheFeature = createFeature({
    name: "EncryptionKeyCache",
    register(container) {
        container.register(MemoryEncryptionKeyCache).inSingletonScope();
    }
});
