import { InputType } from "@webiny/kernel-core";
import type { IInputType } from "@webiny/kernel-core";
import { WebSocketInputHandler } from "~/abstractions/handlers/WebSocketInputHandler.js";

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

class WebSocketInputTypeImpl implements IInputType<IWebSocketEvent> {
    matches(input: any): input is IWebSocketEvent {
        return !!(
            input?.requestContext?.routeKey &&
            input?.requestContext?.connectionId &&
            input?.requestContext?.eventType
        );
    }

    getHandlerAbstraction() {
        return WebSocketInputHandler;
    }
}

export const WebSocketInputType = InputType.createImplementation({
    implementation: WebSocketInputTypeImpl,
    dependencies: []
});
