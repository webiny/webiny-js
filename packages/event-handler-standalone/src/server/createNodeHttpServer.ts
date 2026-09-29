import http from "node:http";
import type { HandlerApp } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import { writeHttpResponse } from "./writeHttpResponse.js";
import { writeErrorResponse } from "./writeErrorResponse.js";

/**
 * Creates the Node HTTP server and bridges each request into the DI handler app: dispatch, write the
 * response, and turn anything thrown into an error response.
 *
 * Callers own the returned server's lifecycle (`listen`, `close`), and transport add-ons such as the
 * WebSockets upgrade handler attach to it directly.
 */
export function createNodeHttpServer(app: HandlerApp): http.Server {
    return http.createServer((req, res) => {
        // Fire-and-forget: `createServer` ignores a returned promise, and every failure path is
        // already handled inside `handleRequest`. An unhandled rejection here would end the process.
        void handleRequest(app, req, res);
    });
}

async function handleRequest(
    app: HandlerApp,
    req: http.IncomingMessage,
    res: http.ServerResponse
): Promise<void> {
    try {
        const response: IHttpResponse = await app.handle(req);

        await writeHttpResponse(res, response);
    } catch (err) {
        writeErrorResponse(res, err);
    }
}
