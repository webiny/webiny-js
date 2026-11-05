import type { Container } from "@webiny/di";
import { HandlerPlatform } from "@webiny/event-handler-core";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { AwsLambdaEvent } from "./abstractions/AwsLambdaEvent.js";
import { AwsLambdaContext, AwsLambdaContextValue } from "./abstractions/AwsLambdaContext.js";
import { NullAwsLambdaContext } from "./abstractions/NullAwsLambdaContext.js";
import {
    LambdaResponseStream,
    LambdaResponseStreamValue
} from "./abstractions/LambdaResponseStream.js";
import type { IRawResponseStream } from "./streaming/awslambda.js";

/**
 * AWS Lambda response streaming: the same job as {@link AwsLambdaHandlerPlatform}, plus the response
 * stream the streaming runtime supplies, which the terminal handler resolves and writes to.
 *
 * The streaming runtime calls handlers as `(event, responseStream, context)` — note the context is
 * the THIRD argument here, not the second.
 */
class AwsLambdaStreamHandlerPlatformImpl implements HandlerPlatform.Interface {
    bind(container: Container, rawArgs: any[]): void {
        const event = rawArgs[0];
        const responseStream: IRawResponseStream = rawArgs[1];
        const context: Context | undefined = rawArgs[2];
        const contextValue = context
            ? new AwsLambdaContextValue(context)
            : new NullAwsLambdaContext();
        const responseStreamValue = new LambdaResponseStreamValue(responseStream);

        container.registerInstance(AwsLambdaEvent, event);
        container.registerInstance(LambdaResponseStream, responseStreamValue);
        container.registerInstance(AwsLambdaContext, contextValue);
    }

    getExecutionId(rawArgs: any[]): string | undefined {
        const context: Context | undefined = rawArgs[2];
        return context?.awsRequestId;
    }
}

export const AwsLambdaStreamHandlerPlatform = HandlerPlatform.createImplementation({
    implementation: AwsLambdaStreamHandlerPlatformImpl,
    dependencies: []
});
