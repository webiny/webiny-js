import { Plugin } from "@webiny/plugins/Plugin";
import { Request, FastifyContext } from "@webiny/fastify/types";
import { Context as LambdaContext } from "aws-lambda";

export interface PayloadHandlerCallableParams<Payload> {
    request: Request;
    context: FastifyContext;
    payload: Payload;
    lambdaContext: LambdaContext;
}
export interface PayloadEventHandlerCallable<Payload, Response> {
    (params: PayloadHandlerCallableParams<Payload>): Promise<Response>;
}

export class PayloadEventHandler<Payload = any, Response = any> extends Plugin {
    public static override type = "handler.fastify.aws.event.payloadHandler";

    public readonly cb: PayloadEventHandlerCallable<Payload, Response>;

    public constructor(cb: PayloadEventHandlerCallable<Payload, Response>) {
        super();
        this.cb = cb;
    }
}

export const createEventHandler = <Payload = any, Response = any>(
    cb: PayloadEventHandlerCallable<Payload, Response>
): PayloadEventHandler<Payload, Response> => {
    return new PayloadEventHandler<Payload, Response>(cb);
};
