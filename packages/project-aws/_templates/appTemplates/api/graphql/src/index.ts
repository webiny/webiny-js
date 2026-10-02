/**
 * DI-native API GraphQL handler (DynamoDB storage).
 *
 * The composition root lives in @webiny/api-event-handler-aws-ddb (`createAwsDdbApiHandler`) so the wiring
 * is a real, testable package rather than template code. This file only supplies project-specific
 * extensions.
 *
 * Two handlers are exported from this one bundle and deployed as two Lambda functions:
 * - `handler` — behind API Gateway, buffered responses. Everything except streaming routes.
 * - `streamHandler` — behind a Lambda Function URL with `InvokeMode: RESPONSE_STREAM`, for routes that
 *   stream (e.g. `/stream/*`). A separate function is required because a Lambda's handler entry is
 *   fixed per function, and API Gateway buffers the whole response so it cannot stream at all.
 */
import {
    createAwsDdbApiHandler,
    createAwsDdbStreamApiHandler,
    warmUpLambdaHandler
} from "@webiny/api-event-handler-aws-ddb";
import { extensions } from "./extensions";

export const handler = createAwsDdbApiHandler({ extensions });

export const streamHandler = createAwsDdbStreamApiHandler({ extensions });

// Lambda gives the init phase more CPU than it gives a request, so the work a cold start's first
// request would do (containers, license, database connection, GraphQL schema) is done here instead.
await warmUpLambdaHandler({ handler, streamHandler });
