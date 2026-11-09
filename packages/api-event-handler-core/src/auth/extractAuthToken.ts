import { getHeader } from "./getHeader.js";

const WEBINY_AUTHORIZATION_HEADER = "x-webiny-authorization";

/**
 * Finds one cookie and decodes only its value. Decoding every cookie would let any other cookie on the
 * domain that isn't valid URI encoding (`promo=50%off`) throw and fail the request.
 */
function readCookie(cookieHeader: string, name: string): string | null {
    for (const pair of cookieHeader.split(";")) {
        const idx = pair.indexOf("=");
        if (idx <= 0 || pair.slice(0, idx).trim() !== name) {
            continue;
        }
        const value = pair.slice(idx + 1).trim();
        try {
            return decodeURIComponent(value);
        } catch {
            // Not valid URI encoding, so not a token we issued.
            return null;
        }
    }
    return null;
}

/**
 * Reads the auth token, preferring `x-webiny-authorization` over `Authorization`.
 *
 * That order exists for CloudFront → Lambda Function URL with Origin Access Control: OAC signs the
 * request with SigV4, which occupies the `Authorization` header, so a viewer's bearer token cannot
 * survive to the origin. Clients that may traverse an OAC-signed origin send the token in the
 * `x-webiny-authorization` header instead. Plain `Authorization` stays supported for every other
 * caller, and the `wby-id-token` cookie remains the last resort.
 */
export function extractAuthToken(headers: Record<string, string> | undefined): string | null {
    const webinyAuth = getHeader(headers, WEBINY_AUTHORIZATION_HEADER).replace(/^Bearer\s+/i, "");
    if (webinyAuth) {
        return webinyAuth;
    }

    const bearer = getHeader(headers, "authorization").replace(/^Bearer\s+/i, "");
    if (bearer) {
        return bearer;
    }

    const cookieHeader = getHeader(headers, "cookie");
    return readCookie(cookieHeader, "wby-id-token");
}
