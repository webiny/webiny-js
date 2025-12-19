import type { Context as LambdaContext } from "@webiny/aws-sdk/types/index.js";
import { CloudFunction } from "../createFunction.js";
import type { Container } from "@webiny/di";
import type { CreateFunctionOptions, FunctionSetup } from "../types.js";

/**
 * Abstract class for raw/generic Lambda functions with DI support
 * Use this for custom event types or when you need full control
 */
export abstract class RawFunction<TEvent = any, TResult = any> extends CloudFunction<
    TEvent,
    TResult
> {
    /**
     * Handle the raw event
     */
    abstract execute(event: TEvent): Promise<TResult>;
}

/**
 * Factory function to create raw/generic handlers with DI
 */
export function createRawFunction<TEvent = any, TResult = any>(
    FunctionClass: new (container: Container) => RawFunction<TEvent, TResult>,
    setup?: FunctionSetup,
    options?: CreateFunctionOptions
) {
    let functionInstance: RawFunction<TEvent, TResult> | null = null;

    return async (event: TEvent, context: LambdaContext): Promise<TResult> => {
        // Initialize on cold start
        if (!functionInstance) {
            const container = new Container();

            // Run user setup
            if (setup) {
                await setup(container);
            }

            // Create function instance
            functionInstance = new FunctionClass(container);
        }

        // Handle the event
        return functionInstance.handle(event);
    };
}

