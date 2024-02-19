import { Plugin } from "@webiny/plugins";
import { ISocketsEvent, SocketsEventRoute } from "~/handler/types";
import { Context } from "~/types";
import { ISocketsRunnerResponse } from "~/runner";
import { ISocketsConnectionRegistry } from "~/registry";

export interface ISocketsRoutePluginCallableParams<
    C extends Context = Context,
    R extends ISocketsRunnerResponse = ISocketsRunnerResponse
> {
    event: ISocketsEvent;
    registry: ISocketsConnectionRegistry;
    context: C;
    next: () => Promise<R>;
}

export interface ISocketsRoutePluginCallable<
    C extends Context = Context,
    R extends ISocketsRunnerResponse = ISocketsRunnerResponse
> {
    (params: ISocketsRoutePluginCallableParams<C>): Promise<R>;
}

export class SocketsRoutePlugin<
    C extends Context = Context,
    R extends ISocketsRunnerResponse = ISocketsRunnerResponse
> extends Plugin {
    public static override readonly type: string = "sockets.route.action";

    public readonly route: SocketsEventRoute | string;
    private readonly cb: ISocketsRoutePluginCallable<C, R>;

    public constructor(route: SocketsEventRoute | string, cb: ISocketsRoutePluginCallable<C, R>) {
        super();
        this.route = route;
        this.cb = cb;
    }

    public async run(params: ISocketsRoutePluginCallableParams<C>): Promise<R> {
        return this.cb(params);
    }
}

export const createSocketsRoutePlugin = <
    C extends Context = Context,
    R extends ISocketsRunnerResponse = ISocketsRunnerResponse
>(
    route: SocketsEventRoute | string,
    cb: ISocketsRoutePluginCallable<C, R>
) => {
    return new SocketsRoutePlugin<C, R>(route, cb);
};
