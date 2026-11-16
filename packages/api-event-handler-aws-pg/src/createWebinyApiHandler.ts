/**
 * Webiny API handler for AWS Lambda with Postgres storage (Aurora PostgreSQL, directly or through
 * RDS Proxy). No DynamoDB and no OpenSearch.
 *
 * Thin variant over the storage-agnostic base (@webiny/api-event-handler-aws): supplies the Postgres
 * storage (`createPgStorage` from `@webiny/api-storage-pg`, the same storage the standalone server
 * uses on Postgres) on the Lambda connection (`createLambdaPgConnection`). The CMS and ACO on
 * Postgres arrive with the project's extensions (`<HeadlessCmsPg />`, `<AcoPg />`), as on the
 * server. Identity stays with the base (the project's identity provider extension, e.g. Cognito).
 *
 * Two entry points share that wiring: the buffered API Gateway handler and the response-streaming
 * Function URL handler. They are separate Lambda functions built from the same bundle. The Lambda web
 * function's entry is `startAwsPgWebApi`, in its own file. The tables
 * are created at deploy time, by the deployment invoking the API's function with the schema-setup
 * event (`SqlSchemaSetupEvent`), so the API runs schema-managed from the start: it never checks for
 * or creates tables.
 */
import { createWebinyApiHandler as createBaseHandler } from "@webiny/api-event-handler-aws";
import { createWebinyStreamApiHandler as createBaseStreamHandler } from "@webiny/api-event-handler-aws";
import { storageConfig } from "./storageConfig.js";
import type { CreateAwsPgApiHandlerConfig } from "./storageConfig.js";

export type { CreateAwsPgApiHandlerConfig };

export function createAwsPgApiHandler(config: CreateAwsPgApiHandlerConfig) {
    return createBaseHandler(storageConfig(config));
}

/**
 * Response-streaming counterpart, for the Lambda function whose Function URL uses
 * `InvokeMode: RESPONSE_STREAM`. Identical storage; only the transport differs.
 */
export function createAwsPgStreamApiHandler(config: CreateAwsPgApiHandlerConfig) {
    return createBaseStreamHandler(storageConfig(config));
}
