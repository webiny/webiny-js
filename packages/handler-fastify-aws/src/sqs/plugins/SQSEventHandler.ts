import { Plugin } from "@webiny/plugins/Plugin";
import { Request, Reply, Context } from "@webiny/fastify/types";
import { SQSEvent, Context as LambdaContext } from "aws-lambda";

export interface SQSEventHandlerCallableParams {
    request: Request;
    reply: Reply;
    context: Context;
    event: SQSEvent;
    lambdaContext: LambdaContext;
}
export interface SQSEventHandlerCallable<Response> {
    (params: SQSEventHandlerCallableParams): Promise<Response | Reply>;
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
