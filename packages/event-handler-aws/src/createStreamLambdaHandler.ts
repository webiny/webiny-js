import { HandlerApp } from "@webiny/event-handler-core";
import type { HandlerSetup } from "@webiny/event-handler-core";
import type { Context } from "@webiny/aws-sdk/types/index.js";
import { awsLambdaStreamTransport } from "./AwsLambdaStreamTransport.js";
import { getAwsLambdaGlobal, isAwsLambdaStreamingRuntime } from "./streaming/awslambda.js";
import type { IRawResponseStream } from "./streaming/awslambda.js";

export interface CreateStreamLambdaHandlerOptions {
    root: HandlerSetup;
    child?: HandlerSetup;
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
    const app = HandlerApp.init({
        root: options.root,
        child: options.child,
        transport: awsLambdaStreamTransport
    });

    const handler: StreamLambdaHandler = async (event, responseStream, context) => {
        await app.handle(event, responseStream, context);
    };

    if (!isAwsLambdaStreamingRuntime()) {
        // Outside the Lambda runtime (tests, local dev) there is no `awslambda` global to mark the
        // handler with. Return it unwrapped so merely importing the module doesn't throw — it still
        // routes and writes to whatever stream it is handed.
        //
        // Inside Lambda this is never expected, and it fails SILENTLY: an unmarked handler is invoked
        // in buffered mode, returns undefined, and the caller gets an empty 200 with
        // `content-type: application/octet-stream` and none of the headers the route set. Say so
        // loudly, because nothing else in the response distinguishes it from a working stream.
        if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
            const shape = (globalThis as any).awslambda;
            console.error(
                "[webiny] Response streaming is UNAVAILABLE in this Lambda: `awslambda" +
                    ".streamifyResponse` was not a function at module load, so the handler was not " +
                    "marked as streaming and will return buffered, header-less responses. " +
                    `awslambda=${typeof shape}, keys=${JSON.stringify(Object.keys(shape ?? {}))}`
            );
        }

        return handler;
    }

    return getAwsLambdaGlobal().streamifyResponse(handler);
}
