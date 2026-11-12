import type { GenericRecord } from "@webiny/api/types.js";
import { createAbstraction } from "@webiny/feature/api";
import type {
    IWebsocketsTransportSendData,
    IWebsocketsTransportSendDataError
} from "@webiny/api-core/features/websockets/index.js";

export type { IWebsocketsTransportSendData, IWebsocketsTransportSendDataError };

export interface IWebsocketsTransportSendConnection {
    connectionId: string;
    endpoint: string;
}

export interface IWebsocketsTransportDisconnectConnection {
    connectionId: string;
    endpoint: string;
}

export interface IWebsocketsTransport {
    send<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<void>;

    disconnect(connections: IWebsocketsTransportDisconnectConnection[]): Promise<void>;
}

export const WebsocketsTransport = createAbstraction<IWebsocketsTransport>("WebsocketsTransport");

export namespace WebsocketsTransport {
    export type Interface = IWebsocketsTransport;
    export type SendConnection = IWebsocketsTransportSendConnection;
    export type SendData<T extends GenericRecord> = IWebsocketsTransportSendData<T>;
    export type DisconnectConnection = IWebsocketsTransportDisconnectConnection;
}
