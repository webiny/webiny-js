import { EventType } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";
import {
    WEBSOCKETS_CONNECTION_ROWS_EVENT_IDENTIFIER,
    WebsocketsConnectionRowsEventHandler,
    type IWebsocketsConnectionRowsEvent
} from "./abstractions.js";

/** Recognizes the connection-rows event and routes it to `WebsocketsConnectionRowsEventHandler`. */
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
