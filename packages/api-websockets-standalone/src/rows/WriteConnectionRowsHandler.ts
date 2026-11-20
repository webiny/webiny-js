import { Logger } from "@webiny/api-core/features/logger/abstractions.js";
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

/** How many stale rows a sweep removes at once. */
const REMOVE_STALE_BATCH_SIZE = 10;

/**
 * Applies a change to the connection registry's rows, in the request container the event runs in,
 * on that request's registry (the storage registers it there).
 */
class WriteConnectionRowsHandlerImpl implements WebsocketsConnectionRowsEventHandler.Interface {
    public constructor(
        private readonly registry: ConnectionRegistry.Interface,
        private readonly logger: Logger.Interface
    ) {}

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
                // Answers every row it removed, even when a later one fails: their sockets must be
                // closed, and a removed row is never found by a later sweep. A row it couldn't
                // remove stays, for the next sweep. Removes them in batches, so a sweep after an
                // outage doesn't wait one round trip per row.
                const removed: string[] = [];
                for (let i = 0; i < stale.length; i += REMOVE_STALE_BATCH_SIZE) {
                    const batch = stale.slice(i, i + REMOVE_STALE_BATCH_SIZE);
                    const results = await Promise.allSettled(
                        batch.map(({ connectionId }) =>
                            unregisterConnection(this.registry, connectionId)
                        )
                    );
                    results.forEach((result, index) => {
                        const { connectionId } = batch[index];
                        if (result.status === "fulfilled") {
                            removed.push(connectionId);
                            return;
                        }
                        this.logger.error(
                            { error: result.reason, connectionId },
                            "[websockets] could not remove a stale connection row"
                        );
                    });
                }
                return removed;
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
        dependencies: [ConnectionRegistry, Logger]
    }
);
