import { Result } from "@webiny/feature/api";
import { CdnCache } from "./abstractions.js";

/** Default for hosting types (and tests) with no CDN in front of the API. */
class NullCdnCacheImpl implements CdnCache.Interface {
    async invalidate(): CdnCache.Return {
        return Result.ok();
    }
}

export const NullCdnCache = CdnCache.createImplementation({
    implementation: NullCdnCacheImpl,
    dependencies: []
});
