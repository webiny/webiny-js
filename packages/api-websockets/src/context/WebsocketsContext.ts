import { IWebsocketsConnectionRegistry } from "~/registry";
import {
    IWebsocketsContext,
    IWebsocketsContextDisconnectParams,
    IWebsocketsContextListConnectionsParams,
    IWebsocketsContextListConnectionsResponse,
    IWebsocketsIdentity
} from "./abstractions/IWebsocketsContext";
import {
    IWebsocketsTransporter,
    IWebsocketsTransporterSendConnection,
    IWebsocketsTransporterSendData
} from "~/transporter";

export class WebsocketsContext implements IWebsocketsContext {
    public readonly registry: IWebsocketsConnectionRegistry;
    private readonly transporter: IWebsocketsTransporter;

    constructor(registry: IWebsocketsConnectionRegistry, transporter: IWebsocketsTransporter) {
        this.registry = registry;
        this.transporter = transporter;
    }

    public async send<T extends IWebsocketsTransporterSendData = IWebsocketsTransporterSendData>(
        identity: IWebsocketsIdentity,
        data: T
    ): Promise<void> {
        const connections = await this.listConnections({
            where: {
                identityId: identity.id
            }
        });
        return this.transporter.send<T>(connections, data);
    }

    public async sendToConnection<
        T extends IWebsocketsTransporterSendData = IWebsocketsTransporterSendData
    >(connection: IWebsocketsTransporterSendConnection, data: T): Promise<void> {
        return this.transporter.send<T>([connection], data);
    }

    public async listConnections(
        params?: IWebsocketsContextListConnectionsParams
    ): IWebsocketsContextListConnectionsResponse {
        if (params?.where?.identityId) {
            return await this.registry.listViaIdentity(params?.where?.identityId);
        } else if (params?.where?.tenant) {
            return await this.registry.listViaTenant(params.where.tenant, params?.where.locale);
        }
        return await this.registry.listAll();
    }

    public async disconnect(params?: IWebsocketsContextDisconnectParams): Promise<boolean> {
        if (params?.connectionId) {
            await this.registry.unregister({ connectionId: params.connectionId });
            return true;
        } else if (params?.identityId) {
            const connections = await this.listConnections({
                where: {
                    identityId: params?.identityId
                }
            });
            for (const connection of connections) {
                await this.registry.unregister({ connectionId: connection.connectionId });
            }
            return true;
        } else if (params?.tenant) {
            const connections = await this.listConnections({
                where: {
                    tenant: params.tenant,
                    locale: params.locale
                }
            });
            for (const connection of connections) {
                await this.registry.unregister({ connectionId: connection.connectionId });
            }
            return true;
        }
        const connections = await this.listConnections();
        for (const connection of connections) {
            await this.registry.unregister({ connectionId: connection.connectionId });
        }
        return true;
    }
}
