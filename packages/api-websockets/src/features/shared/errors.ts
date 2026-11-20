import { BaseError } from "@webiny/feature/api";
import type { WebsocketServiceError } from "@webiny/api-core/features/websockets/index.js";

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

export type WebsocketsError =
    | WebsocketServiceError
    | WebsocketForceDisconnectNotificationError
    | WebsocketForceDisconnectError;
