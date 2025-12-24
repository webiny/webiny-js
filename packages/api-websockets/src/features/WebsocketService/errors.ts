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

export class WebsocketForceDisconnectNotificationError extends BaseError<{ error: Error }> {
    override readonly code = "Websocket/Service/ForceDisconnectNotification" as const;

    constructor(error: Error) {
        super({
            message: "Failed to notify the clients about the forced disconnect.",
            data: { error }
        });
    }
}

export class WebsocketForceDisconnectError extends BaseError<{ error: Error }> {
    override readonly code = "Websocket/Service/ForceDisconnect" as const;

    constructor(error: Error) {
        super({
            message: "Failed to forcefully disconnect the Websocket clients.",
            data: { error }
        });
    }
}
