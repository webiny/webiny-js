import { Result } from "@webiny/feature/api";
import { WebsocketsListConnectionsUseCase } from "@webiny/api-websockets/exports/api.js";
import type { WebsocketsError } from "@webiny/api-websockets/features/shared/errors.js";

/** Lists no connection: nobody is online in these tests (Task 12). */
export class InertWebsocketConnections implements WebsocketsListConnectionsUseCase.Interface {
    public async execute(): Promise<
        Result<WebsocketsListConnectionsUseCase.RegistryData[], WebsocketsError>
    > {
        return Result.ok([]);
    }
}
