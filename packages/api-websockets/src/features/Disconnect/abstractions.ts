import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import { WebsocketsListConnectionsUseCase } from "~/features/ListConnections/abstractions.js";

export type IWebsocketsDisconnectParams = WebsocketsListConnectionsUseCase.Params;

export interface IDisconnectUseCase {
    execute(
        params?: IWebsocketsDisconnectParams,
        notify?: boolean
    ): Promise<Result<ConnectionRegistry.Data[], WebsocketsError>>;
}

export const WebsocketsDisconnectUseCase =
    createAbstraction<IDisconnectUseCase>("Websockets/Disconnect");

export namespace WebsocketsDisconnectUseCase {
    export type Interface = IDisconnectUseCase;
    export type Params = IWebsocketsDisconnectParams;
}
