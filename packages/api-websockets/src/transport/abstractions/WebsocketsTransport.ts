import type { GenericRecord } from "@webiny/api/types.js";
import { createAbstraction } from "@webiny/feature/api";

export interface IWebsocketsTransportSendDataError {
    message: string;
    code: string;
    data?: GenericRecord;
    stack?: string;
}

export interface IWebsocketsTransportSendData<T extends GenericRecord> {
    messageId?: string;
    action?: string;
    data?: T;
    error?: IWebsocketsTransportSendDataError;
}

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
