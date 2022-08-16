import { Plugin } from "@webiny/plugins/Plugin";
import { Request, Reply, Context } from "@webiny/handler/types";
import { S3Event, Context as LambdaContext } from "aws-lambda";

export interface S3EventHandlerCallableParams {
    request: Request;
    context: Context;
    event: S3Event;
    lambdaContext: LambdaContext;
    reply: Reply;
}
export interface S3EventHandlerCallable<Response> {
    (params: S3EventHandlerCallableParams): Promise<Response | Reply>;
}

export class S3EventHandler<Response = any> extends Plugin {
    public static override type = "handler.fastify.aws.s3.eventHandler";

    public readonly cb: S3EventHandlerCallable<Response>;

    public constructor(cb: S3EventHandlerCallable<Response>) {
        super();
        this.cb = cb;
    }
}

export const createS3EventHandler = <Response>(cb: S3EventHandlerCallable<Response>) => {
    return new S3EventHandler<Response>(cb);
};
