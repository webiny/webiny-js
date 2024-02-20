import { Plugin } from "@webiny/plugins/Plugin";
import { Context, Reply, Request } from "@webiny/handler/types";
import type { Context as LambdaContext, DynamoDBStreamEvent } from "aws-lambda";

export interface DynamoDBEventHandlerCallableParams<Response = Reply> {
    request: Request;
    context: Context;
    event: DynamoDBStreamEvent;
    lambdaContext: LambdaContext;
    reply: Reply;
    next: () => Promise<Response>;
}

export interface DynamoDBEventHandlerCallable<Response = Reply> {
    (params: DynamoDBEventHandlerCallableParams<Response>): Promise<Response>;
}

export class DynamoDBEventHandler<Response = any> extends Plugin {
    public static override type = "handler.fastify.aws.dynamodb.eventHandler";

    public readonly cb: DynamoDBEventHandlerCallable<Response>;

    public constructor(cb: DynamoDBEventHandlerCallable<Response>) {
        super();
        this.cb = cb;
    }
}

export const createEventHandler = <Response>(cb: DynamoDBEventHandlerCallable<Response>) => {
    return new DynamoDBEventHandler<Response>(cb);
};
