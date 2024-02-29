import { IWebsocketsConnectionRegistry, IWebsocketsConnectionRegistryData } from "~/registry";
import {
    IWebsocketsTransporterSendConnection,
    IWebsocketsTransporterSendData
} from "~/transporter";
import { SecurityIdentity } from "@webiny/api-security/types";

export type IWebsocketsContextListConnectionsResponse = Promise<
    IWebsocketsConnectionRegistryData[]
>;

export type IWebsocketsIdentity = Pick<SecurityIdentity, "id" | "displayName" | "type">;

export interface IWebsocketsContextListConnectionsParams {
    where?: {
        identityId?: string;
        tenant?: string;
        locale?: string;
    };
}

export interface IWebsocketsContextDisconnectParams {
    connectionId?: string;
    identityId?: string;
    tenant?: string;
    locale?: string;
}

export interface IWebsocketsContext {
    readonly registry: IWebsocketsConnectionRegistry;

    send<T extends IWebsocketsTransporterSendData = IWebsocketsTransporterSendData>(
        identity: IWebsocketsIdentity,
        data: T
    ): Promise<void>;
    sendToConnection<T extends IWebsocketsTransporterSendData = IWebsocketsTransporterSendData>(
        connection: IWebsocketsTransporterSendConnection,
        data: T
    ): Promise<void>;
    listConnections(
        params?: IWebsocketsContextListConnectionsParams
    ): IWebsocketsContextListConnectionsResponse;
    disconnect(params?: IWebsocketsContextDisconnectParams): Promise<boolean>;
}
