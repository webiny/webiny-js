import { WebsocketsTransport } from "@webiny/api-websockets/exports/api.js";
import type { GenericRecord } from "@webiny/api/types.js";
import { WebsocketsConnectionManager, WebsocketsServerAdapter } from "~/abstractions.js";

export class ServerWebsocketsTransportImpl implements WebsocketsTransport.Interface {
    private readonly connectionManager: WebsocketsConnectionManager.Interface<unknown>;
    private readonly adapter: WebsocketsServerAdapter.Interface<unknown>;

    public constructor(
        connectionManager: WebsocketsConnectionManager.Interface<unknown>,
        adapter: WebsocketsServerAdapter.Interface<unknown>
    ) {
        this.connectionManager = connectionManager;
        this.adapter = adapter;
    }

    public async send<T extends GenericRecord = GenericRecord>(
        connections: WebsocketsTransport.SendConnection[],
        data: WebsocketsTransport.SendData<T>
    ): Promise<void> {
        for (const connection of connections) {
            const { connectionId } = connection;
            const socket = this.connectionManager.getSocket(connectionId);
            if (socket === undefined) {
                await this.connectionManager.remove(connectionId);
                continue;
            }
            try {
                await this.adapter.send(socket, JSON.stringify(data));
            } catch (ex) {
                console.error(
                    `Failed to send message to connection "${connectionId}". Check logs for more information.`
                );
                console.log(ex);
            }
        }
    }

    public async disconnect(
        connections: WebsocketsTransport.DisconnectConnection[]
    ): Promise<void> {
        for (const connection of connections) {
            const { connectionId } = connection;
            const socket = this.connectionManager.getSocket(connectionId);
            if (socket === undefined) {
                await this.connectionManager.remove(connectionId);
                continue;
            }
            try {
                this.adapter.close(socket);
                await this.connectionManager.remove(connectionId);
            } catch (ex) {
                console.error(
                    `Failed to disconnect connection "${connectionId}". Check logs for more information.`
                );
                console.log(ex);
            }
        }
    }
}

export const ServerWebsocketsTransport = WebsocketsTransport.createImplementation({
    implementation: ServerWebsocketsTransportImpl,
    dependencies: [WebsocketsConnectionManager, WebsocketsServerAdapter]
});
