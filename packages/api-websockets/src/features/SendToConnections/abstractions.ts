import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IWebsocketsTransportSendConnection } from "~/transport/index.js";
import type { IWebsocketsTransportSendData } from "~/transport/index.js";
import type { WebsocketsError } from "~/features/shared/errors.js";

export interface ISendToConnectionsUseCase {
    execute<T extends GenericRecord = GenericRecord>(
        connections: IWebsocketsTransportSendConnection[],
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketsError>>;
}

export const WebsocketsSendToConnectionsUseCase = createAbstraction<ISendToConnectionsUseCase>(
    "Websockets/SendToConnections"
);

export namespace WebsocketsSendToConnectionsUseCase {
    export type Interface = ISendToConnectionsUseCase;
}
