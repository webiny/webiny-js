import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";

export interface IWebsocketsListConnectionsParamsWhere {
    identityId?: string;
    tenant?: string;
    connections?: string[];
}

export interface IWebsocketsListConnectionsParams {
    where?: IWebsocketsListConnectionsParamsWhere;
}

export interface IListConnectionsUseCase {
    execute(
        params?: IWebsocketsListConnectionsParams
    ): Promise<Result<ConnectionRegistry.Data[], WebsocketsError>>;
}

export const WebsocketsListConnectionsUseCase = createAbstraction<IListConnectionsUseCase>(
    "Websockets/ListConnections"
);

export namespace WebsocketsListConnectionsUseCase {
    export type Interface = IListConnectionsUseCase;
    export type Params = IWebsocketsListConnectionsParams;
    export type ParamsWhere = IWebsocketsListConnectionsParamsWhere;
    export type RegistryData = ConnectionRegistry.Data;
}
