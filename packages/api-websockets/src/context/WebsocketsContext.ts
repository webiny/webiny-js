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
        const where = params?.where || {};
        if (where.identityId) {
            return await this.registry.listViaIdentity(where.identityId);
        } else if (where.tenant) {
            return await this.registry.listViaTenant(where.tenant, where.locale);
        }
        return await this.registry.listAll();
    }

    public async disconnect(params?: IWebsocketsContextDisconnectParams): Promise<boolean> {
        const where = params?.where || {};

        const connections = await this.listConnections({ where });
        for (const connection of connections) {
            await this.registry.unregister(connection);
        }
        return true;
    }
}
