import { SocketsConnectionRegistry } from "~/registry";
import {
    ISocketsContext,
    ISocketsContextListConnectionsResponse,
    ISocketsIdentity
} from "./abstractions/ISocketsContext";
import { ISocketsTransporter, ISocketsTransporterSendData } from "~/transporter";

export class SocketsContext implements ISocketsContext {
    public readonly registry: SocketsConnectionRegistry;
    private readonly transporter: ISocketsTransporter;

    constructor(registry: SocketsConnectionRegistry, transporter: ISocketsTransporter) {
        this.registry = registry;
        this.transporter = transporter;
    }

    public async send<T extends ISocketsTransporterSendData = ISocketsTransporterSendData>(
        identity: ISocketsIdentity,
        data: T
    ): Promise<void> {
        const connections = await this.listConnections(identity);
        if (connections.length === 0) {
            return;
        }
        return this.transporter.send<T>(connections, data);
    }

    public async listConnections(
        identity: ISocketsIdentity
    ): ISocketsContextListConnectionsResponse {
        return await this.registry.listViaIdentity(identity.id);
    }
}
