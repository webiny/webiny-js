import { Result } from "@webiny/feature/api";
import { WebsocketsSendToConnectionsUseCase } from "@webiny/api-websockets/exports/api.js";
import type { WebsocketsError } from "@webiny/api-websockets/features/shared/errors.js";

/** Sends no frame (Task 12). */
export class InertWebsocketsSend implements WebsocketsSendToConnectionsUseCase.Interface {
    public async execute(): Promise<Result<void, WebsocketsError>> {
        return Result.ok();
    }
}
