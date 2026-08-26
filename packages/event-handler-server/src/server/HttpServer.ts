import http from "node:http";
import type { HandlerApp } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import { writeHttpResponse } from "~/response/writeHttpResponse.js";
import { writeErrorResponse } from "~/response/writeErrorResponse.js";

/**
 * Owns the Node HTTP server and the per-request bridge into the DI handler app: dispatch the
 * request, write the response, and turn anything thrown into an error response.
 *
 * Kept as a class so `createServerHandler` stays a composition root — it wires the app and hands the
 * server back, without also being the place where request handling lives.
 */
export class HttpServer {
    private readonly server: http.Server;

    constructor(private readonly app: HandlerApp) {
        this.server = http.createServer((req, res) => {
            // Fire-and-forget: `createServer` ignores a returned promise, and every failure path is
            // already handled inside `handleRequest`.
            void this.handleRequest(req, res);
        });
    }

    /**
     * The underlying Node server. Callers own its lifecycle (`listen`, `close`) and transport add-ons
     * such as the WebSockets upgrade handler attach to it directly.
     */
    getServer(): http.Server {
        return this.server;
    }

    private async handleRequest(
        req: http.IncomingMessage,
        res: http.ServerResponse
    ): Promise<void> {
        try {
            const response: IHttpResponse = await this.app.handle(req);

            await writeHttpResponse(res, response);
        } catch (err) {
            writeErrorResponse(res, err);
        }
    }
}
