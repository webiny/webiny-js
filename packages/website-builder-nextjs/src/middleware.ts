/**
 * Next.js middleware for Website Builder.
 *
 * Handles the two request-time concerns an app would otherwise hand-write:
 *  - **Preview / draft mode** — routes `?wb.preview`/`?wb.editing` requests through the draft-mode
 *    route and disables caching while previewing; exits preview when the flag is gone.
 *  - **A/B visitor cookie** — sets a stable, PII-free `wb_ab_vid` cookie so variant bucketing is
 *    deterministic across visits.
 *
 * `next` is a peer dependency and is imported dynamically so building this package never requires
 * it. Drop into a project as:
 *
 *   // middleware.ts
 *   export { middleware, config } from "@webiny/website-builder-nextjs/middleware";
 */

const DEFAULT_PREVIEW_ROUTE = "/api/preview";

/**
 * The cookie Next.js carries draft mode in.
 *
 * Read directly, because `draftMode()` does not report enabled state in middleware — it is for
 * Server Components and Route Handlers. Asking it here returns `isEnabled: false` whether the cookie
 * is present or not, which made the hand-off below unconditional: every preview request redirected
 * to the draft-mode route, which enabled draft mode and redirected back, forever. Measured at 50
 * redirects before the client gave up.
 *
 * The name is Next's internal one and is the price of doing this in middleware at all. If a future
 * Next supports `draftMode()` here, this goes back to asking.
 */
const DRAFT_MODE_COOKIE = "__prerender_bypass";
const DEFAULT_VISITOR_COOKIE = "wb_ab_vid";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

// Minimal structural view of NextRequest — avoids a static `next` type import.
interface MiddlewareRequest {
    url: string;
    nextUrl: { searchParams: URLSearchParams; pathname: string };
    headers: Headers;
    cookies: { get(name: string): { value: string } | undefined };
}

export interface WebsiteBuilderMiddlewareOptions {
    /** Route that enables Next.js draft mode for preview. Defaults to `/api/preview`. */
    previewRoute?: string;
    /** A/B bucketing cookie name. Defaults to `wb_ab_vid`. */
    visitorCookieName?: string;
    /** A/B bucketing cookie max-age in seconds. Defaults to one year. */
    visitorCookieMaxAge?: number;
}

export function createWebsiteBuilderMiddleware(options: WebsiteBuilderMiddlewareOptions = {}) {
    const previewRoute = options.previewRoute ?? DEFAULT_PREVIEW_ROUTE;
    const cookieName = options.visitorCookieName ?? DEFAULT_VISITOR_COOKIE;
    const cookieMaxAge = options.visitorCookieMaxAge ?? ONE_YEAR_SECONDS;

    return async function middleware(request: MiddlewareRequest) {
        // @ts-ignore Peer dependency, resolved from the host app.
        const { NextResponse } = await import("next/server");

        const { searchParams } = request.nextUrl;
        const previewRequested =
            searchParams.get("wb.preview") === "true" || searchParams.get("wb.editing") === "true";

        // Forward the tenant so downstream reads resolve against the right tenant.
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("X-Tenant", searchParams.get("wb.tenant") ?? "root");

        const previewEnabled = Boolean(request.cookies.get(DRAFT_MODE_COOKIE));

        if (previewRequested) {
            if (previewEnabled) {
                // Already in draft mode — pass the preview params through and disable caching.
                const response = NextResponse.next({ request: { headers: requestHeaders } });
                response.headers.set("X-Preview-Params", searchParams.toString());
                response.headers.set(
                    "Cache-Control",
                    "no-store, no-cache, must-revalidate, proxy-revalidate"
                );
                response.headers.set("Pragma", "no-cache");
                response.headers.set("Expires", "0");
                return response;
            }
            // Not in draft mode yet — hand off to the route that enables it, keeping all params.
            const url = new URL(request.url);
            url.pathname = previewRoute;
            return NextResponse.redirect(url);
        }

        if (previewEnabled) {
            /*
             * Preview flag gone but draft mode still on — exit preview.
             *
             * By clearing the cookie on the response rather than calling `previewMode.disable()`,
             * which is unavailable here for the same reason `isEnabled` is. Clearing it before the
             * redirect matters: the redirected request must not arrive still carrying it, or this
             * branch fires again and becomes its own loop.
             */
            const response = NextResponse.redirect(request.url);
            response.cookies.delete(DRAFT_MODE_COOKIE);
            return response;
        }

        const response = NextResponse.next({ request: { headers: requestHeaders } });

        // Stable visitor id for deterministic A/B bucketing (functional cookie, no PII). Remove or
        // gate this if your consent policy requires opt-in — bucketing still works per-request
        // without it, just not stably across visits.
        if (!request.cookies.get(cookieName)) {
            response.cookies.set(cookieName, crypto.randomUUID(), {
                maxAge: cookieMaxAge,
                path: "/",
                sameSite: "lax"
            });
        }

        return response;
    };
}

/** Turnkey middleware with default options. */
export const middleware = createWebsiteBuilderMiddleware();

/** Default matcher: everything except Next internals, API routes, and static assets. */
export const config = {
    matcher: ["/((?!_next|api|static|favicon.ico|.well-known).*)"]
};
