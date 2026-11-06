import { createAbstraction } from "@webiny/feature/api";
import type { BaseError } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";

export interface ICdnCacheInvalidateParams {
    // Who asked, for the logs, e.g. `wb.redirects`.
    caller: string;
    // API paths to drop from the cache, e.g. `/wb/redirects`.
    paths: string[];
}

export interface ICdnCache {
    invalidate(params: ICdnCacheInvalidateParams): Promise<Result<void, BaseError>>;
}

/**
 * The CDN cache in front of the API, if the deployment has one. AWS caches API responses in
 * CloudFront, and `@webiny/api-file-manager-s3` supplies the implementation that invalidates them.
 * Standalone has no CDN, so it keeps the default, which has nothing to invalidate.
 *
 * Invalidating is a side effect of a write that has already succeeded. Callers log a failed result
 * and carry on rather than fail the write.
 */
export const CdnCache = createAbstraction<ICdnCache>("Core/CdnCache");

export namespace CdnCache {
    export type Interface = ICdnCache;
    export type InvalidateParams = ICdnCacheInvalidateParams;
    export type Return = Promise<Result<void, BaseError>>;
}
