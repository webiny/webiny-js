import http from "node:http";
import { once } from "node:events";
import { Container } from "@webiny/di";
import { createHandler, HttpStreamBody } from "@webiny/event-handler-core";
import type { HandlerSetup, IHttpResponse } from "@webiny/event-handler-core";

export interface CreateServerHandlerOptions {
    root: HandlerSetup;
    request?: HandlerSetup;
    /**
     * Called once, at startup, after the root container is built and the HTTP server is created —
     * before it starts listening. Lets a transport attach to the raw server (e.g. a WebSockets
     * upgrade handler) using the already-initialized root container.
     */
    onServer?: (server: http.Server, rootContainer: Container) => void | Promise<void>;
}

export async function createServerHandler(
    options: CreateServerHandlerOptions
): Promise<http.Server> {
    // Build the root container eagerly (rather than lazily on the first request) so `onServer` can
    // hand it — and the running HTTP server — to transport add-ons like WebSockets at startup.
    const rootContainer = new Container();
    await options.root(rootContainer);

    const handle = createHandler({
        root: options.root,
        request: options.request,
        rootContainer
    });

    const server = http.createServer(async (req, res) => {
        try {
            const response = (await handle(req)) as IHttpResponse;
            res.writeHead(response.statusCode, response.headers);
            const { body } = response;
            if (HttpStreamBody.is(body)) {
                // Streaming response (e.g. SSE from an AI text stream). Flush the headers now —
                // Node otherwise holds them until the first write, so the client would see nothing
                // until the producer emits its first chunk.
                res.flushHeaders();
                for await (const chunk of body.source) {
                    if (res.destroyed) {
                        // Client went away mid-stream; stop pulling from the producer.
                        break;
                    }
                    // Respect back-pressure: `write` returning false means the socket buffer is
                    // full, and ignoring that would grow it without bound on a slow consumer.
                    if (!res.write(chunk)) {
                        await once(res, "drain");
                    }
                }
                if (!res.destroyed) {
                    res.end();
                }
            } else if (body === undefined || body === null) {
                res.end();
            } else if (typeof body === "string") {
                res.end(body);
            } else if (Buffer.isBuffer(body) || body instanceof Uint8Array) {
                // Binary response (e.g. asset delivery returns an image Buffer). Write the raw bytes —
                // JSON.stringify(buffer) would serialize it to `{"type":"Buffer","data":[...]}`, which
                // the browser rejects (ERR_BLOCKED_BY_ORB) since it isn't the declared image content.
                // The route's own Content-Type header (set via res.writeHead above) is preserved.
                res.end(body);
            } else {
                res.end(JSON.stringify(body));
            }
        } catch (err) {
            console.error("Unhandled error:", err);
            if (res.headersSent) {
                // A streaming body failed after the status line went out, so there is no way to turn
                // this into a 500 — writeHead would throw ERR_HTTP_HEADERS_SENT and mask the real
                // error. Destroy the socket so the client sees a truncated response rather than a
                // complete-looking one.
                res.destroy();
                return;
            }
            res.writeHead(500);
            res.end("Internal Server Error");
        }
    });

    if (options.onServer) {
        await options.onServer(server, rootContainer);
    }

    return server;
}
