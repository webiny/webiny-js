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
        // @ts-ignore Peer dependency, resolved from the host app.
        const { draftMode } = await import("next/headers");

        const { searchParams } = request.nextUrl;
        const previewRequested =
            searchParams.get("wb.preview") === "true" || searchParams.get("wb.editing") === "true";

        // Forward the tenant so downstream reads resolve against the right tenant.
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set("X-Tenant", searchParams.get("wb.tenant") ?? "root");

        const previewMode = await draftMode();

        if (previewRequested) {
            if (previewMode.isEnabled) {
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

        if (previewMode.isEnabled) {
            // Preview flag gone but draft mode still on — exit preview.
            previewMode.disable();
            return NextResponse.redirect(request.url);
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
