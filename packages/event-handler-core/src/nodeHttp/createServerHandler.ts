import type http from "node:http";
import { AsyncLocalStorage } from "node:async_hooks";
import { Container } from "@webiny/di";
import { HandlerApp } from "~/index.js";
import { EventDispatcher } from "~/index.js";
import type { HandlerSetup } from "~/index.js";
import { createNodeHttpServer } from "~/nodeHttp/server/createNodeHttpServer.js";
import { HandlerAppEventDispatcher } from "~/nodeHttp/server/HandlerAppEventDispatcher.js";
import { handleShutdownSignals } from "~/nodeHttp/server/handleShutdownSignals.js";
import { InFlightRequests } from "~/nodeHttp/server/InFlightRequests.js";

export interface CreateServerHandlerOptions {
    root: HandlerSetup;
    child?: HandlerSetup;
    /**
     * Called once, at startup, after the root container is built and the HTTP server is created —
     * before it starts listening. Lets a transport attach to the raw server (e.g. a WebSockets
     * upgrade handler) using the already-initialized root container.
     */
    onServer?: (server: http.Server, rootContainer: Container) => void | Promise<void>;
    /**
     * Called once, when the process is asked to stop (SIGTERM or SIGINT), after the server stops
     * taking connections and before the process exits. HTTP requests already in flight keep
     * running alongside it; `requestsFinished` resolves once they are done, so anything they still
     * use (a message bus, a pool) should close after it. The hook and the requests share at most
     * 8 seconds. Without the hook, the process keeps Node's default and exits at once.
     */
    onShutdown?: (rootContainer: Container, params: IOnShutdownParams) => Promise<void>;
    /**
     * Exit cleanly on SIGTERM or SIGINT (close the server, let requests in flight finish, exit
     * within 8 seconds) without an `onShutdown` hook, so the root container isn't built just to
     * shut down.
     */
    exitOnShutdownSignal?: boolean;
}

export interface IOnShutdownParams {
    /** Resolves once no HTTP request is in flight. WebSocket connections are not counted. */
    requestsFinished: Promise<void>;
}

export async function createServerHandler(
    options: CreateServerHandlerOptions
): Promise<http.Server> {
    /*
     * Taken here, at boot and outside any request, so dispatched events never inherit a request's
     * async context.
     */
    const runInBootContext = AsyncLocalStorage.snapshot();

    const app = HandlerApp.init({
        root: async container => {
            // Registered first, so everything `root` registers can depend on it.
            const dispatcher = new HandlerAppEventDispatcher(app, runInBootContext);
            container.registerInstance(EventDispatcher, dispatcher);

            await options.root(container);
        },
        child: options.child
    });

    const inFlight = new InFlightRequests();
    const server = createNodeHttpServer(app, inFlight);

    if (options.onServer) {
        // Build the root container eagerly (rather than lazily on the first request) so `onServer` can
        // hand it — and the running HTTP server — to transport add-ons like WebSockets at startup.
        const rootContainer = await app.getRootContainer();

        await options.onServer(server, rootContainer);
    }

    const onShutdown = options.onShutdown;
    if (onShutdown || options.exitOnShutdownSignal) {
        handleShutdownSignals({
            server,
            waitForRequests: () => {
                inFlight.stopConnectionReuse();
                return inFlight.waitUntilAllFinished();
            },
            shutdown: async requestsFinished => {
                if (!onShutdown) {
                    return;
                }
                const rootContainer = await app.getRootContainer();
                await onShutdown(rootContainer, { requestsFinished });
            }
        });
    }

    return server;
}
