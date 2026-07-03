import type { Container } from "@webiny/di";
import type { Transport } from "@webiny/event-handler-core";
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
 */
export const awsLambdaTransport: Transport = {
    bind(container: Container, event: any, context?: Context) {
        container.registerInstance(AwsLambdaEvent, event);
        container.registerInstance(
            AwsLambdaContext,
            context ? new AwsLambdaContextValue(context) : new NullAwsLambdaContext()
        );
    }
};
