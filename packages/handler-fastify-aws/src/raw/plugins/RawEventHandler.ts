import { Plugin } from "@webiny/plugins/Plugin";
import { Request, FastifyContext } from "@webiny/fastify/types";
import { Context as LambdaContext } from "aws-lambda";

export interface RawEventHandlerCallableParams<T> {
    request: Request;
    context: FastifyContext;
    event: T;
    lambdaContext: LambdaContext;
}
export interface RawEventHandlerCallable<T> {
    (params: RawEventHandlerCallableParams<T>): Promise<void>;
}

export class RawEventHandler<T = any> extends Plugin {
    public static override type: "handler.fastify.aws.raw.eventHandler";

    public readonly cb: RawEventHandlerCallable<T>;

    public constructor(cb: RawEventHandlerCallable<T>) {
        super();
        this.cb = cb;
    }
}

export const createRawEventHandler = <T = any>(
    cb: RawEventHandlerCallable<T>
): RawEventHandler<T> => {
    return new RawEventHandler<T>(cb);
};
