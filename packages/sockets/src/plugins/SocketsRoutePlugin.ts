import { Plugin } from "@webiny/plugins";
import { ISocketsEvent, ISocketsEventData, SocketsEventRoute } from "~/handler/types";
import { Context } from "~/types";
import { ISocketsRunnerResponse } from "~/runner";
import { ISocketsConnectionRegistry } from "~/registry";
import { ISocketsResponse } from "~/response/abstractions/ISocketsResponse";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface ISocketsRoutePluginCallableParams<
    C extends Context = Context,
    R extends ISocketsRunnerResponse = ISocketsRunnerResponse,
    T extends ISocketsEventData = ISocketsEventData
> {
    event: ISocketsEvent<T>;
    registry: ISocketsConnectionRegistry;
    context: C;
    response: ISocketsResponse;
    getTenant: () => string | null;
    getLocale: () => string | null;
    getIdentity: () => SecurityIdentity | null;
    next: () => Promise<R>;
}

export interface ISocketsRoutePluginCallable<
    C extends Context = Context,
    R extends ISocketsRunnerResponse = ISocketsRunnerResponse,
    T extends ISocketsEventData = ISocketsEventData
> {
    (params: ISocketsRoutePluginCallableParams<C, R, T>): Promise<R>;
}

export class SocketsRoutePlugin<
    C extends Context = Context,
    R extends ISocketsRunnerResponse = ISocketsRunnerResponse,
    T extends ISocketsEventData = ISocketsEventData
> extends Plugin {
    public static override readonly type: string = "sockets.route";

    public readonly route: SocketsEventRoute | string;
    private readonly cb: ISocketsRoutePluginCallable<C, R, T>;

    public constructor(
        route: SocketsEventRoute | string,
        cb: ISocketsRoutePluginCallable<C, R, T>
    ) {
        super();
        this.route = route;
        this.cb = cb;
    }

    public async run(params: ISocketsRoutePluginCallableParams<C, R, T>): Promise<R> {
        return this.cb(params);
    }
}

export const createSocketsRoutePlugin = <
    C extends Context = Context,
    R extends ISocketsRunnerResponse = ISocketsRunnerResponse,
    T extends ISocketsEventData = ISocketsEventData
>(
    route: SocketsEventRoute | string,
    cb: ISocketsRoutePluginCallable<C, R, T>
) => {
    return new SocketsRoutePlugin<C, R, T>(route, cb);
};
