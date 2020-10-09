import "source-map-support/register";
import { createHandler } from "@webiny/handler";
import ssrPlugins from "@webiny/handler-ssr";
import cdnSsrCacheInvalidationPlugins from "@webiny/handler-ssr/cdnSsrCacheInvalidation";

export const handler = createHandler(
    ssrPlugins({
        cache: {
            enabled: true,
            ttl: 2592000, // 30 days in seconds.
            ttlStale: 20
        }
    }),
    cdnSsrCacheInvalidationPlugins()
);
