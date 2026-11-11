import { createAbstraction } from "@webiny/feature/api";

export interface ICdnCacheInvalidateParams {
    // Who asked, for the logs, e.g. `wb.redirects`.
    caller: string;
    // API paths to drop from the cache, e.g. `/wb/redirects`.
    paths: string[];
}

export interface ICdnCache {
    invalidate(params: ICdnCacheInvalidateParams): Promise<void>;
    /*
     * The `Cache-Control` header for an API response that is dropped through `invalidate` when it
     * changes. `invalidate` only reaches the CDN itself, so only the CDN may keep the response for
     * long; every other cache, and every cache when there is no CDN, must check back each time.
     */
    getCacheControl(): string;
}

/**
 * The CDN cache in front of the API, if the deployment has one. AWS caches API responses in
 * CloudFront, and `@webiny/api-event-handler-aws` supplies the implementation that invalidates them.
 * Standalone has no CDN, so it keeps the default, which has nothing to invalidate.
 *
 * Invalidating is a side effect of a write that has already succeeded, so `invalidate` never
 * rejects: an implementation logs its own failures. Callers await it and carry on.
 */
export const CdnCache = createAbstraction<ICdnCache>("Core/CdnCache");

export namespace CdnCache {
    export type Interface = ICdnCache;
    export type InvalidateParams = ICdnCacheInvalidateParams;
}
