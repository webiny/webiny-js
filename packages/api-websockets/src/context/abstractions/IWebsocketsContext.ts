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
import { Result } from "@webiny/feature/api";
import { WebsocketService } from "~/features/WebsocketService/abstractions.js";

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
    ): Promise<Result<void, WebsocketService.Error>>;
    sendToConnections<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketService.Error>>;
    listConnections(
        params?: IWebsocketsContextListConnectionsParams
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketService.Error>>;
    disconnect(
        params?: IWebsocketsContextDisconnectConnectionsParams,
        notify?: boolean
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketService.Error>>;
}
