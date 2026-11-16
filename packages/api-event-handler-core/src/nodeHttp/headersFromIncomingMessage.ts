import type { IncomingMessage } from "node:http";

/**
 * Node gives a header that appears more than once as an array; the auth and tenant headers are read
 * from the first value.
 */
export function headersFromIncomingMessage(event: IncomingMessage): Record<string, string> {
    const headers: Record<string, string> = {};
    for (const [name, value] of Object.entries(event?.headers ?? {})) {
        if (Array.isArray(value)) {
            headers[name] = value[0] ?? "";
        } else if (value !== undefined) {
            headers[name] = value;
        }
    }
    return headers;
}
