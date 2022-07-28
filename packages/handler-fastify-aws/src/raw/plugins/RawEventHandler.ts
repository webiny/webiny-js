import { Plugin } from "@webiny/plugins/Plugin";
import { Request, FastifyContext } from "@webiny/fastify/types";
import { Context as LambdaContext } from "aws-lambda";

export interface RawEventHandlerCallableParams<Event> {
    request: Request;
    context: FastifyContext;
    event: Event;
    lambdaContext: LambdaContext;
}
export interface RawEventHandlerCallable<Event, Response> {
    (params: RawEventHandlerCallableParams<Event>): Promise<Response>;
}

export class RawEventHandler<Event = any, Response = any> extends Plugin {
    public static override type: "handler.fastify.aws.raw.eventHandler";

    public readonly cb: RawEventHandlerCallable<Event, Response>;

    public constructor(cb: RawEventHandlerCallable<Event, Response>) {
        super();
        this.cb = cb;
    }
}

export const createRawEventHandler = <Event = any, Response = any>(
    cb: RawEventHandlerCallable<Event, Response>
): RawEventHandler<Event, Response> => {
    return new RawEventHandler<Event, Response>(cb);
};
