import WebinyError from "@webiny/error";
import { IWebsocketsConnectionRegistry } from "~/registry";
import {
    IWebsocketsContext,
    IWebsocketsContextDisconnectParams,
    IWebsocketsContextListConnectionsParams,
    IWebsocketsContextListConnectionsResponse,
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
    ): IWebsocketsContextListConnectionsResponse {
        const where = params?.where || {};
        if (where.identityId) {
            return await this.registry.listViaIdentity(where.identityId);
        } else if (where.tenant) {
            return await this.registry.listViaTenant(where.tenant, where.locale);
        }
        return await this.registry.listAll();
    }

    public async disconnect(
        params?: IWebsocketsContextDisconnectParams,
        notify = true
    ): Promise<boolean> {
        const where = params?.where || {};

        const connections = await this.listConnections({ where });
        for (const connection of connections) {
            await this.registry.unregister(connection);
        }
        if (!notify) {
            return true;
        }

        try {
            await this.transport.send(connections, {
                action: "forcedDisconnect"
            });
        } catch (ex) {
            throw new WebinyError(
                "Failed to notify the clients about the forced disconnect.",
                "FORCED_DISCONNECT_ERROR",
                {
                    connections,
                    error: ex
                }
            );
        }

        return true;
    }
}
