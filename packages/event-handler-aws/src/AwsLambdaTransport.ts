import type { Container } from "@webiny/di";
import type { Transport } from "@webiny/event-handler-core";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { AwsLambdaEvent } from "./abstractions/AwsLambdaEvent.js";
import { AwsLambdaContext } from "./abstractions/AwsLambdaContext.js";

/**
 * AWS Lambda transport: binds the raw Lambda event (and context, when present) into the
 * per-request container so downstream translators/handlers can resolve them. This is the only
 * AWS-specific step of the handler loop — everything else lives in the transport-agnostic
 * `createHandler` in @webiny/event-handler-core.
 */
export const awsLambdaTransport: Transport = {
    bind(container: Container, event: any, context?: Context) {
        container.registerInstance(AwsLambdaEvent, event);
        if (context) {
            container.registerInstance(AwsLambdaContext, context);
        }
    }
};
