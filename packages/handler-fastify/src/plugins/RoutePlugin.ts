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
}
interface RoutePluginCb {
    (params: RoutePluginCbParams): Promise<void>;
}

export class RoutePlugin extends Plugin {
    public static override readonly type: string = "handler.fastify.route";

    private readonly cb: RoutePluginCb;

    public constructor(cb: RoutePluginCb) {
        super();
        this.cb = cb;
    }
    /**
     * Used to attach the route in our handler-fastify package.
     * Do not use if you are not sure what you are doing.
     * @internal
     */
    public async attach(context: FastifyContext): Promise<void> {
        return this.cb({
            context,
            ...context.routes
        });
    }
}
