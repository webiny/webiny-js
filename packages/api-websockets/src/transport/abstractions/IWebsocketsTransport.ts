import { GenericRecord } from "@webiny/api/types";
import { IWebsocketsConnectionRegistryData } from "~/registry";

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
    "connectionId" | "domainName" | "stage"
>;

export interface IWebsocketsTransport {
    send<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<void>;
}
