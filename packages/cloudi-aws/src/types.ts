import type { Container } from "@webiny/di";
import type { Context as LambdaContext } from "@webiny/aws-sdk/types/index.js";

export interface FunctionSetup {
    (container: Container): void | Promise<void>;
}

export interface FunctionHandler<TEvent = any, TResult = any> {
    (event: TEvent, context: LambdaContext): Promise<TResult>;
}

export interface CreateFunctionOptions {
    /**
     * Enable debug mode
     */
    debug?: boolean;
}

