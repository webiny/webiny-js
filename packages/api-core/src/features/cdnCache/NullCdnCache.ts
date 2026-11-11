import { CdnCache } from "./abstractions.js";

// Default for hosting types (and tests) with no CDN in front of the API.
class NullCdnCacheImpl implements CdnCache.Interface {
    async invalidate(): Promise<void> {
        // Nothing to invalidate.
    }
}

export const NullCdnCache = CdnCache.createImplementation({
    implementation: NullCdnCacheImpl,
    dependencies: []
});
