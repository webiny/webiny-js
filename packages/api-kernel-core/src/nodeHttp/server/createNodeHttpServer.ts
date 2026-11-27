import http from "node:http";
import type { Kernel } from "~/index.js";
import type { IHttpResponse } from "~/index.js";
import { writeHttpResponse } from "./writeHttpResponse.js";
import { writeErrorResponse } from "./writeErrorResponse.js";
import type { InFlightRequests } from "./InFlightRequests.js";

/**
 * How long an idle keep-alive connection stays open. Above the 60 s idle timeout of an AWS
 * Application Load Balancer, the most common proxy in front of a standalone API: a proxy that keeps
 * a connection longer than the server does can send a request down it just as the server closes it,
 * and answers 502 without the request ever reaching the API. Node's default is 5 s.
 */
export const DEFAULT_KEEP_ALIVE_TIMEOUT_MS = 65_000;

export interface ICreateNodeHttpServerOptions {
    /** Defaults to `DEFAULT_KEEP_ALIVE_TIMEOUT_MS`. Set it above the idle timeout of the proxy. */
    keepAliveTimeoutMs?: number;
}

/**
 * Creates the Node HTTP server and bridges each request into the DI handler app: dispatch, write the
 * response, and turn anything thrown into an error response. Each request is counted in `inFlight`
 * until its response closes.
 *
 * Callers own the returned server's lifecycle (`listen`, `close`), and transport add-ons such as the
 * WebSockets upgrade handler attach to it directly.
 */
export function createNodeHttpServer(
    app: Kernel,
    inFlight: InFlightRequests,
    options: ICreateNodeHttpServerOptions = {}
): http.Server {
    const server = http.createServer((req, res) => {
        inFlight.track(res);
        // Fire-and-forget: `createServer` ignores a returned promise, and every failure path is
        // already handled inside `handleRequest`. An unhandled rejection here would end the process.
        void handleRequest(app, req, res);
    });
    server.keepAliveTimeout = options.keepAliveTimeoutMs ?? DEFAULT_KEEP_ALIVE_TIMEOUT_MS;
    // Above the keep-alive timeout, so a request on a reused connection is never cut off while its
    // headers are still arriving.
    server.headersTimeout = server.keepAliveTimeout + 1_000;
    return server;
}

async function handleRequest(
    app: Kernel,
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
