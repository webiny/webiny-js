import { createAbstraction } from "@webiny/feature/api";
import type { Result } from "@webiny/feature/api";
import type { GenericRecord } from "@webiny/api/types.js";
import type { IWebsocketsIdentity } from "~/types.js";
import type { IWebsocketsTransportSendData } from "~/transport/index.js";
import type { WebsocketsError } from "~/features/shared/errors.js";

export interface ISendToIdentityUseCase {
    execute<T extends GenericRecord = GenericRecord>(
        identity: Pick<IWebsocketsIdentity, "id">,
        data: IWebsocketsTransportSendData<T>
    ): Promise<Result<void, WebsocketsError>>;
}

export const WebsocketsSendToIdentityUseCase = createAbstraction<ISendToIdentityUseCase>(
    "Websockets/SendToIdentity"
);

export namespace WebsocketsSendToIdentityUseCase {
    export type Interface = ISendToIdentityUseCase;
}
