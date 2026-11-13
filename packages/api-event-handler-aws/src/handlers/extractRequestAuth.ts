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
