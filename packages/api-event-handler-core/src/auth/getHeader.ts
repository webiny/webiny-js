/**
 * Reads one header from a plain header map. Header names are case-insensitive, and the casing that
 * reaches us depends on the transport and on the client, so this matches on the lowercased key.
 */
export function getHeader(headers: Record<string, string> | undefined, name: string): string {
    if (!headers) {
        return "";
    }
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === name) {
            return headers[key] ?? "";
        }
    }
    return "";
}
