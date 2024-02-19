import {
    ISocketsTransporter,
    ISocketsTransporterSendConnection,
    ISocketsTransporterSendData
} from "~/transporter/abstractions/ISocketsTransporter";

export class MockSocketsTransporter implements ISocketsTransporter {
    public messages = new Map<string, ISocketsTransporterSendData>();

    public async send<T extends ISocketsTransporterSendData = ISocketsTransporterSendData>(
        connections: ISocketsTransporterSendConnection[],
        data: T
    ): Promise<void> {
        for (const connection of connections) {
            this.messages.set(connection.connectionId, data);
        }
    }
}
