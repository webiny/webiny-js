import { Plugin } from "@webiny/plugins/Plugin";
import { Request, FastifyContext } from "@webiny/fastify/types";
import { S3Event, Context as LambdaContext } from "aws-lambda";

export interface S3EventHandlerCallableParams {
    request: Request;
    context: FastifyContext;
    event: S3Event;
    lambdaContext: LambdaContext;
}
export interface S3EventHandlerCallable<Response> {
    (params: S3EventHandlerCallableParams): Promise<Response>;
}

export class S3EventHandler<Response = any> extends Plugin {
    public static override type = "handler.fastify.aws.s3.eventHandler";

    public readonly cb: S3EventHandlerCallable<Response>;

    public constructor(cb: S3EventHandlerCallable<Response>) {
        super();
        this.cb = cb;
    }
}

export const createS3EventHandler = <Response = any>(cb: S3EventHandlerCallable<Response>) => {
    return new S3EventHandler(cb);
};
