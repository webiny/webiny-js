import { BaseError } from "@webiny/feature/api";

/** The error a failed websocket Result carries (`WebsocketServiceError` has the same code). */
export class FakeWebsocketFailure extends BaseError {
    override readonly code = "Websocket/Service" as const;

    public constructor(message: string) {
        super({ message });
    }
}
