/**
 * Webiny API handler for AWS Lambda with DynamoDB + OpenSearch storage.
 *
 * Thin variant over the storage-agnostic base (@webiny/api-event-handler-aws): same DynamoDB storage as the
 * `-ddb` variant for core/audit-logs/ACO/websockets, but CMS uses the DynamoDB+OpenSearch storage
 * operations (`HeadlessCmsDdbEsFeature`), and the OpenSearch core and `DbRegistryFeature` are
 * registered in the root too. Per-request state (the DataLoaders, the OpenSearch field indexes, each
 * request's DbRegistry) is container scoped, so every request still gets its own.
 */
import { createWebinyApiHandler as createBaseHandler } from "@webiny/api-event-handler-aws";
import { createWebinyStreamApiHandler as createBaseStreamHandler } from "@webiny/api-event-handler-aws";
import { storageConfig } from "./storageConfig.js";
import type { CreateAwsDdbOsApiHandlerConfig } from "./storageConfig.js";

export type { CreateAwsDdbOsApiHandlerConfig };

export function createAwsDdbOsApiHandler(config: CreateAwsDdbOsApiHandlerConfig) {
    return createBaseHandler(storageConfig(config));
}

/**
 * Response-streaming counterpart, for the Lambda function whose Function URL uses
 * `InvokeMode: RESPONSE_STREAM`. Identical storage; only the transport differs.
 */
export function createAwsDdbOsStreamApiHandler(config: CreateAwsDdbOsApiHandlerConfig) {
    return createBaseStreamHandler(storageConfig(config));
}
