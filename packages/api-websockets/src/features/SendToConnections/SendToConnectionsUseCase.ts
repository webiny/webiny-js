import { Result } from "@webiny/feature/api";
import { createImplementation } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IWebsocketsTransport } from "~/transport/index.js";
import type { IWebsocketsTransportSendConnection } from "~/transport/index.js";
import type { IWebsocketsTransportSendData } from "~/transport/index.js";
import type { ISendToConnectionsUseCase } from "./abstractions.js";
import { WebsocketsSendToConnectionsUseCase } from "./abstractions.js";
import type { WebsocketsError } from "~/features/shared/errors.js";
import { WebsocketServiceError } from "~/features/shared/errors.js";
import { WebsocketsTransport } from "~/transport/index.js";

class SendToConnectionsUseCaseImpl implements ISendToConnectionsUseCase {
    private readonly transport: IWebsocketsTransport;

    public constructor(transport: IWebsocketsTransport) {
        this.transport = transport;
    }

    public async execute<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketsError>> {
        try {
            await this.transport.send<T>(connections, data);
        } catch (error) {
            return Result.fail(new WebsocketServiceError(error as Error));
        }

        return Result.ok();
    }
}

export const SendToConnectionsUseCase = createImplementation({
    abstraction: WebsocketsSendToConnectionsUseCase,
    implementation: SendToConnectionsUseCaseImpl,
    dependencies: [WebsocketsTransport]
});
