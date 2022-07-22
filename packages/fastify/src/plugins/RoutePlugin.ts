import { Plugin } from "@webiny/plugins/Plugin";
import { FastifyContext, RouteMethod } from "~/types";

interface RoutePluginCbParams {
    context: FastifyContext;
    onGet: RouteMethod;
    onPost: RouteMethod;
    onPut: RouteMethod;
    onPatch: RouteMethod;
    onDelete: RouteMethod;
    onOptions: RouteMethod;
    onAll: RouteMethod;
}
interface RoutePluginCb {
    (params: RoutePluginCbParams): void;
}

export class RoutePlugin extends Plugin {
    public static override readonly type: string = "handler.fastify.route";

    public readonly cb: RoutePluginCb;

    public constructor(cb: RoutePluginCb) {
        super();
        this.cb = cb;
    }
}
