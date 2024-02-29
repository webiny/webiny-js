import {
    IWebsocketsTransporter,
    IWebsocketsTransporterSendConnection,
    IWebsocketsTransporterSendData
} from "~/transporter/abstractions/IWebsocketsTransporter";

export class MockWebsocketsTransporter implements IWebsocketsTransporter {
    public messages = new Map<string, IWebsocketsTransporterSendData>();

    public async send<T extends IWebsocketsTransporterSendData = IWebsocketsTransporterSendData>(
        connections: IWebsocketsTransporterSendConnection[],
        data: T
    ): Promise<void> {
        for (const connection of connections) {
            this.messages.set(connection.connectionId, data);
        }
    }
}
