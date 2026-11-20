import { createFeature } from "@webiny/feature/api";
import { NullCdnCache } from "./NullCdnCache.js";

/**
 * Registers the default, which has nothing to invalidate. A hosting type with a CDN registers its
 * own implementation later in the request stack, which replaces this one.
 */
export const CdnCacheFeature = createFeature({
    name: "CdnCacheFeature",
    register(container) {
        container.register(NullCdnCache);
    }
});
