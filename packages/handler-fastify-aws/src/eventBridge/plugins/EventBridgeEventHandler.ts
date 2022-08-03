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
export interface EventBridgeEventHandlerCallable<DetailType extends string, Detail, Response> {
    (params: EventBridgeEventHandlerCallableParams<DetailType, Detail>): Promise<Response | Reply>;
}

export class EventBridgeEventHandler<
    DetailType extends string,
    Detail,
    Response = any
> extends Plugin {
    public static override type = "handler.fastify.aws.sqs.eventHandler";

    public readonly cb: EventBridgeEventHandlerCallable<DetailType, Detail, Response>;

    public constructor(cb: EventBridgeEventHandlerCallable<DetailType, Detail, Response>) {
        super();
        this.cb = cb;
    }
}

export const createEventHandler = <DetailType extends string, Detail, Response = any>(
    cb: EventBridgeEventHandlerCallable<DetailType, Detail, Response>
) => {
    return new EventBridgeEventHandler<DetailType, Detail, Response>(cb);
};
