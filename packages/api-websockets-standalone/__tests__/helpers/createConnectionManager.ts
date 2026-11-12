import type { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import type { EventDispatcher } from "@webiny/event-handler-core";
import { ServerConnectionManagerImpl } from "~/connectionManager/ServerConnectionManager.js";
import { InMemoryLiveSockets } from "~/liveSockets/InMemoryLiveSockets.js";
import { WriteConnectionRowsHandler } from "~/rows/WriteConnectionRowsHandler.js";
import type { IWebsocketsConnectionRowsEvent } from "~/rows/abstractions.js";

/**
 * Dispatches the connection rows events the manager sends the way the server's dispatcher does in
 * effect: the row handler runs on a request's registry, here `registry`.
 */
export const createRowsDispatcher = (
    registry: ConnectionRegistry.Interface
): EventDispatcher.Interface => {
    const handler = new WriteConnectionRowsHandler(registry);
    return {
        dispatch: async <TResult = unknown>(event: unknown) => {
            const ctx = { event: event as IWebsocketsConnectionRowsEvent, metadata: {} };
            const result = await handler.execute(ctx, async () => null);
            return result as TResult;
        }
    };
};

/** The server's connection manager, with its live sockets, writing rows to `registry`. */
export const createConnectionManager = (
    registry: ConnectionRegistry.Interface,
    owner: { id: string },
    sockets = new InMemoryLiveSockets()
): ServerConnectionManagerImpl => {
    return new ServerConnectionManagerImpl(sockets, createRowsDispatcher(registry), owner);
};
