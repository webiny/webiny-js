import { Plugin } from "@webiny/plugins";
import { FastifyReply, FastifyRequest } from "fastify";

/**
 * If the execution of the callable returns false, no more plugins will be executed after the given one.
 * Nor it will execute our default OPTIONS code.
 *
 * This way users can prevent stopping of the request on our built-in OPTIONS request.
 */
export type HandlerOnRequestPluginCallableResponse = false | undefined | null | void;
interface HandlerOnRequestPluginCallable {
    (request: FastifyRequest, reply: FastifyReply): Promise<HandlerOnRequestPluginCallableResponse>;
}

export class HandlerOnRequestPlugin extends Plugin {
    public static override type = "handler.event.onRequest";

    private readonly cb: HandlerOnRequestPluginCallable;

    public constructor(cb: HandlerOnRequestPluginCallable) {
        super();
        this.cb = cb;
    }

    public async exec(
        request: FastifyRequest,
        reply: FastifyReply
    ): Promise<HandlerOnRequestPluginCallableResponse> {
        return this.cb(request, reply);
    }
}

export const createHandlerOnRequest = (cb: HandlerOnRequestPluginCallable) => {
    return new HandlerOnRequestPlugin(cb);
};
