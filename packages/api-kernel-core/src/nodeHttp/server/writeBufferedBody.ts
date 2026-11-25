import type { ServerResponse } from "node:http";

/**
 * Writes a fully-materialized body in one shot, picking the encoding from the body's runtime type.
 */
export function writeBufferedBody(res: ServerResponse, body: unknown): void {
    if (body === undefined || body === null) {
        res.end();
        return;
    }

    if (typeof body === "string") {
        res.end(body);
        return;
    }

    if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
        // Binary response (e.g. asset delivery returns an image Buffer). Write the raw bytes —
        // JSON.stringify(buffer) would serialize it to `{"type":"Buffer","data":[...]}`, which the
        // browser rejects (ERR_BLOCKED_BY_ORB) since it isn't the declared image content. The route's
        // own Content-Type header is preserved.
        res.end(body);
        return;
    }

    res.end(JSON.stringify(body));
}
