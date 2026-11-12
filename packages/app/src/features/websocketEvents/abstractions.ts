import { createAbstraction } from "@webiny/feature/admin";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { WebsocketEvent } from "./WebsocketEvent.js";

/**
 * Handlers registered against this abstraction receive EVERY incoming websocket message
 * (published as a `WebsocketEvent` by the websockets→EventPublisher bridge in @webiny/app-websockets).
 * Each handler is responsible for filtering by `event.payload.action` and reacting to the ones it
 * cares about, instead of subscribing to the websocket service directly.
 *
 * Lives here, next to `EventPublisher`, rather than in @webiny/app-websockets, so packages that
 * app-websockets depends on (such as @webiny/app-admin) can handle messages too.
 */
export const WebsocketEventHandler = createAbstraction<IEventHandler<WebsocketEvent>>(
    "App/WebsocketEventHandler"
);

export namespace WebsocketEventHandler {
    export type Interface = IEventHandler<WebsocketEvent>;
    export type Event = WebsocketEvent;
}
