/**
 * Header parsing shared by the API Gateway and Function URL auth/tenant decorators, so the two
 * transports can't drift on how a caller authenticates.
 */

export const WEBINY_AUTHORIZATION_HEADER = "x-webiny-authorization";

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
 * caller. Cookies are never read: a cookie-borne token would make every
 * cross-site request carry the caller's credentials (CSRF).
 */
export function extractAuthToken(headers: Record<string, string> | undefined): string | null {
    const webinyAuth = getHeader(headers, WEBINY_AUTHORIZATION_HEADER).replace(/^Bearer\s+/i, "");
    if (webinyAuth) {
        return webinyAuth;
    }

    const bearer = getHeader(headers, "authorization").replace(/^Bearer\s+/i, "");
    return bearer || null;
}

export function extractTenantId(headers: Record<string, string> | undefined): string | null {
    return getHeader(headers, "x-tenant") || null;
}

/**
 * Returns the header map of a Function URL event (payload format 2.0). The event's `cookies` array is
 * deliberately not folded in: no extractor reads cookies.
 */
export function headersFromFunctionUrlEvent(event: any): Record<string, string> {
    return {
        ...((event?.headers as Record<string, string>) || {})
    };
}
