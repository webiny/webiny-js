import type { Context as LambdaContext, EventBridgeEvent } from "aws-lambda";
import { Plugin } from "@webiny/plugins/Plugin";
import { Context, Reply, Request } from "@webiny/handler/types";

export interface EventBridgeEventHandlerCallableParams<
    DetailType extends string,
    Detail,
    Response = Reply
> {
    request: Request;
    reply: Reply;
    context: Context;
    payload: EventBridgeEvent<DetailType, Detail>;
    lambdaContext: LambdaContext;
    next: () => Promise<Response>;
}
export interface EventBridgeEventHandlerCallable<
    DetailType extends string,
    Detail,
    Response = Reply
> {
    (
        params: EventBridgeEventHandlerCallableParams<DetailType, Detail, Response>
    ): Promise<Response>;
}

export class EventBridgeEventHandler<
    DetailType extends string,
    Detail,
    Response = any
> extends Plugin {
    public static override type = "handler.fastify.aws.eventBridge.eventHandler";

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
