import type { Container } from "@webiny/di";
import { HandlerPlatform } from "@webiny/event-handler-core";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { bindLambdaInvocation } from "./bindLambdaInvocation.js";

/** The arguments the Lambda runtime calls a handler with. `createLambdaHandler` takes the same. */
export type AwsLambdaInvocation = [event: any, context?: Context];

/**
 * AWS Lambda: binds the raw event and context into the execution's container so translators and
 * handlers can resolve them, and gives the invocation's `awsRequestId` as the execution id, so an id
 * in an error or a debug capture can be matched against CloudWatch and X-Ray.
 */
class AwsLambdaHandlerPlatformImpl implements HandlerPlatform.Interface<AwsLambdaInvocation> {
    bind(container: Container, rawArgs: AwsLambdaInvocation): void {
        const [event, context] = rawArgs;
        bindLambdaInvocation(container, event, context);
    }

    getExecutionId(rawArgs: AwsLambdaInvocation): string | undefined {
        const [, context] = rawArgs;
        return context?.awsRequestId;
    }
}

export const AwsLambdaHandlerPlatform = HandlerPlatform.createImplementation({
    implementation: AwsLambdaHandlerPlatformImpl,
    dependencies: []
});
