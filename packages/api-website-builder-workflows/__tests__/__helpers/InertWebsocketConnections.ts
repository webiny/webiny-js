import { Result } from "@webiny/feature/api";
import {
    WebsocketsListConnectionsUseCase,
    type WebsocketsError
} from "@webiny/api-websockets/exports/api.js";

/** Lists no connection: nobody is online in these tests (Task 12). */
export class InertWebsocketConnections implements WebsocketsListConnectionsUseCase.Interface {
    public async execute(): Promise<
        Result<WebsocketsListConnectionsUseCase.RegistryData[], WebsocketsError>
    > {
        return Result.ok([]);
    }
}
