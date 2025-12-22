import type {
    IWebsocketsConnectionRegistry,
    IWebsocketsConnectionRegistryData
} from "~/registry/index.js";
import type {
    IWebsocketsTransportSendConnection,
    IWebsocketsTransportSendData
} from "~/transport/index.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

export type IWebsocketsIdentity = Pick<SecurityIdentity, "id" | "displayName" | "type">;

export interface IWebsocketsContextListConnectionsParamsWhere {
    identityId?: string;
    tenant?: string;
    connections?: string[];
}

export interface IWebsocketsContextListConnectionsParams {
    where?: IWebsocketsContextListConnectionsParamsWhere;
}

export type IWebsocketsContextDisconnectConnectionsParams = IWebsocketsContextListConnectionsParams;

export interface IWebsocketsContextObject {
    readonly registry: IWebsocketsConnectionRegistry;

    send<T extends GenericRecord = GenericRecord>(
        identity: Pick<IWebsocketsIdentity, "id">,
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
