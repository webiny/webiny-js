/**
 * EventPlugin must be handled in the package which implements fastify for certain cloud.
 * There is no standard input for AWS Lambda, Google Cloud Functions and MS Azure Functions so we let that
 * to be sorted out in the implementation package.
 *
 * Note that only one EventPlugin can be defined per fastify initialisation.
 * If more is needed, check ~/fastify.ts and implement that possibility.
 */
import { Plugin } from "@webiny/plugins/Plugin";
import { Request, FastifyContext, Reply } from "~/types";

export interface EventPluginCallableParams<Payload, Context extends FastifyContext> {
    context: Context;
    payload: Payload;
    request: Request;
    reply: Reply;
}

export interface EventPluginCallable<Payload, Context extends FastifyContext> {
    (params: EventPluginCallableParams<Payload, Context>): Promise<Reply>;
}

export class EventPlugin<
    Payload = any,
    Context extends FastifyContext = FastifyContext
> extends Plugin {
    public static override type = "handler.fastify.event";

    public readonly cb: EventPluginCallable<Payload, Context>;

    public constructor(cb: EventPluginCallable<Payload, Context>) {
        super();
        this.cb = cb;
    }
}

export const createEvent = <Payload = any, Context extends FastifyContext = FastifyContext>(
    cb: EventPluginCallable<Payload, Context>
) => {
    return new EventPlugin<Payload, Context>(cb);
};
