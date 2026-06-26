import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { WebsocketEventHandler } from "./abstractions.js";
import type { IncomingGenericData } from "~/types.js";

/**
 * Published for every incoming websocket message. Carries the raw message data
 * (which always includes an `action`), and routes to `WebsocketEventHandler` handlers.
 */
export class WebsocketEvent extends BaseEvent<IncomingGenericData> {
    readonly eventType = "Websockets/MessageReceived" as const;

    getHandlerAbstraction() {
        return WebsocketEventHandler;
    }
}
