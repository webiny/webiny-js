import { Plugin } from "@webiny/plugins/Plugin";
import { Request, FastifyContext } from "@webiny/fastify/types";
import { S3Event, Context as LambdaContext } from "aws-lambda";

export interface S3EventHandlerCallableParams {
    request: Request;
    context: FastifyContext;
    event: S3Event;
    lambdaContext: LambdaContext;
}
export interface S3EventHandlerCallable {
    (params: S3EventHandlerCallableParams): Promise<void>;
}

export class S3EventHandler extends Plugin {
    public static override type: "handler.fastify.aws.s3.eventHandler";

    public readonly cb: S3EventHandlerCallable;

    public constructor(cb: S3EventHandlerCallable) {
        super();
        this.cb = cb;
    }
}

export const createS3EventHandler = (cb: S3EventHandlerCallable) => {
    return new S3EventHandler(cb);
};
