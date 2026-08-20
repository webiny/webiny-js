import http from "node:http";
import { Container } from "@webiny/di";
import { createHandler } from "@webiny/event-handler-core";
import type { HandlerSetup, IHttpResponse } from "@webiny/event-handler-core";
import { writeHttpResponse } from "~/response/writeHttpResponse.js";
import { writeErrorResponse } from "~/response/writeErrorResponse.js";

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

            await writeHttpResponse(res, response);
        } catch (err) {
            writeErrorResponse(res, err);
        }
    });

    if (options.onServer) {
        await options.onServer(server, rootContainer);
    }

    return server;
}
