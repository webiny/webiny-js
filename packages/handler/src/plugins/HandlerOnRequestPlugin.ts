import type { Context } from "~/types";
import { Plugin } from "@webiny/plugins";
import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * If the execution of the callable returns false, no more plugins will be executed after the given one.
 * Nor it will execute our default OPTIONS code.
 *
 * This way users can prevent stopping of the request on our built-in OPTIONS request.
 */
export type HandlerOnRequestPluginCallableResponse = false | undefined | null | void;
interface HandlerOnRequestPluginCallable<C extends Context = Context> {
    (
        request: FastifyRequest,
        reply: FastifyReply,
        context: C
    ): Promise<HandlerOnRequestPluginCallableResponse>;
}

export class HandlerOnRequestPlugin<C extends Context = Context> extends Plugin {
    public static override type = "handler.event.onRequest";

    private readonly cb: HandlerOnRequestPluginCallable<C>;

    public constructor(cb: HandlerOnRequestPluginCallable<C>) {
        super();
        this.cb = cb;
    }

    public async exec(
        request: FastifyRequest,
        reply: FastifyReply,
        context: C
    ): Promise<HandlerOnRequestPluginCallableResponse> {
        return this.cb(request, reply, context);
    }
}

export const createHandlerOnRequest = <C extends Context = Context>(
    cb: HandlerOnRequestPluginCallable<C>
) => {
    return new HandlerOnRequestPlugin<C>(cb);
};
