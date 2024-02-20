import type { Context as LambdaContext, S3Event } from "aws-lambda";
import { Plugin } from "@webiny/plugins/Plugin";
import { Context, Reply, Request } from "@webiny/handler/types";

export interface S3EventHandlerCallableParams<Response = Reply> {
    request: Request;
    context: Context;
    event: S3Event;
    lambdaContext: LambdaContext;
    reply: Reply;
    next: () => Promise<Response>;
}

export interface S3EventHandlerCallable<Response = Reply> {
    (params: S3EventHandlerCallableParams<Response>): Promise<Response>;
}

export class S3EventHandler<Response = any> extends Plugin {
    public static override type = "handler.fastify.aws.s3.eventHandler";

    public readonly cb: S3EventHandlerCallable<Response>;

    public constructor(cb: S3EventHandlerCallable<Response>) {
        super();
        this.cb = cb;
    }
}

export const createEventHandler = <Response>(cb: S3EventHandlerCallable<Response>) => {
    return new S3EventHandler<Response>(cb);
};
