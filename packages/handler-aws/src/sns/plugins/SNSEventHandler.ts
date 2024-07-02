import type { Context as LambdaContext, SNSEvent } from "aws-lambda";
import { Plugin } from "@webiny/plugins/Plugin";
import { Context, Reply, Request } from "@webiny/handler/types";

export interface SNSEventHandlerCallableParams<Response = Reply> {
    request: Request;
    reply: Reply;
    context: Context;
    event: SNSEvent;
    lambdaContext: LambdaContext;
    next: () => Promise<Response>;
}

export interface SNSEventHandlerCallable<Response = Reply> {
    (params: SNSEventHandlerCallableParams<Response>): Promise<Response>;
}

export class SNSEventHandler<Response = any> extends Plugin {
    public static override type = "handler.fastify.aws.sns.eventHandler";

    public readonly cb: SNSEventHandlerCallable<Response>;

    public constructor(cb: SNSEventHandlerCallable<Response>) {
        super();
        this.cb = cb;
    }
}

export const createEventHandler = <Response>(cb: SNSEventHandlerCallable<Response>) => {
    return new SNSEventHandler<Response>(cb);
};
