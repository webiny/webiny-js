/**
 * Webiny API handler for AWS Lambda with DynamoDB storage.
 *
 * Thin variant over the storage-agnostic base (@webiny/api-event-handler-aws): supplies the DynamoDB
 * storage wiring (core + CMS + audit-logs + ACO + websockets storage operations). No OpenSearch.
 *
 * Two entry points share that wiring: the buffered API Gateway handler and the response-streaming
 * Function URL handler. They are separate Lambda functions built from the same bundle. The Lambda web
 * function's entry is `startAwsDdbWebApi`, in its own file.
 */
import { createWebinyApiHandler as createBaseHandler } from "@webiny/api-event-handler-aws";
import { createWebinyStreamApiHandler as createBaseStreamHandler } from "@webiny/api-event-handler-aws";
import { storageConfig } from "./storageConfig.js";
import type { CreateAwsDdbApiHandlerConfig } from "./storageConfig.js";

export type { CreateAwsDdbApiHandlerConfig };

export function createAwsDdbApiHandler(config: CreateAwsDdbApiHandlerConfig) {
    return createBaseHandler(storageConfig(config));
}

/**
 * Response-streaming counterpart, for the Lambda function whose Function URL uses
 * `InvokeMode: RESPONSE_STREAM`. Identical storage; only the transport differs.
 */
export function createAwsDdbStreamApiHandler(config: CreateAwsDdbApiHandlerConfig) {
    return createBaseStreamHandler(storageConfig(config));
}
