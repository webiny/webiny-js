/**
 * EventPlugin must be handled in the package which implements fastify for certain cloud.
 * There is no standard input for AWS Lambda, Google Cloud Functions and MS Azure Functions so we let that
 * to be sorted out in the implementation package.
 *
 * Note that only one EventPlugin can be defined per fastify initialisation.
 * If more is needed, check ~/fastify.ts and implement that possibility.
 */
import { Plugin } from "@webiny/plugins/Plugin";
import { Request, Context as BaseContext, Reply } from "~/types";

export interface EventPluginCallableParams<Payload, Context extends BaseContext> {
    context: Context;
    payload: Payload;
    request: Request;
    reply: Reply;
}

export interface EventPluginCallable<Payload, Context extends BaseContext, Response> {
    (params: EventPluginCallableParams<Payload, Context>): Promise<Response | Reply>;
}

export class EventPlugin<
    Payload = any,
    Context extends BaseContext = BaseContext,
    Response = any
> extends Plugin {
    public static override type = "handler.fastify.event";

    public readonly cb: EventPluginCallable<Payload, Context, Response>;

    public constructor(cb: EventPluginCallable<Payload, Context, Response>) {
        super();
        this.cb = cb;
    }
}

export const createEvent = <
    Payload = any,
    Context extends BaseContext = BaseContext,
    Response = any
>(
    cb: EventPluginCallable<Payload, Context, Response>
) => {
    return new EventPlugin<Payload, Context, Response>(cb);
};
