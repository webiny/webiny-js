import { Plugin } from "@webiny/plugins";
import { ISocketsEvent, SocketsEventRoute } from "~/handler/types";
import { Context } from "~/types";
import { ISockets, ISocketsResponse } from "~/sockets";

export interface ISocketsRoutePluginCallableParams<
    C extends Context = Context,
    R extends ISocketsResponse = ISocketsResponse
> {
    event: ISocketsEvent;
    sockets: ISockets;
    context: C;
    next: () => Promise<R>;
}

export interface ISocketsRoutePluginCallable<
    C extends Context = Context,
    R extends ISocketsResponse = ISocketsResponse
> {
    (params: ISocketsRoutePluginCallableParams<C>): Promise<R>;
}

export class SocketsRoutePlugin<
    C extends Context = Context,
    R extends ISocketsResponse = ISocketsResponse
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
