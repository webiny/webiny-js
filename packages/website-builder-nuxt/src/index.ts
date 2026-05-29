export * from "@webiny/website-builder-vue";
export { DocumentRenderer } from "./DocumentRenderer.js";

import { setHeadersProvider } from "@webiny/website-builder-vue";

/**
 * In Nuxt 3 SSR, useRequestHeaders() returns the current request's headers as a plain
 * object. We wrap them in the standard Headers interface expected by the SDK.
 *
 * We also synthesize X-Preview-Params from wb.* URL query params when not already
 * present. The server middleware sets those params as response headers (for cache
 * control), but the SDK reads them as request headers via PreviewDocument.createFromHeaders().
 * Building X-Preview-Params from the URL lets PreviewSdk fetch draft pages by ID.
 *
 * This provider is called by the SDK during server-side rendering when it needs to read
 * preview/tenant information from request headers (e.g. X-Preview-Params, X-Tenant).
 */
setHeadersProvider(async () => {
    // @ts-ignore #imports is a Nuxt virtual module, not available at build time.
    const { useRequestHeaders } = await import("#imports");
    const raw = useRequestHeaders() as Record<string, string>;
    return new Headers(Object.entries(raw));
});
