/**
 * Header parsing shared by the API Gateway and Function URL auth/tenant decorators, so the two
 * transports can't drift on how a caller authenticates.
 */

export const WEBINY_AUTHORIZATION_HEADER = "x-webiny-authorization";

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

function getHeader(headers: Record<string, string> | undefined, name: string): string {
    if (!headers) {
        return "";
    }
    // Header names are case-insensitive, and the casing that reaches us depends on the transport and
    // on the client, so match on the lowercased key rather than guessing a spelling.
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === name) {
            return headers[key] ?? "";
        }
    }
    return "";
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

export function extractTenantId(headers: Record<string, string> | undefined): string | null {
    return getHeader(headers, "x-tenant") || null;
}

/**
 * Function URL events (payload format 2.0) deliver cookies as a `cookies` ARRAY rather than a `cookie`
 * header. Fold them back so the extractors above see a normal header map.
 */
export function headersFromFunctionUrlEvent(event: any): Record<string, string> {
    const headers: Record<string, string> = {
        ...((event?.headers as Record<string, string>) || {})
    };

    if (Array.isArray(event?.cookies) && event.cookies.length > 0) {
        headers.cookie = event.cookies.join("; ");
    }

    return headers;
}
