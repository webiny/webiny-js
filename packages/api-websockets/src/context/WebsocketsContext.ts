import WebinyError from "@webiny/error";
import { IWebsocketsConnectionRegistry, IWebsocketsConnectionRegistryData } from "~/registry";
import {
    IWebsocketsContext,
    IWebsocketsContextDisconnectConnectionsParams,
    IWebsocketsContextListConnectionsParams,
    IWebsocketsIdentity
} from "./abstractions/IWebsocketsContext";
import {
    IWebsocketsTransport,
    IWebsocketsTransportSendConnection,
    IWebsocketsTransportSendData
} from "~/transport";
import { GenericRecord } from "@webiny/api/types";

export class WebsocketsContext implements IWebsocketsContext {
    public readonly registry: IWebsocketsConnectionRegistry;
    private readonly transport: IWebsocketsTransport;

    constructor(registry: IWebsocketsConnectionRegistry, transport: IWebsocketsTransport) {
        this.registry = registry;
        this.transport = transport;
    }

    public async send<T extends GenericRecord = GenericRecord>(
        identity: IWebsocketsIdentity,
        data: IWebsocketsTransportSendData<T>
    ): Promise<void> {
        const connections = await this.listConnections({
            where: {
                identityId: identity.id
            }
        });
        return this.transport.send<T>(connections, data);
    }

    public async sendToConnections<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<void> {
        return this.transport.send<T>(connections, data);
    }

    public async listConnections(
        params?: IWebsocketsContextListConnectionsParams
    ): Promise<IWebsocketsConnectionRegistryData[]> {
        const where = params?.where || {};
        if (where.identityId) {
            return await this.registry.listViaIdentity(where.identityId);
        } else if (where.connections) {
            return await this.registry.listViaConnections(where.connections);
        } else if (where.tenant) {
            return await this.registry.listViaTenant(where.tenant, where.locale);
        }
        return await this.registry.listAll();
    }

    public async disconnect(
        params?: IWebsocketsContextDisconnectConnectionsParams,
        notify = true
    ): Promise<IWebsocketsConnectionRegistryData[]> {
        const connections = await this.listConnections(params);

        for (const connection of connections) {
            try {
                await this.registry.unregister(connection);
            } catch {
                // do nothing
            }
        }
        if (notify) {
            try {
                await this.transport.send(connections, {
                    action: "forcedDisconnect"
                });
            } catch (ex) {
                throw new WebinyError(
                    "Failed to notify the clients about the forced disconnect.",
                    "FORCED_DISCONNECT_NOTIFICATION_ERROR",
                    {
                        connections,
                        error: ex
                    }
                );
            }
        }
        try {
            await this.transport.disconnect(connections);
        } catch (ex) {
            throw new WebinyError(
                "Failed to forcefully disconnect the Websocket clients.",
                "FORCED_DISCONNECT_ERROR",
                {
                    connections,
                    error: ex
                }
            );
        }

        return connections;
    }
}
