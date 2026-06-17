import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { IWebsocketsConnectionRegistryData } from "~/registry/index.js";
import type { IWebsocketsListConnectionsParams } from "~/features/ListConnections/abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";

export type IWebsocketsDisconnectParams = IWebsocketsListConnectionsParams;

export interface IDisconnectUseCase {
    execute(
        params?: IWebsocketsDisconnectParams,
        notify?: boolean
    ): Promise<Result<IWebsocketsConnectionRegistryData[], WebsocketsError>>;
}

export const WebsocketsDisconnectUseCase =
    createAbstraction<IDisconnectUseCase>("Websockets/Disconnect");

export namespace WebsocketsDisconnectUseCase {
    export type Interface = IDisconnectUseCase;
    export type Params = IWebsocketsDisconnectParams;
}
