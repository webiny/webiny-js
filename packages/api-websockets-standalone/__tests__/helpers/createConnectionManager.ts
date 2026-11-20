import { vi } from "vitest";
import type { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import type { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import type { EventDispatcher } from "@webiny/event-handler-core";
import { ServerConnectionManagerImpl } from "~/connectionManager/ServerConnectionManager.js";
import { InMemoryLiveSockets } from "~/liveSockets/InMemoryLiveSockets.js";
import { WriteConnectionRowsHandler } from "~/rows/WriteConnectionRowsHandler.js";
import type { IWebsocketsConnectionRowsEvent } from "~/rows/abstractions.js";

/** A logger whose calls a test can assert. */
export const createMockLogger = () => ({
    trace: vi.fn(),
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    log: vi.fn()
});

/**
 * Dispatches the connection rows events the manager sends the way the server's dispatcher does in
 * effect: the row handler runs on a request's registry, here `registry`.
 */
export const createRowsDispatcher = (
    registry: ConnectionRegistry.Interface,
    logger: Logger.Interface = createMockLogger()
): EventDispatcher.Interface => {
    const handler = new WriteConnectionRowsHandler(registry, logger);
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
    sockets = new InMemoryLiveSockets(),
    logger: Logger.Interface = createMockLogger()
): ServerConnectionManagerImpl => {
    return new ServerConnectionManagerImpl(sockets, createRowsDispatcher(registry, logger), owner);
};
