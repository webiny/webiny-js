import { getHeader } from "@webiny/api-kernel-core";

const WEBINY_AUTHORIZATION_HEADER = "x-webiny-authorization";

/**
 * Finds one cookie and decodes only its value. Decoding every cookie would let any other cookie on the
 * domain that isn't valid URI encoding (`promo=50%off`) throw and fail the request. If the cookie is
 * sent more than once (same name, different Path or Domain), the last one wins, as it always has.
 */
function readCookie(cookieHeader: string, name: string): string | null {
    let rawValue: string | null = null;
    for (const pair of cookieHeader.split(";")) {
        const idx = pair.indexOf("=");
        if (idx > 0 && pair.slice(0, idx).trim() === name) {
            rawValue = pair.slice(idx + 1).trim();
        }
    }
    if (rawValue === null) {
        return null;
    }
    try {
        return decodeURIComponent(rawValue);
    } catch {
        // Not valid URI encoding, so not a token we issued.
        return null;
    }
}

export interface AuthTokenRequest {
    method: string | undefined;
    path: string | undefined;
}

/**
 * The `wby-id-token` cookie exists only for private file delivery: an `<img src>` cannot send an
 * `Authorization` header. It must not log users in anywhere else, because the browser attaches it
 * to cross-site requests too (`SameSite=None`), which would let any website call the API as the user.
 */
export function isCookieAuthenticationAllowed(request: AuthTokenRequest): boolean {
    const method = (request.method || "").toUpperCase();
    if (method !== "GET" && method !== "HEAD") {
        return false;
    }
    return (request.path || "").startsWith("/private/");
}

/**
 * Reads the auth token, preferring `x-webiny-authorization` over `Authorization`.
 *
 * The order matters for CloudFront → Lambda Function URL (the streaming routes, file delivery): the
 * Origin Access Control signs those requests with SigV4 in the `Authorization` header, so a viewer's
 * bearer token cannot survive to the origin, and clients send it in `x-webiny-authorization` instead.
 * A Lambda web function origin is different: CloudFront keeps the viewer's `Authorization` there, so
 * plain `Authorization` works for the API's main routes. The `wby-id-token` cookie is the last resort,
 * and only for private file reads (see {@link isCookieAuthenticationAllowed}).
 */
export function extractAuthToken(
    headers: Record<string, string> | undefined,
    request: AuthTokenRequest
): string | null {
    const webinyAuth = getHeader(headers, WEBINY_AUTHORIZATION_HEADER).replace(/^Bearer\s+/i, "");
    if (webinyAuth) {
        return webinyAuth;
    }

    const bearer = getHeader(headers, "authorization").replace(/^Bearer\s+/i, "");
    if (bearer) {
        return bearer;
    }

    if (!isCookieAuthenticationAllowed(request)) {
        return null;
    }

    const cookieHeader = getHeader(headers, "cookie");
    return readCookie(cookieHeader, "wby-id-token");
}
