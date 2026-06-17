import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";
import type { WebsocketsError } from "~/features/shared/errors.js";

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
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketsError>>;
}

export const WebsocketsListConnectionsUseCase = createAbstraction<IListConnectionsUseCase>(
    "Websockets/ListConnections"
);

export namespace WebsocketsListConnectionsUseCase {
    export type Interface = IListConnectionsUseCase;
    export type Params = IWebsocketsListConnectionsParams;
    export type ParamsWhere = IWebsocketsListConnectionsParamsWhere;
}
