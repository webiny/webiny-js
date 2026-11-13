import { BaseError } from "@webiny/feature/api";

export class WebsocketServiceError extends BaseError<{ error: Error }> {
    override readonly code = "Websocket/Service" as const;

    constructor(error: Error) {
        super({
            message: "WebsocketService encountered an error.",
            data: { error }
        });
    }
}
