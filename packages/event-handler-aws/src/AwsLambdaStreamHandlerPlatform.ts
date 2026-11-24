import type { Container } from "@webiny/di";
import { HandlerPlatform } from "@webiny/event-handler-core";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { LambdaResponseStream } from "./abstractions/LambdaResponseStream.js";
import { LambdaResponseStreamValue } from "./abstractions/LambdaResponseStream.js";
import { bindLambdaInvocation } from "./bindLambdaInvocation.js";
import type { IRawResponseStream } from "./streaming/awslambda.js";

/**
 * The arguments the Lambda streaming runtime calls a handler with — the context is the THIRD argument
 * here, not the second. `createStreamLambdaHandler` takes the same.
 */
export type AwsLambdaStreamInvocation = [
    event: any,
    responseStream: IRawResponseStream,
    context?: Context
];

/**
 * AWS Lambda response streaming: the same job as `AwsLambdaHandlerPlatform`, plus the response
 * stream the streaming runtime supplies, which the terminal handler resolves and writes to.
 */
class AwsLambdaStreamHandlerPlatformImpl implements HandlerPlatform.Interface<AwsLambdaStreamInvocation> {
    bind(container: Container, rawArgs: AwsLambdaStreamInvocation): void {
        const [event, responseStream, context] = rawArgs;
        const responseStreamValue = new LambdaResponseStreamValue(responseStream);

        bindLambdaInvocation(container, event, context);
        container.registerInstance(LambdaResponseStream, responseStreamValue);
    }

    getExecutionId(rawArgs: AwsLambdaStreamInvocation): string | undefined {
        const [, , context] = rawArgs;
        return context?.awsRequestId;
    }
}

export const AwsLambdaStreamHandlerPlatform = HandlerPlatform.createImplementation({
    implementation: AwsLambdaStreamHandlerPlatformImpl,
    dependencies: []
});
