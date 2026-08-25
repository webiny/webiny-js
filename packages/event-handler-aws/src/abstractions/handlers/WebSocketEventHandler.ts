import { createAbstraction } from "@webiny/feature/api";
import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import type { IEventHandler } from "@webiny/event-handler-core";
import type { IWebSocketEvent } from "~/eventTypes/WebSocketEventType.js";

export interface IWebSocketEventHandler extends IEventHandler<
    IWebSocketEvent,
    APIGatewayProxyResult
> {}

export const WebSocketEventHandler =
    createAbstraction<IWebSocketEventHandler>("WebSocketEventHandler");

export namespace WebSocketEventHandler {
    export type Interface = IWebSocketEventHandler;
}
