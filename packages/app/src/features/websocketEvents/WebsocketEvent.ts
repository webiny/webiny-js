import { BaseEvent } from "~/features/eventPublisher/index.js";
import type { GenericRecord } from "~/types.js";
import { WebsocketEventHandler } from "./abstractions.js";

export interface WebsocketMessageData extends GenericRecord {
    action: string;
}

/**
 * Published for every incoming websocket message. Carries the raw message data
 * (which always includes an `action`), and routes to `WebsocketEventHandler` handlers.
 */
export class WebsocketEvent extends BaseEvent<WebsocketMessageData> {
    readonly eventType = "Websockets/MessageReceived" as const;

    getHandlerAbstraction() {
        return WebsocketEventHandler;
    }
}
