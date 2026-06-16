import type { GenericRecord } from "@webiny/api/types.js";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";

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

export type IWebsocketsTransportSendConnection = Pick<
    IWebsocketsConnectionRegistryData,
    "connectionId" | "endpoint"
>;

export type IWebsocketsTransportDisconnectConnection = Pick<
    IWebsocketsConnectionRegistryData,
    "connectionId" | "endpoint"
>;

export interface IWebsocketsTransport {
    send<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<void>;

    disconnect(connections: IWebsocketsTransportDisconnectConnection[]): Promise<void>;
}
