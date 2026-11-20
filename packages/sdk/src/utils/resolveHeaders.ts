import type { HeadersConfig } from "../types.js";

/** The extra headers of one request: the configured object, or what the configured function returns. */
export async function resolveHeaders(
    headers: HeadersConfig | undefined
): Promise<Record<string, string>> {
    if (!headers) {
        return {};
    }
    return typeof headers === "function" ? await headers() : headers;
}
