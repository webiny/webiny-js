import { Plugin } from "@webiny/plugins/Plugin";
import { Request, Reply, FastifyContext } from "@webiny/fastify/types";
import { DynamoDBStreamEvent, Context as LambdaContext } from "aws-lambda";

export interface DynamoDBEventHandlerCallableParams {
    request: Request;
    context: FastifyContext;
    event: DynamoDBStreamEvent;
    lambdaContext: LambdaContext;
    reply: Reply;
}
export interface DynamoDBEventHandlerCallable {
    (params: DynamoDBEventHandlerCallableParams): Promise<Reply>;
}

export class DynamoDBEventHandler extends Plugin {
    public static override type = "handler.fastify.aws.dynamodb.eventHandler";

    public readonly cb: DynamoDBEventHandlerCallable;

    public constructor(cb: DynamoDBEventHandlerCallable) {
        super();
        this.cb = cb;
    }
}

export const createEventHandler = (cb: DynamoDBEventHandlerCallable) => {
    return new DynamoDBEventHandler(cb);
};
