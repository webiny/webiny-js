/**
 * Webiny API handler for AWS Lambda with DynamoDB storage.
 *
 * Thin variant over the storage-agnostic base (@webiny/api-event-handler-aws): supplies the DynamoDB
 * storage wiring (core + CMS + audit-logs + ACO + websockets storage operations). No OpenSearch.
 *
 * Two entry points share that wiring: the buffered API Gateway handler and the response-streaming
 * Function URL handler. They are separate Lambda functions built from the same bundle.
 */
import {
    createWebinyApiHandler as createBaseHandler,
    createWebinyStreamApiHandler as createBaseStreamHandler,
    type CreateWebinyApiHandlerConfig as BaseConfig
} from "@webiny/api-event-handler-aws";
import { ApiCoreDdbFeature } from "@webiny/api-core-ddb";
import { HeadlessCmsDdbFeature } from "@webiny/api-headless-cms-ddb";
import { AuditLogsDdbFeature } from "@webiny/api-audit-logs-ddb";
import { AcoDdbFeature } from "@webiny/api-aco-ddb";
import { WebsocketsDdbFeature } from "@webiny/api-websockets-ddb";

export type CreateAwsDdbApiHandlerConfig = Pick<BaseConfig, "extensions" | "documentClient">;

const registerRootStorage: BaseConfig["registerRootStorage"] = (container, { documentClient }) => {
    ApiCoreDdbFeature.register(container, { documentClient });
    HeadlessCmsDdbFeature.register(container);
    AuditLogsDdbFeature.register(container, {});
    AcoDdbFeature.register(container);
    WebsocketsDdbFeature.register(container);
};

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
