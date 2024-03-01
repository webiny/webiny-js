import { IWebsocketsConnectionRegistry, IWebsocketsConnectionRegistryData } from "~/registry";
import { IWebsocketsTransportSendConnection, IWebsocketsTransportSendData } from "~/transport";
import { SecurityIdentity } from "@webiny/api-security/types";
import { GenericRecord } from "@webiny/api/types";

export type IWebsocketsContextListConnectionsResponse = Promise<
    IWebsocketsConnectionRegistryData[]
>;

export type IWebsocketsIdentity = Pick<SecurityIdentity, "id" | "displayName" | "type">;

export interface IWebsocketsContextListConnectionsParamsWhere {
    identityId?: string;
    tenant?: string;
    locale?: string;
}

export interface IWebsocketsContextListConnectionsParams {
    where?: IWebsocketsContextListConnectionsParamsWhere;
}

export interface IWebsocketsContextDisconnectParamsWhere {
    connectionId?: string;
    identityId?: string;
    tenant?: string;
    locale?: string;
}

export interface IWebsocketsContextDisconnectParams {
    where?: IWebsocketsContextDisconnectParamsWhere;
}

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
    ): IWebsocketsContextListConnectionsResponse;
    disconnect(params?: IWebsocketsContextDisconnectParams, notify?: boolean): Promise<boolean>;
}
