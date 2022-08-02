import { Plugin } from "@webiny/plugins/Plugin";
import { Request, FastifyContext } from "@webiny/fastify/types";
import { Context as LambdaContext } from "aws-lambda";

export interface PayloadHandlerCallableParams<Payload, Context extends FastifyContext> {
    request: Request;
    context: Context;
    payload: Payload;
    lambdaContext: LambdaContext;
}
export interface PayloadEventHandlerCallable<Payload, Context extends FastifyContext, Response> {
    (params: PayloadHandlerCallableParams<Payload, Context>): Promise<Response>;
}

export class PayloadEventHandler<
    Payload = any,
    Context extends FastifyContext = FastifyContext,
    Response = any
> extends Plugin {
    public static override type = "handler.fastify.aws.event.payloadHandler";

    public readonly cb: PayloadEventHandlerCallable<Payload, Context, Response>;

    public constructor(cb: PayloadEventHandlerCallable<Payload, Context, Response>) {
        super();
        this.cb = cb;
    }
}

export const createEventHandler = <
    Payload = any,
    Context extends FastifyContext = FastifyContext,
    Response = any
>(
    cb: PayloadEventHandlerCallable<Payload, Context, Response>
): PayloadEventHandler<Payload, Context, Response> => {
    return new PayloadEventHandler<Payload, Context, Response>(cb);
};
