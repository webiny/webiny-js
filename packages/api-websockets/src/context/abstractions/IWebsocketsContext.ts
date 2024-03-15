import { IWebsocketsConnectionRegistry, IWebsocketsConnectionRegistryData } from "~/registry";
import { IWebsocketsTransportSendConnection, IWebsocketsTransportSendData } from "~/transport";
import { SecurityIdentity } from "@webiny/api-security/types";
import { GenericRecord } from "@webiny/api/types";

export type IWebsocketsIdentity = Pick<SecurityIdentity, "id" | "displayName" | "type">;

export interface IWebsocketsContextListConnectionsParamsWhere {
    identityId?: string;
    tenant?: string;
    locale?: string;
    connections?: string[];
}

export interface IWebsocketsContextListConnectionsParams {
    where?: IWebsocketsContextListConnectionsParamsWhere;
}

export type IWebsocketsContextDisconnectConnectionsParams = IWebsocketsContextListConnectionsParams;

export interface IWebsocketsContext {
    readonly registry: IWebsocketsConnectionRegistry;

    send<T extends GenericRecord = GenericRecord>(
        identity: IWebsocketsIdentity,
        data: IWebsocketsTransportSendData<T>
    ): Promise<void>;
    sendToConnections<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<void>;
    listConnections(
        params?: IWebsocketsContextListConnectionsParams
    ): Promise<IWebsocketsConnectionRegistryData[]>;
    disconnect(
        params?: IWebsocketsContextDisconnectConnectionsParams,
        notify?: boolean
    ): Promise<IWebsocketsConnectionRegistryData[]>;
}
