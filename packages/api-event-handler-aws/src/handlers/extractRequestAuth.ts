/**
 * Header parsing shared by the API Gateway and Function URL tenant decorators. Reading the auth token
 * (`extractAuthToken`) lives in `@webiny/api-event-handler-core`, shared with the Node HTTP transport.
 */
import { getHeader } from "@webiny/api-event-handler-core";

export function extractTenantId(headers: Record<string, string> | undefined): string | null {
    return getHeader(headers, "x-tenant") || null;
}

/**
 * Function URL events (payload format 2.0) deliver cookies as a `cookies` ARRAY rather than a `cookie`
 * header. Fold them back so the extractors see a normal header map.
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
