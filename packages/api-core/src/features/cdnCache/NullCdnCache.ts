import { CdnCache } from "./abstractions.js";

// Default for hosting types (and tests) with no CDN in front of the API.
class NullCdnCacheImpl implements CdnCache.Interface {
    async invalidate(): Promise<void> {
        // Nothing to invalidate.
    }

    getCacheControl(): string {
        // Nothing drops a stale copy, so a proxy someone puts in front of the API must revalidate.
        return "no-cache";
    }
}

export const NullCdnCache = CdnCache.createImplementation({
    implementation: NullCdnCacheImpl,
    dependencies: []
});
