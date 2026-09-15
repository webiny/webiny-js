import type { Container } from "@webiny/di";
import type { Transport } from "@webiny/event-handler-core";
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
 * AWS Lambda response-streaming transport. Same job as {@link awsLambdaTransport}, plus the third
 * argument the streaming runtime supplies: the response stream, which the terminal handler resolves
 * and writes to.
 *
 * The streaming runtime calls handlers as `(event, responseStream, context)` — note the context is
 * the THIRD argument here, not the second.
 */
export const awsLambdaStreamTransport: Transport = {
    bind(container: Container, event: any, responseStream: IRawResponseStream, context?: Context) {
        container.registerInstance(AwsLambdaEvent, event);
        container.registerInstance(
            LambdaResponseStream,
            new LambdaResponseStreamValue(responseStream)
        );
        container.registerInstance(
            AwsLambdaContext,
            context ? new AwsLambdaContextValue(context) : new NullAwsLambdaContext()
        );
    }
};
