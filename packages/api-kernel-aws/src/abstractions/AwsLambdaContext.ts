import type { Context } from "@webiny/aws-sdk/types/index.js";
import { Abstraction } from "@webiny/di";

export interface IAwsLambdaContext {
    /**
     * Whether this invocation carries a real AWS Lambda context. `false` for the null object
     * (e.g. an event dispatched without a Lambda context).
     */
    isSet(): boolean;
    /**
     * The AWS Lambda context. When the invocation had none (see {@link isSet}), this is an empty
     * placeholder context rather than `null`, so callers never have to null-check the result.
     */
    get(): Context;
}

export const AwsLambdaContext = new Abstraction<IAwsLambdaContext>("AwsLambdaContext");

export namespace AwsLambdaContext {
    export type Interface = IAwsLambdaContext;
}

/**
 * Wraps a real AWS Lambda context.
 */
export class AwsLambdaContextValue implements IAwsLambdaContext {
    constructor(private readonly context: Context) {}

    isSet(): boolean {
        return true;
    }

    get(): Context {
        return this.context;
    }
}
