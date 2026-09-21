import type { IncomingMessage } from "node:http";
import { Abstraction } from "@webiny/di";
import type { IEventHandler, IHttpResponse } from "@webiny/event-handler-core";

/**
 * Handler abstraction for Node HTTP server events (an `IncomingMessage`). Mirrors AWS's
 * `ApiGatewayEventHandler`: the terminal (`NodeHttpRouterHandler`) is registered as this abstraction,
 * and transport decorators (auth/tenant loaders) wrap it — so they see the raw IncomingMessage.
 */
export interface INodeHttpEventHandler extends IEventHandler<IncomingMessage, IHttpResponse> {}

export const NodeHttpEventHandler = new Abstraction<INodeHttpEventHandler>("NodeHttpEventHandler");

export namespace NodeHttpEventHandler {
    export type Interface = INodeHttpEventHandler;
}
