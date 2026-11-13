import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IWebsocketsIdentity } from "../types.js";
import type { IWebsocketsTransportSendData } from "../types.js";
import type { WebsocketServiceError } from "../WebsocketServiceError.js";

export interface ISendToIdentityUseCase {
    execute<T extends GenericRecord = GenericRecord>(
        identity: Pick<IWebsocketsIdentity, "id">,
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketServiceError>>;
}

/**
 * Sends a message to every open websocket connection of an identity. Declared here so that any
 * package can send without depending on a websockets package; `@webiny/api-websockets` implements it.
 * Without that package the send does nothing, see `NullSendToIdentityUseCase`.
 */
export const WebsocketsSendToIdentityUseCase = createAbstraction<ISendToIdentityUseCase>(
    "Websockets/SendToIdentity"
);

export namespace WebsocketsSendToIdentityUseCase {
    export type Interface = ISendToIdentityUseCase;
    export type Identity = Pick<IWebsocketsIdentity, "id">;
    export type Data<T extends GenericRecord> = IWebsocketsTransportSendData<T>;
}
