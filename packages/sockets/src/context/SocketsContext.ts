import { Context } from "~/types";
import { SocketsConnectionRegistry } from "~/registry";
import {
    ISocketsContext,
    ISocketsContextListConnectionsResponse,
    ISocketsIdentity
} from "./abstractions/ISocketsContext";
import {
    ISocketsTransporter,
    ISocketsTransporterSendData,
    SocketsTransporter
} from "~/transporter";

export class SocketsContext implements ISocketsContext {
    private readonly context: Context;
    private readonly registry: SocketsConnectionRegistry;
    private readonly transporter: ISocketsTransporter;

    constructor(context: Context) {
        this.context = context;
        // @ts-expect-error
        const documentClient = this.context.db?.driver?.documentClient;
        this.registry = new SocketsConnectionRegistry(documentClient);
        this.transporter = new SocketsTransporter();
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
