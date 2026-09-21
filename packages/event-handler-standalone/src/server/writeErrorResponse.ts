import type { ServerResponse } from "node:http";

/**
 * Last-resort handler for a request that threw.
 *
 * Once the status line is out there is no way to turn the response into a 500 — `writeHead` would
 * throw ERR_HTTP_HEADERS_SENT and mask the real error — so the socket is destroyed instead. That
 * leaves the client with a truncated response rather than a complete-looking one, which is reachable
 * whenever a streaming body fails mid-flight.
 */
export function writeErrorResponse(res: ServerResponse, err: unknown): void {
    console.error("Unhandled error:", err);

    if (res.headersSent) {
        res.destroy();
        return;
    }

    res.writeHead(500);
    res.end("Internal Server Error");
}
