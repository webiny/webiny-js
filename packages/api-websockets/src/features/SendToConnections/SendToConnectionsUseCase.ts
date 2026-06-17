import { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import { WebsocketsTransport } from "~/transport/index.js";
import { WebsocketsSendToConnectionsUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketServiceError } from "~/features/shared/errors.js";

class SendToConnectionsUseCaseImpl implements WebsocketsSendToConnectionsUseCase.Interface {
    public constructor(private readonly transport: WebsocketsTransport.Interface) {}

    public async execute<T extends GenericRecord = GenericRecord>(
        connections: WebsocketsSendToConnectionsUseCase.Connection[],
        data: WebsocketsSendToConnectionsUseCase.Data<T>
    ): Promise<Result<void, WebsocketsError>> {
        try {
            await this.transport.send<T>(connections, data);
        } catch (error) {
            return Result.fail(new WebsocketServiceError(error as Error));
        }

        return Result.ok();
    }
}

export const SendToConnectionsUseCase = WebsocketsSendToConnectionsUseCase.createImplementation({
    implementation: SendToConnectionsUseCaseImpl,
    dependencies: [WebsocketsTransport]
});
