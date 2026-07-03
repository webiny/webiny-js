import { createAbstraction } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import type { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import type { WebsocketsResponse } from "~/response/index.js";
import type { IWebsocketsRunnerResponse } from "~/runner/abstractions/WebsocketsRunner.js";
import type { IWebsocketsEvent, IWebsocketsEventData } from "~/types.js";

/**
 * Parameters passed to a route handler's `run` method. Route handlers for the same
 * `route` are chained middleware-style via `next`.
 */
export interface IWebsocketsRouteHandlerParams<
    R extends IWebsocketsRunnerResponse = IWebsocketsRunnerResponse,
    T extends IWebsocketsEventData = IWebsocketsEventData
> {
    event: IWebsocketsEvent<T>;
    registry: ConnectionRegistry.Interface;
    container: Container;
    response: WebsocketsResponse.Interface;
    getTenant: () => string | null;
    getIdentity: () => ConnectionRegistry.Identity | null;
    next: () => Promise<R>;
}

/**
 * A handler for a single WebSocket route (e.g. "connect", "disconnect", "default", or a
 * custom route key). Register built-in and custom routes as multiple implementations:
 *
 *   container.registerInstance(WebsocketsRouteHandler, {
 *       route: "myRoute",
 *       async run({ response }) { return response.ok(); }
 *   });
 *
 * The runner resolves all handlers via `resolveAll` and runs the ones matching the event route.
 */
export interface IWebsocketsRouteHandler<
    R extends IWebsocketsRunnerResponse = IWebsocketsRunnerResponse,
    T extends IWebsocketsEventData = IWebsocketsEventData
> {
    route: string;
    run(params: IWebsocketsRouteHandlerParams<R, T>): Promise<R>;
}

export const WebsocketsRouteHandler =
    createAbstraction<IWebsocketsRouteHandler>("WebsocketsRouteHandler");

export namespace WebsocketsRouteHandler {
    export type Interface = IWebsocketsRouteHandler;
    export type Params = IWebsocketsRouteHandlerParams;
}
