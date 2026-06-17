import type { GenericRecord } from "@webiny/api/types";
import { WebsocketsTransport } from "~/transport/abstractions/WebsocketsTransport";

export class MockWebsocketsTransport implements WebsocketsTransport.Interface {
    public messages = new Map<string, WebsocketsTransport.SendData<any>>();

    public async send<T extends GenericRecord = GenericRecord>(
        connections: WebsocketsTransport.SendConnection[],
        data: WebsocketsTransport.SendData<T>
    ): Promise<void> {
        for (const connection of connections) {
            this.messages.set(connection.connectionId, data);
        }
    }

    public async disconnect(): Promise<void> {
        return;
    }
}
