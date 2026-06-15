import { Abstraction } from "@webiny/di";
import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import type { IEventHandler } from "@webiny/event-handler-core";
import type { IWebSocketEvent } from "~/eventTypes/WebSocketEventType.js";

export interface IWebSocketEventHandler extends IEventHandler<
    IWebSocketEvent,
    APIGatewayProxyResult
> {}

export const WebSocketEventHandler = new Abstraction<IWebSocketEventHandler>(
    "WebSocketEventHandler"
);

export namespace WebSocketEventHandler {
    export type Interface = IWebSocketEventHandler;
}
