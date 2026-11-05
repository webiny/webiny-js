import type { Container } from "@webiny/di";
import { HandlerPlatform } from "@webiny/event-handler-core";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { AwsLambdaEvent } from "./abstractions/AwsLambdaEvent.js";
import { AwsLambdaContext, AwsLambdaContextValue } from "./abstractions/AwsLambdaContext.js";
import { NullAwsLambdaContext } from "./abstractions/NullAwsLambdaContext.js";

/**
 * AWS Lambda: the runtime calls the handler as `(event, context)`. Binds the raw event and context
 * into the execution's container so translators and handlers can resolve them, and gives the
 * invocation's `awsRequestId` as the execution id, so an id in an error or a debug capture can be
 * matched against CloudWatch and X-Ray.
 *
 * AwsLambdaContext is ALWAYS registered — a {@link NullAwsLambdaContext} when the invocation had
 * no context — so consumers can resolve it unconditionally and branch on `isSet()`.
 */
class AwsLambdaHandlerPlatformImpl implements HandlerPlatform.Interface {
    bind(container: Container, rawArgs: any[]): void {
        const event = rawArgs[0];
        const context: Context | undefined = rawArgs[1];
        const contextValue = context
            ? new AwsLambdaContextValue(context)
            : new NullAwsLambdaContext();

        container.registerInstance(AwsLambdaEvent, event);
        container.registerInstance(AwsLambdaContext, contextValue);
    }

    getExecutionId(rawArgs: any[]): string | undefined {
        const context: Context | undefined = rawArgs[1];
        return context?.awsRequestId;
    }
}

export const AwsLambdaHandlerPlatform = HandlerPlatform.createImplementation({
    implementation: AwsLambdaHandlerPlatformImpl,
    dependencies: []
});
