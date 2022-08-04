import { Plugin } from "@webiny/plugins/Plugin";
import { Request, Reply, Context } from "@webiny/fastify/types";
import { DynamoDBStreamEvent, Context as LambdaContext } from "aws-lambda";

export interface DynamoDBEventHandlerCallableParams {
    request: Request;
    context: Context;
    event: DynamoDBStreamEvent;
    lambdaContext: LambdaContext;
    reply: Reply;
}
export interface DynamoDBEventHandlerCallable<Response> {
    (params: DynamoDBEventHandlerCallableParams): Promise<Response | Reply>;
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
