import { ISocketsConnectionRegistry } from "~/registry";
import {
    ISocketsContext,
    ISocketsContextListConnectionsResponse,
    ISocketsIdentity
} from "./abstractions/ISocketsContext";
import {
    ISocketsTransporter,
    ISocketsTransporterSendConnection,
    ISocketsTransporterSendData
} from "~/transporter";

export class SocketsContext implements ISocketsContext {
    public readonly registry: ISocketsConnectionRegistry;
    private readonly transporter: ISocketsTransporter;

    constructor(registry: ISocketsConnectionRegistry, transporter: ISocketsTransporter) {
        this.registry = registry;
        this.transporter = transporter;
    }

    public async send<T extends ISocketsTransporterSendData = ISocketsTransporterSendData>(
        identity: ISocketsIdentity,
        data: T
    ): Promise<void> {
        const connections = await this.listConnections(identity);
        return this.transporter.send<T>(connections, data);
    }

    public async sendToConnection<
        T extends ISocketsTransporterSendData = ISocketsTransporterSendData
    >(connection: ISocketsTransporterSendConnection, data: T): Promise<void> {
        return this.transporter.send<T>([connection], data);
    }

    public async listConnections(
        identity: ISocketsIdentity
    ): ISocketsContextListConnectionsResponse {
        return await this.registry.listViaIdentity(identity.id);
    }
}
