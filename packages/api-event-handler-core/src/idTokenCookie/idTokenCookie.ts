import { serializeCookie } from "@webiny/event-handler-core";

/**
 * The `wby-id-token` cookie exists only for private file delivery (`GET /private/*`): an `<img src>`
 * cannot send an `Authorization` header, so the browser needs an ambient credential for it.
 *
 * The cookie is `SameSite=None` (the Admin and the API usually live on different origins), so the
 * browser attaches it to cross-site requests too. Honouring it on any other route would let every
 * website a logged-in user visits call the API as that user (CSRF). It therefore authenticates only
 * GET/HEAD requests under `/private/`, whose responses are never readable cross-origin with
 * credentials (see `SecureHeadersDecorator`).
 */
export const ID_TOKEN_COOKIE_NAME = "wby-id-token";

const PRIVATE_FILES_PATH_PREFIX = "/private/";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Whether a request with this method and route path (stage prefix already stripped) may
 * authenticate with the `wby-id-token` cookie.
 */
export function isIdTokenCookieAllowed(method: string, path: string): boolean {
    const normalizedMethod = method.toUpperCase();
    if (normalizedMethod !== "GET" && normalizedMethod !== "HEAD") {
        return false;
    }
    return path.startsWith(PRIVATE_FILES_PATH_PREFIX);
}

/**
 * Reads the `wby-id-token` value from a `Cookie` request header. A value that is not valid
 * percent-encoding is ignored rather than failing the request.
 */
export function readIdTokenCookie(cookieHeader: string | undefined): string | null {
    if (!cookieHeader) {
        return null;
    }
    for (const pair of cookieHeader.split(";")) {
        const separator = pair.indexOf("=");
        if (separator <= 0 || pair.slice(0, separator).trim() !== ID_TOKEN_COOKIE_NAME) {
            continue;
        }
        try {
            const value = decodeURIComponent(pair.slice(separator + 1).trim());
            return value || null;
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * The serialized `Set-Cookie` value that stores `token` as the `wby-id-token` cookie.
 *
 * It expires with the token when the token is a JWT carrying `exp`, otherwise after 24 hours (the
 * token can also be an API key or another opaque value).
 */
export function serializeIdTokenCookie(token: string, now: Date = new Date()): string {
    const expiresAt = readTokenExpiry(token);
    return serializeCookie(ID_TOKEN_COOKIE_NAME, token, {
        path: "/",
        expires: expiresAt ?? new Date(now.getTime() + ONE_DAY_MS),
        // Sent with cross-origin requests: the Admin and the API are usually on different origins.
        sameSite: "none",
        // Only sent over HTTPS (browsers exempt `localhost`).
        secure: true,
        // Not readable by JavaScript.
        httpOnly: true
    });
}

/**
 * The `cache-control` value for a response that sets the `wby-id-token` cookie: it tells shared
 * caches never to reuse the `Set-Cookie` header for another request. Any directive the route set
 * is kept.
 */
export function idTokenCookieCacheControl(existing: string | undefined): string {
    const directive = `no-cache="Set-Cookie"`;
    return existing ? `${existing}, ${directive}` : directive;
}

/**
 * The `exp` claim of a JWT, without verifying it: the value only decides when the cookie expires,
 * and the token itself is verified whenever the cookie is used.
 */
function readTokenExpiry(token: string): Date | null {
    const segments = token.split(".");
    if (segments.length !== 3 || !segments[1]) {
        return null;
    }
    try {
        const payload = JSON.parse(Buffer.from(segments[1], "base64url").toString("utf8"));
        const exp = payload?.exp;
        if (typeof exp !== "number" || !Number.isFinite(exp)) {
            return null;
        }
        const expiresAt = new Date(exp * 1000);
        return Number.isNaN(expiresAt.getTime()) ? null : expiresAt;
    } catch {
        return null;
    }
}
