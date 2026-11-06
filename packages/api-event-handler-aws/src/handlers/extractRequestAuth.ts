import {
    isIdTokenCookieAllowed,
    readIdTokenCookie
} from "@webiny/api-event-handler-core/idTokenCookie/idTokenCookie.js";
import { apiGatewayEventMethod, apiGatewayEventPath } from "@webiny/event-handler-aws";

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
 * Reads the auth token from the headers, preferring `x-webiny-authorization` over `Authorization`.
 *
 * That order exists for CloudFront → Lambda Function URL with Origin Access Control: OAC signs the
 * request with SigV4, which occupies the `Authorization` header, so a viewer's bearer token cannot
 * survive to the origin. Clients that may traverse an OAC-signed origin send the token in the
 * `x-webiny-authorization` header instead. Plain `Authorization` stays supported for every other
 * caller.
 *
 * Cookies are not read here. The `wby-id-token` cookie is accepted only for private file delivery on
 * API Gateway, see {@link extractApiGatewayCookieAuthToken}.
 */
export function extractAuthToken(headers: Record<string, string> | undefined): string | null {
    const webinyAuth = getHeader(headers, WEBINY_AUTHORIZATION_HEADER).replace(/^Bearer\s+/i, "");
    if (webinyAuth) {
        return webinyAuth;
    }

    const bearer = getHeader(headers, "authorization").replace(/^Bearer\s+/i, "");
    return bearer || null;
}

/**
 * Reads the `wby-id-token` cookie of an API Gateway event, but only for a GET/HEAD request under
 * `/private/` (the path as routed, stage prefix stripped). Private file delivery needs it because an
 * `<img src>` cannot send an `Authorization` header. Anywhere else the cookie is ignored: it is
 * `SameSite=None`, so the browser attaches it to cross-site requests too, and honouring it would let
 * any website call the API as the user (CSRF).
 *
 * Payload format 1.0 carries cookies in the `cookie` header, 2.0 in a `cookies` array.
 */
export function extractApiGatewayCookieAuthToken(event: any): string | null {
    if (!isIdTokenCookieAllowed(apiGatewayEventMethod(event), apiGatewayEventPath(event))) {
        return null;
    }
    if (Array.isArray(event?.cookies) && event.cookies.length > 0) {
        return readIdTokenCookie(event.cookies.join("; "));
    }
    return readIdTokenCookie(getHeader(event?.headers, "cookie"));
}

export function extractTenantId(headers: Record<string, string> | undefined): string | null {
    return getHeader(headers, "x-tenant") || null;
}

/**
 * Returns the header map of a Function URL event (payload format 2.0). The event's `cookies` array is
 * deliberately not folded in: Function URL routes (streaming) never authenticate with a cookie.
 */
export function headersFromFunctionUrlEvent(event: any): Record<string, string> {
    return {
        ...((event?.headers as Record<string, string>) || {})
    };
}
