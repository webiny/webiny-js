import { create } from "@webiny/cloud-function";
import filesPlugins from "@webiny/cloud-function-files";
import ssrPlugins from "@webiny/cloud-function-ssr";
import cdnSsrCacheInvalidationPlugins from "@webiny/cloud-function-ssr/cdnSsrCacheInvalidation";

export const handler = create(
    filesPlugins(),
    ssrPlugins({
        ssrCacheTtl: 2592000, // 30 days in seconds.
        ssrCacheTtlState: 20
    }),
    cdnSsrCacheInvalidationPlugins()
);
