import { Plugin } from "@webiny/plugins/Plugin";
import { FastifyContext, RouteMethod } from "~/types";

interface RoutePluginCbParams<T extends FastifyContext> {
    context: T;
    onGet: RouteMethod;
    onPost: RouteMethod;
    onPut: RouteMethod;
    onPatch: RouteMethod;
    onDelete: RouteMethod;
    onOptions: RouteMethod;
    onAll: RouteMethod;
}
interface RoutePluginCb<T extends FastifyContext> {
    (params: RoutePluginCbParams<T>): void;
}

export class RoutePlugin<T extends FastifyContext = FastifyContext> extends Plugin {
    public static override readonly type: string = "handler.fastify.route";

    public readonly cb: RoutePluginCb<T>;

    public constructor(cb: RoutePluginCb<T>) {
        super();
        this.cb = cb;
    }
}
