import type { H3Event } from "h3";
import { DEFAULT_PREVIEW_COOKIE } from "./defaults.js";
import { DEFAULT_PREVIEW_ROUTE } from "./defaults.js";
import { DEFAULT_VISITOR_COOKIE } from "./defaults.js";
import { ONE_YEAR_SECONDS } from "./defaults.js";

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
     * (`/api/`) and files (any path with a dot). The preview route is always left alone.
     */
    ignore?: (pathname: string) => boolean;
}

const defaultIgnore = (pathname: string) => {
    return pathname.startsWith("/_") || pathname.startsWith("/api/") || pathname.includes(".");
};

/**
 * Routes `?wb.preview`/`?wb.editing` requests through the preview route, disables caching
 * while previewing, exits preview when the flag is gone, stores `wb.tenant` (default `root`)
 * on `event.context.tenantId`, and sets the `wb_ab_vid` visitor cookie.
 */
export function createWebsiteBuilderMiddleware(options: WebsiteBuilderMiddlewareOptions = {}) {
    const previewRoute = options.previewRoute ?? DEFAULT_PREVIEW_ROUTE;
    const previewCookie = options.previewCookieName ?? DEFAULT_PREVIEW_COOKIE;
    const visitorCookie = options.visitorCookieName ?? DEFAULT_VISITOR_COOKIE;
    const visitorCookieMaxAge = options.visitorCookieMaxAge ?? ONE_YEAR_SECONDS;
    const ignore = options.ignore ?? defaultIgnore;

    return async function middleware(event: H3Event) {
        const h3 = await import("h3");

        const { pathname, searchParams } = h3.getRequestURL(event);
        // The preview route sets the cookie; redirecting it to itself would loop.
        if (pathname === previewRoute || ignore(pathname)) {
            return;
        }

        // Downstream reads resolve against this tenant.
        event.context.tenantId = searchParams.get("wb.tenant") ?? "root";

        const query = searchParams.toString();
        const previewRequested =
            searchParams.get("wb.preview") === "true" || searchParams.get("wb.editing") === "true";
        const previewEnabled = h3.getCookie(event, previewCookie) === "1";

        // Redirects are relative so they stay on the public domain behind a reverse proxy,
        // where `getRequestURL` returns the backend address.
        if (previewRequested && !previewEnabled) {
            // Not in preview mode yet — hand off to the route that enables it, keeping all params.
            const location = `${previewRoute}?${query}`;
            return h3.sendRedirect(event, location, 307);
        }

        if (!previewRequested && previewEnabled) {
            // Preview flag gone but the cookie is still set — exit preview.
            h3.deleteCookie(event, previewCookie, { path: "/" });
            // `//host` and `/\host` would send the browser to another origin. h3 1.15 already
            // collapses them in `getRequestURL`; this keeps it true for other versions.
            const path = pathname.replace(/^[/\\]+/, "/");
            const location = query ? `${path}?${query}` : path;
            return h3.sendRedirect(event, location, 307);
        }

        if (previewEnabled) {
            // Pass the preview params through and disable caching.
            event.context.wbPreviewParams = query;
            h3.setResponseHeaders(event, {
                "X-Preview-Params": query,
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
            const visitorId = crypto.randomUUID();
            h3.setCookie(event, visitorCookie, visitorId, {
                maxAge: visitorCookieMaxAge,
                path: "/",
                sameSite: "lax"
            });
        }
    };
}
