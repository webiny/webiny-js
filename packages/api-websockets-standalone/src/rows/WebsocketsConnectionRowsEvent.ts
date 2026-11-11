import { createAbstraction } from "@webiny/feature/api";
import { EventType } from "@webiny/event-handler-core";
import type { IEventHandler, IEventType } from "@webiny/event-handler-core";
import type { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js";

export const WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER = "WebinyWebsocketsConnectionRows";

/** What to do with the connection registry's rows. */
export type WebsocketsConnectionRowsChange =
    | { action: "register"; connection: ConnectionRegistry.RegisterParams }
    | { action: "unregister"; connectionId: string }
    | { action: "updateLastSeen"; connectionId: string }
    /**
     * Removes the rows of every connection not seen since `olderThan` (an ISO date), in one
     * request, and answers their ids.
     */
    | { action: "removeStale"; olderThan: string };

/**
 * A change to the websocket connections' rows, from outside any request: a socket that connects,
 * sends or closes, and the sweep of stale connections. The rows are a storage, which lives in a
 * request's container, so the server's websocket code dispatches this and it runs in a fresh one.
 */
export type IWebsocketsConnectionRowsEvent = {
    [WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER]: true;
} & WebsocketsConnectionRowsChange;

export interface IWebsocketsConnectionRowsEventHandler extends IEventHandler<
    IWebsocketsConnectionRowsEvent,
    string[] | null
> {}

export const WebsocketsConnectionRowsEventHandler =
    createAbstraction<IWebsocketsConnectionRowsEventHandler>(
        "Websockets/ConnectionRowsEventHandler"
    );

export namespace WebsocketsConnectionRowsEventHandler {
    export type Interface = IWebsocketsConnectionRowsEventHandler;
}

class WebsocketsConnectionRowsEventTypeImpl implements IEventType<IWebsocketsConnectionRowsEvent> {
    canHandle(event: any): event is IWebsocketsConnectionRowsEvent {
        return event?.[WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER] === true;
    }

    getHandlerAbstraction() {
        return WebsocketsConnectionRowsEventHandler;
    }
}

export const WebsocketsConnectionRowsEventType = EventType.createImplementation({
    implementation: WebsocketsConnectionRowsEventTypeImpl,
    dependencies: []
});
