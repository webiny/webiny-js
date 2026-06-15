import { EventType } from "@webiny/event-handler-core";
import type { IEventType } from "@webiny/event-handler-core";
import { WebSocketEventHandler } from "~/abstractions/handlers/WebSocketEventHandler.js";

export interface IWebSocketEvent {
    requestContext: {
        routeKey: string;
        connectionId: string;
        eventType: string;
        connectedAt?: number;
        domainName?: string;
        stage?: string;
        [key: string]: unknown;
    };
    headers?: Record<string, string>;
    queryStringParameters?: Record<string, string>;
    body?: string | Record<string, unknown>;
}

class WebSocketEventTypeImpl implements IEventType<IWebSocketEvent> {
    canHandle(event: any): event is IWebSocketEvent {
        return !!(
            event?.requestContext?.routeKey &&
            event?.requestContext?.connectionId &&
            event?.requestContext?.eventType
        );
    }

    getHandlerAbstraction() {
        return WebSocketEventHandler;
    }
}

export const WebSocketEventType = EventType.createImplementation({
    implementation: WebSocketEventTypeImpl,
    dependencies: []
});
