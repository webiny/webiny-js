import { Plugin } from "@webiny/plugins/Plugin";
import { Context, RouteMethod } from "~/types";

interface RoutePluginCbParams<T extends Context> {
    context: T;
    onGet: RouteMethod;
    onPost: RouteMethod;
    onPut: RouteMethod;
    onPatch: RouteMethod;
    onDelete: RouteMethod;
    onOptions: RouteMethod;
    onAll: RouteMethod;
    onHead: RouteMethod;
}
export interface RoutePluginCb<T extends Context> {
    (params: RoutePluginCbParams<T>): void;
}

export class RoutePlugin<T extends Context = Context> extends Plugin {
    public static override readonly type: string = "handler.fastify.route";

    public readonly cb: RoutePluginCb<T>;

    public constructor(cb: RoutePluginCb<T>) {
        super();
        this.cb = cb;
    }
}

export const createRoute = <T extends Context = Context>(cb: RoutePluginCb<T>): RoutePlugin<T> => {
    return new RoutePlugin<T>(cb);
};
