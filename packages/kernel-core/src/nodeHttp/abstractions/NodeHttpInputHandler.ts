import type { IncomingMessage } from "node:http";
import { Abstraction } from "@webiny/di";
import type { IInputHandler, IHttpResponse } from "~/index.js";

/**
 * Handler abstraction for Node HTTP server events (an `IncomingMessage`). Mirrors AWS's
 * `ApiGatewayInputHandler`: the terminal (`NodeHttpRouterHandler`) is registered as this abstraction,
 * and transport decorators (auth/tenant loaders) wrap it — so they see the raw IncomingMessage.
 */
export interface INodeHttpInputHandler extends IInputHandler<IncomingMessage, IHttpResponse> {}

export const NodeHttpInputHandler = new Abstraction<INodeHttpInputHandler>("NodeHttpInputHandler");

export namespace NodeHttpInputHandler {
    export type Interface = INodeHttpInputHandler;
}
