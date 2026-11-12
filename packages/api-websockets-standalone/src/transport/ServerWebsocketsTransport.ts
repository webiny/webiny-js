import { ConnectionRegistry, WebsocketsTransport } from "@webiny/api-websockets/exports/api.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { Logger } from "@webiny/api-core/features/logger/abstractions.js";
import { ProcessOwner } from "@webiny/event-handler-standalone";
import { WebsocketsLiveSockets } from "~/liveSockets/abstractions.js";
import { WebsocketsServerAdapter } from "~/adapter/abstractions.js";
import { WebsocketsMessageBus } from "~/bus/abstractions.js";
import { sendToLocalSockets } from "~/delivery/sendToLocalSockets.js";
import { disconnectLocalSockets } from "~/delivery/disconnectLocalSockets.js";
import type { LocalSockets } from "~/delivery/types.js";
import { unregisterConnection } from "~/rows/unregisterConnection.js";

type ToMessage = (connectionIds: string[]) => WebsocketsMessageBus.Message;

/*
 * Sends to the sockets this process holds, and hands the rest to the process that holds them, through
 * the message bus. With one process there is no rest, apart from rows a previous run of the process
 * left behind.
 *
 * It runs in a request, so the connections' rows come from that request's registry (a storage); the
 * live sockets are the process's (a root singleton).
 */
export class ServerWebsocketsTransportImpl implements WebsocketsTransport.Interface {
    private readonly local: LocalSockets;

    public constructor(
        private readonly sockets: WebsocketsLiveSockets.Interface,
        private readonly registry: ConnectionRegistry.Interface,
        private readonly adapter: WebsocketsServerAdapter.Interface<unknown>,
        private readonly bus: WebsocketsMessageBus.Interface,
        private readonly owner: ProcessOwner.Interface,
        private readonly logger: Logger.Interface
    ) {
        this.local = {
            getSocket: connectionId => this.sockets.getSocket(connectionId),
            remove: connectionId => this.remove(connectionId)
        };
    }

    public async send<T extends GenericRecord = GenericRecord>(
        connections: WebsocketsTransport.SendConnection[],
        data: WebsocketsTransport.SendData<T>
    ): Promise<void> {
        const connectionIds = connections.map(connection => connection.connectionId);
        const missing = await sendToLocalSockets({
            connectionManager: this.local,
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
            connectionManager: this.local,
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
        const byOwner = await this.groupByOwner(missing);
        for (const [owner, connectionIds] of byOwner) {
            if (owner === this.owner.id) {
                for (const connectionId of connectionIds) {
                    await this.remove(connectionId);
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

    /*
     * The process holding each of these connections. Rows without an owner are left out: nobody can
     * say who holds them, so they wait for the heartbeat's stale cleanup.
     */
    private async groupByOwner(connectionIds: string[]): Promise<Map<string, string[]>> {
        const byOwner = new Map<string, string[]>();
        if (connectionIds.length === 0) {
            return byOwner;
        }
        const connections = await this.registry.listViaConnections(connectionIds);
        for (const connection of connections) {
            if (!connection.owner) {
                continue;
            }
            const group = byOwner.get(connection.owner) ?? [];
            group.push(connection.connectionId);
            byOwner.set(connection.owner, group);
        }
        return byOwner;
    }

    private async remove(connectionId: string): Promise<void> {
        this.sockets.remove(connectionId);
        await unregisterConnection(this.registry, connectionId);
    }
}

export const ServerWebsocketsTransport = WebsocketsTransport.createImplementation({
    implementation: ServerWebsocketsTransportImpl,
    dependencies: [
        WebsocketsLiveSockets,
        ConnectionRegistry,
        WebsocketsServerAdapter,
        WebsocketsMessageBus,
        ProcessOwner,
        Logger
    ]
});
