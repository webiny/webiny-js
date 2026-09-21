/**
 * DI-native API GraphQL handler — OpenSearch (DDB+ES) variant.
 *
 * The composition root lives in @webiny/api-event-handler-aws-ddb-os (`createAwsDdbOsApiHandler`) so the
 * wiring is a real, testable package rather than template code. The OpenSearch extension's
 * ReplaceApiLambdaFnHandlers copies this file over the api workspace when OpenSearch is enabled.
 * This file only supplies project-specific extensions.
 *
 * Exports both the buffered (API Gateway) and the response-streaming (Function URL) handler; see the
 * DynamoDB variant of this file for why streaming needs its own Lambda function.
 */
import {
    createAwsDdbOsApiHandler,
    createAwsDdbOsStreamApiHandler
} from "@webiny/api-event-handler-aws-ddb-os";
import { extensions } from "./extensions";

export const handler = createAwsDdbOsApiHandler({ extensions });

export const streamHandler = createAwsDdbOsStreamApiHandler({ extensions });
