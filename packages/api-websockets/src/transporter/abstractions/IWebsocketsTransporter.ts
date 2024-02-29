import { GenericRecord } from "@webiny/api/types";
import { IWebsocketsConnectionRegistryData } from "~/registry";

export type IWebsocketsTransporterSendData = GenericRecord<string>;

export type IWebsocketsTransporterSendConnection = Pick<
    IWebsocketsConnectionRegistryData,
    "connectionId" | "domainName" | "stage"
>;

export interface IWebsocketsTransporter {
    send<T extends IWebsocketsTransporterSendData = IWebsocketsTransporterSendData>(
        connections: IWebsocketsTransporterSendConnection[],
        data: T
    ): Promise<void>;
}
