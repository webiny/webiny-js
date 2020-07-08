import { createHandler } from "@webiny/http-handler";
import filesPlugins from "@webiny/http-handler-files";
import ssrPlugins from "@webiny/http-handler-ssr";
import cdnSsrCacheInvalidationPlugins from "@webiny/http-handler-ssr/cdnSsrCacheInvalidation";

export const handler = createHandler(
    filesPlugins(),
    ssrPlugins({
        cache: {
            enabled: true,
            ttl: 2592000, // 30 days in seconds.
            ttlStale: 20
        }
    }),
    cdnSsrCacheInvalidationPlugins()
);
