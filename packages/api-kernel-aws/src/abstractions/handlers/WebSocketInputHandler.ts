import { createAbstraction } from "@webiny/feature/api";
import type { APIGatewayProxyResult } from "@webiny/aws-sdk/types/index.js";
import type { InputHandler } from "@webiny/api-kernel-core";
import type { IWebSocketEvent } from "~/inputTypes/WebSocketInputType.js";

export interface IWebSocketInputHandler extends InputHandler.Interface<
    IWebSocketEvent,
    APIGatewayProxyResult
> {}

export const WebSocketInputHandler =
    createAbstraction<IWebSocketInputHandler>("WebSocketInputHandler");

export namespace WebSocketInputHandler {
    export type Interface = IWebSocketInputHandler;
}
