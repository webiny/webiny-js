import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";
import type { EventContext } from "@webiny/event-handler-core";
import {
    WebsocketsConnectionRowsEventHandler,
    type IWebsocketsConnectionRowsEvent,
    type WebsocketsConnectionRowWrite,
    type WebsocketsConnectionRowWriteFailure,
    type WebsocketsConnectionRowsResult
} from "./abstractions.js";
import { unregisterConnection } from "./unregisterConnection.js";

/**
 * Applies a change to the connection registry's rows, in the request container the event runs in,
 * on that request's registry (the storage registers it there).
 */
class WriteConnectionRowsHandlerImpl implements WebsocketsConnectionRowsEventHandler.Interface {
    public constructor(private readonly registry: ConnectionRegistry.Interface) {}

    public async execute(
        ctx: EventContext<IWebsocketsConnectionRowsEvent>
    ): Promise<WebsocketsConnectionRowsResult> {
        const change = ctx.event;
        switch (change.action) {
            case "write": {
                const failures: (WebsocketsConnectionRowWriteFailure | null)[] = [];
                for (const write of change.writes) {
                    failures.push(await this.apply(write));
                }
                return failures;
            }
            case "removeStale": {
                const stale = await this.registry.listStale(new Date(change.olderThan));
                const connectionIds = stale.map(connection => connection.connectionId);
                for (const connectionId of connectionIds) {
                    await unregisterConnection(this.registry, connectionId);
                }
                return connectionIds;
            }
        }
    }

    private async apply(
        write: WebsocketsConnectionRowWrite
    ): Promise<WebsocketsConnectionRowWriteFailure | null> {
        try {
            switch (write.action) {
                case "register":
                    await this.registry.register(write.connection);
                    break;
                case "unregister":
                    await unregisterConnection(this.registry, write.connectionId);
                    break;
                case "updateLastSeen":
                    await this.registry.updateLastSeen(write.connectionId);
                    break;
            }
            return null;
        } catch (err) {
            const error = err as { message?: string; code?: string };
            return { message: error.message ?? String(err), code: error.code };
        }
    }
}

export const WriteConnectionRowsHandler = WebsocketsConnectionRowsEventHandler.createImplementation(
    {
        implementation: WriteConnectionRowsHandlerImpl,
        dependencies: [ConnectionRegistry]
    }
);
