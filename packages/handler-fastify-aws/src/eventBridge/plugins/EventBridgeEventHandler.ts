import { Plugin } from "@webiny/plugins/Plugin";
import { Request, Reply, FastifyContext } from "@webiny/fastify/types";
import { EventBridgeEvent, Context as LambdaContext } from "aws-lambda";

export interface EventBridgeEventHandlerCallableParams<DetailType extends string, Detail> {
    request: Request;
    reply: Reply;
    context: FastifyContext;
    payload: EventBridgeEvent<DetailType, Detail>;
    lambdaContext: LambdaContext;
}
export interface EventBridgeEventHandlerCallable<DetailType extends string, Detail> {
    (params: EventBridgeEventHandlerCallableParams<DetailType, Detail>): Promise<Reply>;
}

export class EventBridgeEventHandler<DetailType extends string, Detail> extends Plugin {
    public static override type = "handler.fastify.aws.sqs.eventHandler";

    public readonly cb: EventBridgeEventHandlerCallable<DetailType, Detail>;

    public constructor(cb: EventBridgeEventHandlerCallable<DetailType, Detail>) {
        super();
        this.cb = cb;
    }
}

export const createEventHandler = <DetailType extends string, Detail>(
    cb: EventBridgeEventHandlerCallable<DetailType, Detail>
) => {
    return new EventBridgeEventHandler<DetailType, Detail>(cb);
};
