import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import type { EventContext } from "@webiny/event-handler-core";
import {
    WebsocketsConnectionRowsEventHandler,
    type IWebsocketsConnectionRowsEvent
} from "./WebsocketsConnectionRowsEvent.js";

/**
 * Applies a change to the connection registry's rows, in the request container the event runs in,
 * on that request's registry (the storage registers it there).
 */
export class WriteConnectionRowsHandlerImpl
    implements WebsocketsConnectionRowsEventHandler.Interface
{
    public constructor(private readonly registry: ConnectionRegistry.Interface) {}

    public async execute(
        ctx: EventContext<IWebsocketsConnectionRowsEvent>
    ): Promise<string[] | null> {
        const change = ctx.event;
        switch (change.action) {
            case "register":
                await this.registry.register(change.connection);
                return null;
            case "unregister":
                await unregister(this.registry, change.connectionId);
                return null;
            case "updateLastSeen":
                await this.registry.updateLastSeen(change.connectionId);
                return null;
            case "removeStale": {
                const stale = await this.registry.listStale(new Date(change.olderThan));
                const connectionIds = stale.map(connection => connection.connectionId);
                for (const connectionId of connectionIds) {
                    await unregister(this.registry, connectionId);
                }
                return connectionIds;
            }
        }
    }
}

/** Removes a connection's row. One already gone (removed by another process) is not an error. */
export const unregister = async (
    registry: ConnectionRegistry.Interface,
    connectionId: string
): Promise<void> => {
    try {
        await registry.unregister({ connectionId });
    } catch (err) {
        if ((err as { code?: string }).code === "CONNECTION_NOT_FOUND") {
            return;
        }
        throw err;
    }
};

export const WriteConnectionRowsHandler = WebsocketsConnectionRowsEventHandler.createImplementation(
    {
        implementation: WriteConnectionRowsHandlerImpl,
        dependencies: [ConnectionRegistry]
    }
);
