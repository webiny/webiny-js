import { WebsocketsTransport } from "@webiny/api-websockets/exports/api.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { ProcessOwner } from "@webiny/event-handler-standalone";
import { WebsocketsConnectionManager } from "~/connectionManager/abstractions.js";
import { WebsocketsServerAdapter } from "~/adapter/abstractions.js";
import { WebsocketsMessageBus } from "~/bus/abstractions.js";
import { sendToLocalSockets } from "~/delivery/sendToLocalSockets.js";
import { disconnectLocalSockets } from "~/delivery/disconnectLocalSockets.js";

type ToMessage = (connectionIds: string[]) => WebsocketsMessageBus.Message;

/*
 * Sends to the sockets this process holds, and hands the rest to the process that holds them, through
 * the message bus. With one process there is no rest, apart from rows a previous run of the process
 * left behind.
 */
export class ServerWebsocketsTransportImpl implements WebsocketsTransport.Interface {
    public constructor(
        private readonly connectionManager: WebsocketsConnectionManager.Interface<unknown>,
        private readonly adapter: WebsocketsServerAdapter.Interface<unknown>,
        private readonly bus: WebsocketsMessageBus.Interface,
        private readonly owner: ProcessOwner.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async send<T extends GenericRecord = GenericRecord>(
        connections: WebsocketsTransport.SendConnection[],
        data: WebsocketsTransport.SendData<T>
    ): Promise<void> {
        const connectionIds = connections.map(connection => connection.connectionId);
        const missing = await sendToLocalSockets({
            connectionManager: this.connectionManager,
            adapter: this.adapter,
            logger: this.logger,
            connectionIds,
            data
        });
        await this.forward(missing, ids => {
            return { action: "send", connectionIds: ids, data };
        });
    }

    public async disconnect(
        connections: WebsocketsTransport.DisconnectConnection[]
    ): Promise<void> {
        const connectionIds = connections.map(connection => connection.connectionId);
        const missing = await disconnectLocalSockets({
            connectionManager: this.connectionManager,
            adapter: this.adapter,
            logger: this.logger,
            connectionIds
        });
        await this.forward(missing, ids => {
            return { action: "disconnect", connectionIds: ids };
        });
    }

    /*
     * Connections this process has no socket for. Its own are gone, so they are removed; another
     * process's are published to that process. A failed publish is logged, not thrown: the message
     * is lost, as it would be if that process were restarting.
     */
    private async forward(missing: string[], toMessage: ToMessage): Promise<void> {
        const byOwner = await this.connectionManager.groupByOwner(missing);
        for (const [owner, connectionIds] of byOwner) {
            if (owner === this.owner.id) {
                for (const connectionId of connectionIds) {
                    await this.connectionManager.remove(connectionId);
                }
                continue;
            }
            const message = toMessage(connectionIds);
            try {
                await this.bus.publish(owner, message);
            } catch (error) {
                this.logger.error(
                    { error, owner, connectionIds },
                    "[websockets] could not publish to the process holding these connections"
                );
            }
        }
    }
}

export const ServerWebsocketsTransport = WebsocketsTransport.createImplementation({
    implementation: ServerWebsocketsTransportImpl,
    dependencies: [
        WebsocketsConnectionManager,
        WebsocketsServerAdapter,
        WebsocketsMessageBus,
        ProcessOwner,
        Logger
    ]
});
