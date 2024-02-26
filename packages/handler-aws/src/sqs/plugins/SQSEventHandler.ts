import type { Context as LambdaContext, SQSEvent } from "aws-lambda";
import { Plugin } from "@webiny/plugins/Plugin";
import { Context, Reply, Request } from "@webiny/handler/types";

export interface SQSEventHandlerCallableParams<Response = Reply> {
    request: Request;
    reply: Reply;
    context: Context;
    event: SQSEvent;
    lambdaContext: LambdaContext;
    next: () => Promise<Response>;
}

export interface SQSEventHandlerCallable<Response = Reply> {
    (params: SQSEventHandlerCallableParams<Response>): Promise<Response>;
}

export class SQSEventHandler<Response = any> extends Plugin {
    public static override type = "handler.fastify.aws.sqs.eventHandler";

    public readonly cb: SQSEventHandlerCallable<Response>;

    public constructor(cb: SQSEventHandlerCallable<Response>) {
        super();
        this.cb = cb;
    }
}

export const createEventHandler = <Response>(cb: SQSEventHandlerCallable<Response>) => {
    return new SQSEventHandler<Response>(cb);
};
