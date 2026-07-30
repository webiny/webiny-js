import { createHandler } from "@webiny/event-handler-core";
import type { HandlerSetup } from "@webiny/event-handler-core";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { awsLambdaStreamTransport } from "./AwsLambdaStreamTransport.js";
import { getAwsLambdaGlobal, isAwsLambdaStreamingRuntime } from "./streaming/awslambda.js";
import type { IRawResponseStream } from "./streaming/awslambda.js";

export interface CreateStreamLambdaHandlerOptions {
    root: HandlerSetup;
    request?: HandlerSetup;
}

export type StreamLambdaHandler = (
    event: any,
    responseStream: IRawResponseStream,
    context?: Context
) => Promise<void>;

/**
 * Response-streaming counterpart to {@link createLambdaHandler}. The returned handler is wrapped in
 * `awslambda.streamifyResponse`, which is what makes the Lambda runtime invoke it as
 * `(event, responseStream, context)` and stream the response back.
 *
 * The wrap has to happen HERE, eagerly, and the result has to be what the module exports:
 * `streamifyResponse` marks the function it returns, and the runtime inspects the exported handler for
 * that mark. Deferring the wrap until first invocation would leave the export unmarked and the
 * function would silently fall back to buffered responses.
 *
 * Only usable on a Lambda function whose Function URL has `InvokeMode: RESPONSE_STREAM`. API Gateway
 * cannot stream — it buffers the whole Lambda response regardless of how it was produced — so a
 * function fronted by API Gateway must keep using `createLambdaHandler`.
 */
export function createStreamLambdaHandler(
    options: CreateStreamLambdaHandlerOptions
): StreamLambdaHandler {
    const handle = createHandler({
        root: options.root,
        request: options.request,
        transport: awsLambdaStreamTransport
    });

    const handler: StreamLambdaHandler = async (event, responseStream, context) => {
        await handle(event, responseStream, context);
    };

    if (!isAwsLambdaStreamingRuntime()) {
        // Outside the Lambda runtime (tests, local dev) there is no `awslambda` global to mark the
        // handler with. Return it unwrapped so merely importing the module doesn't throw — it still
        // routes and writes to whatever stream it is handed.
        return handler;
    }

    return getAwsLambdaGlobal().streamifyResponse(handler);
}
