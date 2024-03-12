import {
    IWebsocketsTransport,
    IWebsocketsTransportSendConnection,
    IWebsocketsTransportSendData
} from "~/transport/abstractions/IWebsocketsTransport";
import { GenericRecord } from "@webiny/api/types";

export class MockWebsocketsTransport implements IWebsocketsTransport {
    public messages = new Map<string, IWebsocketsTransportSendData<any>>();

    public async send<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<void> {
        for (const connection of connections) {
            this.messages.set(connection.connectionId, data);
        }
    }

    public async disconnect(): Promise<void> {
        return;
    }
}
