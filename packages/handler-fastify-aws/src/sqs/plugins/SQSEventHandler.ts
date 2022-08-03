import { Plugin } from "@webiny/plugins/Plugin";
import { Request, Reply, FastifyContext } from "@webiny/fastify/types";
import { SQSEvent, Context as LambdaContext } from "aws-lambda";

export interface SQSEventHandlerCallableParams {
    request: Request;
    reply: Reply;
    context: FastifyContext;
    event: SQSEvent;
    lambdaContext: LambdaContext;
}
export interface SQSEventHandlerCallable {
    (params: SQSEventHandlerCallableParams): Promise<Reply>;
}

export class SQSEventHandler extends Plugin {
    public static override type = "handler.fastify.aws.sqs.eventHandler";

    public readonly cb: SQSEventHandlerCallable;

    public constructor(cb: SQSEventHandlerCallable) {
        super();
        this.cb = cb;
    }
}

export const createEventHandler = (cb: SQSEventHandlerCallable) => {
    return new SQSEventHandler(cb);
};
