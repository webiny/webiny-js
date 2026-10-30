/**
 * Nitro server handlers for Website Builder. The Nuxt counterpart of
 * `@webiny/website-builder-nextjs/middleware`.
 *
 * Handles the request-time concerns an app would otherwise hand-write:
 *  - **Preview / editing mode**: routes `?wb.preview`/`?wb.editing` requests through the preview
 *    route, which sets the preview cookie, and disables caching while previewing; exits preview
 *    when the flag is gone.
 *  - **Tenant**: stores `wb.tenant` (default `root`) on `event.context.tenantId`.
 *  - **A/B visitor cookie**: sets a stable, PII-free `wb_ab_vid` cookie so variant bucketing is
 *    deterministic across visits.
 *
 * `h3` comes with Nuxt. It is imported when a handler first runs, so importing this module
 * outside a Nitro server does not load it.
 * Drop into a project as:
 *
 *   // server/middleware/webiny.ts
 *   import { createWebsiteBuilderMiddleware } from "@webiny/website-builder-nuxt/server";
 *   export default defineEventHandler(createWebsiteBuilderMiddleware());
 *
 *   // server/api/preview.get.ts
 *   import { createPreviewHandler } from "@webiny/website-builder-nuxt/server";
 *   export default defineEventHandler(createPreviewHandler());
 */

import type { H3Event } from "h3";

const DEFAULT_PREVIEW_ROUTE = "/api/preview";
const DEFAULT_PREVIEW_COOKIE = "__wb_preview";
const DEFAULT_VISITOR_COOKIE = "wb_ab_vid";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export interface WebsiteBuilderMiddlewareOptions {
    /** Route that turns preview mode on. Defaults to `/api/preview`. */
    previewRoute?: string;
    /** Name of the cookie that marks preview mode. Defaults to `__wb_preview`. */
    previewCookieName?: string;
    /** A/B bucketing cookie name. Defaults to `wb_ab_vid`. */
    visitorCookieName?: string;
    /** A/B bucketing cookie max-age in seconds. Defaults to one year. */
    visitorCookieMaxAge?: number;
    /**
     * Paths the middleware leaves alone. Defaults to Nuxt internals (`/_`), API routes
     * (`/api/`) and files (any path with a dot).
     */
    ignore?: (pathname: string) => boolean;
}

const defaultIgnore = (pathname: string) => {
    return pathname.startsWith("/_") || pathname.startsWith("/api/") || pathname.includes(".");
};

export function createWebsiteBuilderMiddleware(options: WebsiteBuilderMiddlewareOptions = {}) {
    const previewRoute = options.previewRoute ?? DEFAULT_PREVIEW_ROUTE;
    const previewCookie = options.previewCookieName ?? DEFAULT_PREVIEW_COOKIE;
    const visitorCookie = options.visitorCookieName ?? DEFAULT_VISITOR_COOKIE;
    const visitorCookieMaxAge = options.visitorCookieMaxAge ?? ONE_YEAR_SECONDS;
    const ignore = options.ignore ?? defaultIgnore;

    return async function middleware(event: H3Event) {
        const h3 = await import("h3");

        const { pathname, searchParams } = h3.getRequestURL(event);
        if (ignore(pathname)) {
            return;
        }

        // Downstream reads resolve against this tenant.
        event.context.tenantId = searchParams.get("wb.tenant") ?? "root";

        const previewRequested =
            searchParams.get("wb.preview") === "true" || searchParams.get("wb.editing") === "true";
        const previewEnabled = h3.getCookie(event, previewCookie) === "1";

        // Redirects are relative so they stay on the public domain behind a reverse proxy,
        // where `getRequestURL` returns the backend address.
        if (previewRequested && !previewEnabled) {
            // Not in preview mode yet — hand off to the route that enables it, keeping all params.
            return h3.sendRedirect(event, `${previewRoute}?${searchParams.toString()}`, 307);
        }

        if (!previewRequested && previewEnabled) {
            // Preview flag gone but the cookie is still set — exit preview.
            h3.deleteCookie(event, previewCookie, { path: "/" });
            const query = searchParams.toString();
            return h3.sendRedirect(event, query ? `${pathname}?${query}` : pathname, 307);
        }

        if (previewEnabled) {
            // Pass the preview params through and disable caching.
            event.context.wbPreviewParams = searchParams.toString();
            h3.setResponseHeaders(event, {
                "X-Preview-Params": searchParams.toString(),
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                Pragma: "no-cache",
                Expires: "0"
            });
            return;
        }

        // Stable visitor id for deterministic A/B bucketing (functional cookie, no PII). Remove or
        // gate this if your consent policy requires opt-in — bucketing still works per-request
        // without it, just not stably across visits.
        if (!h3.getCookie(event, visitorCookie)) {
            h3.setCookie(event, visitorCookie, crypto.randomUUID(), {
                maxAge: visitorCookieMaxAge,
                path: "/",
                sameSite: "lax"
            });
        }
    };
}

export interface PreviewHandlerOptions {
    /** Name of the cookie that marks preview mode. Defaults to `__wb_preview`. */
    previewCookieName?: string;
}

/**
 * Turns preview mode on by setting the preview cookie, then redirects to the page in
 * `wb.path`, keeping every query parameter. The Nuxt counterpart of the Next.js draft-mode route.
 */
export function createPreviewHandler(options: PreviewHandlerOptions = {}) {
    const previewCookie = options.previewCookieName ?? DEFAULT_PREVIEW_COOKIE;

    return async function previewHandler(event: H3Event) {
        const h3 = await import("h3");

        const { searchParams } = h3.getRequestURL(event);
        // Only same-site paths: `//host` and `/\host` would send the browser to another origin.
        const requestedPath = searchParams.get("wb.path") || "/";
        const targetPath = /^\/(?![/\\])/.test(requestedPath) ? requestedPath : "/";

        // SameSite=None; Secure so the cookie is sent inside the admin's cross-origin iframe.
        h3.setCookie(event, previewCookie, "1", { path: "/", sameSite: "none", secure: true });

        return h3.sendRedirect(event, `${targetPath}?${searchParams.toString()}`, 307);
    };
}
