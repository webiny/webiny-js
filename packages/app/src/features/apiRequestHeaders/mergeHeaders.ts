import type { ApiRequestHeaders } from "./abstractions.js";

type Headers = ApiRequestHeaders.Headers;

/**
 * The providers' headers merged in order: a later provider's value replaces an earlier one's, whatever
 * the case of the name (header names are case-insensitive). An undefined value means "no header".
 */
export function mergeProviderHeaders(results: Array<Headers | undefined>): Headers {
    const merged = new Map<string, [string, string | number]>();
    for (const result of results) {
        for (const [name, value] of Object.entries(result ?? {})) {
            if (value !== undefined) {
                merged.set(name.toLowerCase(), [name, value]);
            }
        }
    }
    return Object.fromEntries(merged.values());
}

/**
 * The request's own headers (and those of the decorators around this one) win over the providers', whatever
 * the case of the name.
 */
export function withProviderHeaders(provided: Headers, own: Headers | undefined): Headers {
    const ownNames = new Set(Object.keys(own ?? {}).map(name => name.toLowerCase()));
    const headers: Headers = {};
    for (const [name, value] of Object.entries(provided)) {
        if (!ownNames.has(name.toLowerCase())) {
            headers[name] = value;
        }
    }
    return { ...headers, ...own };
}
