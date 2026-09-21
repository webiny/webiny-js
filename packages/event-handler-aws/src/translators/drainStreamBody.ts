import type { HttpStreamBody } from "@webiny/event-handler-core";

const TEXT_CONTENT_TYPE = /^text\/|^application\/(json|javascript|xml)|\+json|event-stream/i;

function getContentType(headers: Record<string, string> | undefined): string {
    if (!headers) {
        return "";
    }
    // Header names are case-insensitive and routes set them inconsistently ("Content-Type" vs
    // "content-type"), so match on the lowercased key rather than indexing one spelling.
    for (const key of Object.keys(headers)) {
        if (key.toLowerCase() === "content-type") {
            return headers[key] ?? "";
        }
    }
    return "";
}

/**
 * Collects a streaming body into a single buffered value, for transports that cannot stream.
 *
 * Returns a string when the content type says the bytes are text (SSE, JSON), and the raw bytes
 * otherwise — a binary stream must stay bytes so the caller can base64-encode it.
 *
 * This is the price of a transport that buffers: the route still works, it just delivers all at
 * once. Nothing here decides whether draining is appropriate; the caller does, by virtue of being a
 * translator for such a transport.
 */
export async function drainStreamBody(
    body: HttpStreamBody,
    headers: Record<string, string> | undefined
): Promise<string | Uint8Array> {
    const bytes = await body.collect();

    if (TEXT_CONTENT_TYPE.test(getContentType(headers))) {
        return new TextDecoder().decode(bytes);
    }

    return bytes;
}
