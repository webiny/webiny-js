import { GenericRecord } from "@webiny/api/types";
import { ISocketsConnectionRegistryData } from "~/registry";

export type ISocketsTransporterSendData = GenericRecord<string>;

export type ISocketsTransporterSendConnection = Pick<
    ISocketsConnectionRegistryData,
    "connectionId" | "domainName" | "stage"
>;

export interface ISocketsTransporter {
    send<T extends ISocketsTransporterSendData = ISocketsTransporterSendData>(
        connections: ISocketsTransporterSendConnection[],
        data: T
    ): Promise<void>;
}
