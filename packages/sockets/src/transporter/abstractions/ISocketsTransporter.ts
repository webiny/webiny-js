import { ISocketsConnectionRegistryData } from "~/registry";

export interface ISocketsTransporterSendData {
    [key: string]: any;
}

export interface ISocketsTransporter {
    send<T extends ISocketsTransporterSendData = ISocketsTransporterSendData>(
        connections: Pick<
            ISocketsConnectionRegistryData,
            "connectionId" | "domainName" | "stage"
        >[],
        data: T
    ): Promise<void>;
}
