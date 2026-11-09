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
import {
    createWebinyApiHandler as createBaseHandler,
    createWebinyStreamApiHandler as createBaseStreamHandler,
    type CreateWebinyApiHandlerConfig as BaseConfig
} from "@webiny/api-event-handler-aws";
import { registerRootStorage } from "./registerRootStorage.js";

export type CreateAwsDdbApiHandlerConfig = Pick<BaseConfig, "extensions" | "documentClient">;

export function createAwsDdbApiHandler(config: CreateAwsDdbApiHandlerConfig) {
    return createBaseHandler({ ...config, registerRootStorage });
}

/**
 * Response-streaming counterpart, for the Lambda function whose Function URL uses
 * `InvokeMode: RESPONSE_STREAM`. Identical storage; only the transport differs.
 */
export function createAwsDdbStreamApiHandler(config: CreateAwsDdbApiHandlerConfig) {
    return createBaseStreamHandler({ ...config, registerRootStorage });
}
