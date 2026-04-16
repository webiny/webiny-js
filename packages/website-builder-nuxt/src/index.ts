export * from "@webiny/website-builder-vue";
export { DocumentRenderer } from "./DocumentRenderer.js";

import { setHeadersProvider } from "@webiny/website-builder-vue";

/**
 * In Nuxt 3 SSR, useRequestHeaders() returns the current request's headers as a plain
 * object. We wrap them in the standard Headers interface expected by the SDK.
 *
 * This provider is called by the SDK during server-side rendering when it needs to read
 * preview/tenant information from request headers (e.g. X-Preview-Params, X-Tenant).
 */
setHeadersProvider(async () => {
    // @ts-ignore This is a peer dependency — imported at runtime inside Nuxt.
    const { useRequestHeaders } = await import("#imports");
    const raw = useRequestHeaders() as Record<string, string>;
    return new Headers(Object.entries(raw));
});
