import type { Container } from "@webiny/di";
import type { Transport } from "@webiny/event-handler-core";
import { RequestId } from "@webiny/event-handler-core";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { AwsLambdaEvent } from "./abstractions/AwsLambdaEvent.js";
import { AwsLambdaContext, AwsLambdaContextValue } from "./abstractions/AwsLambdaContext.js";
import { NullAwsLambdaContext } from "./abstractions/NullAwsLambdaContext.js";

/**
 * AWS Lambda transport: binds the raw Lambda event and context into the per-request container so
 * downstream translators/handlers can resolve them. This is the only AWS-specific step of the
 * handler loop — everything else lives in the transport-agnostic `createHandler` in
 * @webiny/event-handler-core.
 *
 * AwsLambdaContext is ALWAYS registered — a {@link NullAwsLambdaContext} when the invocation had
 * no context — so consumers can resolve it unconditionally and branch on `isSet()`.
 *
 * It also replaces the generated {@link RequestId} with the invocation's own `awsRequestId`, so an id
 * reported to a client can be matched against CloudWatch and X-Ray.
 */
export const awsLambdaTransport: Transport = {
    bind(container: Container, event: any, context?: Context) {
        container.registerInstance(AwsLambdaEvent, event);
        container.registerInstance(
            AwsLambdaContext,
            context ? new AwsLambdaContextValue(context) : new NullAwsLambdaContext()
        );
        if (context?.awsRequestId) {
            container.registerInstance(RequestId, { value: context.awsRequestId });
        }
    }
};
