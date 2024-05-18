import { Plugin } from "@webiny/plugins";
import { IWebsocketsEvent, IWebsocketsEventData, WebsocketsEventRoute } from "~/handler/types";
import { Context } from "~/types";
import { IWebsocketsRunnerResponse } from "~/runner";
import { IWebsocketsConnectionRegistry } from "~/registry";
import { IWebsocketsResponse } from "~/response/abstractions/IWebsocketsResponse";
import { IWebsocketsIdentity } from "~/context";

export interface IWebsocketsRoutePluginCallableParams<
    C extends Context = Context,
    R extends IWebsocketsRunnerResponse = IWebsocketsRunnerResponse,
    T extends IWebsocketsEventData = IWebsocketsEventData
> {
    event: IWebsocketsEvent<T>;
    registry: IWebsocketsConnectionRegistry;
    context: C;
    response: IWebsocketsResponse;
    getTenant: () => string | null;
    getLocale: () => string | null;
    getIdentity: () => IWebsocketsIdentity | null;
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

    public readonly route: WebsocketsEventRoute | string;
    private readonly cb: IWebsocketsRoutePluginCallable<C, R, T>;

    public constructor(
        route: WebsocketsEventRoute | string,
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
    route: WebsocketsEventRoute | string,
    cb: IWebsocketsRoutePluginCallable<C, R, T>
) => {
    return new WebsocketsRoutePlugin<C, R, T>(route, cb);
};
