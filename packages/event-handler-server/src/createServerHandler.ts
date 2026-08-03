import http from "node:http";
import { Container } from "@webiny/di";
import { HandlerApp } from "@webiny/event-handler-core";
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

    const app = HandlerApp.init({
        root: options.root,
        request: options.request,
        rootContainer
    });

    const server = http.createServer(async (req, res) => {
        try {
            const response = (await app.handle(req)) as IHttpResponse;
            res.writeHead(response.statusCode, response.headers);
            const { body } = response;
            if (body === undefined || body === null) {
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
            res.writeHead(500);
            res.end("Internal Server Error");
        }
    });

    if (options.onServer) {
        await options.onServer(server, rootContainer);
    }

    return server;
}
