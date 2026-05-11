import { Result } from "@webiny/feature/api";
import type {
    IWebsocketsConnectionRegistry,
    IWebsocketsConnectionRegistryData
} from "~/registry/index.js";
import type {
    IWebsocketsContextObject,
    IWebsocketsContextDisconnectConnectionsParams,
    IWebsocketsContextListConnectionsParams,
    IWebsocketsIdentity
} from "./abstractions/IWebsocketsContext.js";
import type {
    IWebsocketsTransport,
    IWebsocketsTransportSendConnection,
    IWebsocketsTransportSendData
} from "~/transport/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import {
    WebsocketServiceError,
    WebsocketForceDisconnectError,
    WebsocketForceDisconnectNotificationError
} from "~/features/WebsocketService/errors.js";
import { WebsocketService } from "~/features/WebsocketService/index.js";

export class WebsocketsContext implements IWebsocketsContextObject {
    public readonly registry: IWebsocketsConnectionRegistry;
    private readonly transport: IWebsocketsTransport;

    constructor(registry: IWebsocketsConnectionRegistry, transport: IWebsocketsTransport) {
        this.registry = registry;
        this.transport = transport;
    }

    public async send<T extends GenericRecord = GenericRecord>(
        identity: Pick<IWebsocketsIdentity, "id">,
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketService.Error>> {
        const result = await this.listConnections({
            where: {
                identityId: identity.id
            }
        });

        if (result.isFail()) {
            return Result.fail(result.error);
        }

        try {
            await this.transport.send<T>(result.value, data);
        } catch (error) {
            return Result.fail(new WebsocketServiceError(error));
        }

        return Result.ok();
    }

    public async sendToConnections<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketService.Error>> {
        try {
            await this.transport.send<T>(connections, data);
        } catch (error) {
            return Result.fail(new WebsocketServiceError(error));
        }

        return Result.ok();
    }

    public async listConnections(
        params?: IWebsocketsContextListConnectionsParams
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketService.Error>> {
        let connections: IWebsocketsConnectionRegistryData[] = [];

        try {
            const where = params?.where || {};
            if (where.identityId) {
                connections = await this.registry.listViaIdentity(where.identityId);
            } else if (where.connections) {
                connections = await this.registry.listViaConnections(where.connections);
            } else if (where.tenant) {
                connections = await this.registry.listViaTenant(where.tenant);
            } else {
                connections = await this.registry.listAll();
            }
        } catch (error) {
            return Result.fail(new WebsocketServiceError(error));
        }

        // Defensively filter connections that were created in the last 3 hours.
        // This protects from attempting to send messages to stale connections.
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
        connections = connections.filter(c => c.connectedOn >= threeHoursAgo);

        return Result.ok(connections);
    }

    public async disconnect(
        params?: IWebsocketsContextDisconnectConnectionsParams,
        notify = true
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketService.Error>> {
        const result = await this.listConnections(params);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const connections = result.value;

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
            } catch (error) {
                return Result.fail(new WebsocketForceDisconnectNotificationError(error));
            }
        }

        try {
            await this.transport.disconnect(connections);
        } catch (error) {
            return Result.fail(new WebsocketForceDisconnectError(error));
        }

        return Result.ok(connections);
    }
}
