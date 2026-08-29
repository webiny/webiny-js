import type http from "node:http";
import { Container } from "@webiny/di";
import { HandlerApp } from "@webiny/event-handler-core";
import type { HandlerSetup } from "@webiny/event-handler-core";
import { createNodeHttpServer } from "~/server/createNodeHttpServer.js";

export interface CreateServerHandlerOptions {
    root: HandlerSetup;
    child?: HandlerSetup;
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
    const app = HandlerApp.init({
        root: options.root,
        child: options.child
    });

    const server = createNodeHttpServer(app);

    if (options.onServer) {
        // Build the root container eagerly (rather than lazily on the first request) so `onServer` can
        // hand it — and the running HTTP server — to transport add-ons like WebSockets at startup.
        const rootContainer = await app.getRootContainer();

        await options.onServer(server, rootContainer);
    }

    return server;
}
