import { Plugin } from "@webiny/plugins";
import type { Context } from "~/types.js";
import type { IWebsocketsRunnerResponse } from "~/runner/index.js";
import { ConnectionRegistry } from "~/features/ConnectionRegistry/abstractions.js";
import { WebsocketsResponse } from "~/response/index.js";
import type { IWebsocketsEvent, IWebsocketsEventData, WebsocketsRoute } from "~/types.js";

export interface IWebsocketsRoutePluginCallableParams<
    C extends Context = Context,
    R extends IWebsocketsRunnerResponse = IWebsocketsRunnerResponse,
    T extends IWebsocketsEventData = IWebsocketsEventData
> {
    event: IWebsocketsEvent<T>;
    registry: ConnectionRegistry.Interface;
    context: C;
    response: WebsocketsResponse.Interface;
    getTenant: () => string | null;
    getIdentity: () => ConnectionRegistry.Identity | null;
    next: () => Promise<R>;
}

export interface IWebsocketsRoutePluginCallable<
    C extends Context = Context,
    R extends IWebsocketsRunnerResponse = IWebsocketsRunnerResponse,
    T extends IWebsocketsEventData = IWebsocketsEventData
> {
    (params: IWebsocketsRoutePluginCallableParams<C, R, T>): Promise<R>;
}

export class WebsocketsRoutePlugin<
    C extends Context = Context,
    R extends IWebsocketsRunnerResponse = IWebsocketsRunnerResponse,
    T extends IWebsocketsEventData = IWebsocketsEventData
> extends Plugin {
    public static override readonly type: string = "websockets.route";

    public readonly route: WebsocketsRoute | string;
    private readonly cb: IWebsocketsRoutePluginCallable<C, R, T>;

    public constructor(
        route: WebsocketsRoute | string,
        cb: IWebsocketsRoutePluginCallable<C, R, T>
    ) {
        super();
        this.route = route;
        this.cb = cb;
    }

    public async run(params: IWebsocketsRoutePluginCallableParams<C, R, T>): Promise<R> {
        return this.cb(params);
    }
}

export const createWebsocketsRoutePlugin = <
    C extends Context = Context,
    R extends IWebsocketsRunnerResponse = IWebsocketsRunnerResponse,
    T extends IWebsocketsEventData = IWebsocketsEventData
>(
    route: WebsocketsRoute | string,
    cb: IWebsocketsRoutePluginCallable<C, R, T>
) => {
    return new WebsocketsRoutePlugin<C, R, T>(route, cb);
};
