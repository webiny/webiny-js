import { createAbstraction } from "@webiny/feature/admin";
import type { IEventHandler } from "@webiny/app/features/eventPublisher/index.js";
import type { WebsocketEvent } from "./WebsocketEvent.js";

/**
 * Handlers registered against this abstraction receive EVERY incoming websocket message
 * (published as a `WebsocketEvent` by the websockets→EventPublisher bridge). Each handler
 * is responsible for filtering by `event.payload.action` and reacting to the ones it cares
 * about, instead of subscribing to the websocket service directly.
 */
export const WebsocketEventHandler = createAbstraction<IEventHandler<WebsocketEvent>>(
    "App/WebsocketEventHandler"
);

export namespace WebsocketEventHandler {
    export type Interface = IEventHandler<WebsocketEvent>;
    export type Event = WebsocketEvent;
}
