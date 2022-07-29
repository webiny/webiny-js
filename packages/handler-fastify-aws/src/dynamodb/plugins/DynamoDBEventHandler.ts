import { Plugin } from "@webiny/plugins/Plugin";
import { Request, FastifyContext } from "@webiny/fastify/types";
import { DynamoDBStreamEvent, Context as LambdaContext } from "aws-lambda";

export interface DynamoDBEventHandlerCallableParams {
    request: Request;
    context: FastifyContext;
    event: DynamoDBStreamEvent;
    lambdaContext: LambdaContext;
}
export interface DynamoDBEventHandlerCallable<Response> {
    (params: DynamoDBEventHandlerCallableParams): Promise<Response>;
}

export class DynamoDBEventHandler<Response = any> extends Plugin {
    public static override type = "handler.fastify.aws.dynamodb.eventHandler";

    public readonly cb: DynamoDBEventHandlerCallable<Response>;

    public constructor(cb: DynamoDBEventHandlerCallable<Response>) {
        super();
        this.cb = cb;
    }
}

export const createEventHandler = <Response = any>(cb: DynamoDBEventHandlerCallable<Response>) => {
    return new DynamoDBEventHandler(cb);
};
