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
import { getDocumentClient, type DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { DynamoDBCoreFeature } from "@webiny/db-dynamodb";
import { ApiCoreDdbFeature } from "@webiny/api-core-ddb";
import { HeadlessCmsDdbFeature } from "@webiny/api-headless-cms-ddb";
import { AuditLogsDdbFeature } from "@webiny/api-audit-logs-ddb";
import { AcoDdbFeature } from "@webiny/api-aco-ddb";
import { WebsocketsDdbFeature } from "@webiny/api-websockets-aws/ddb/index.js";

export interface CreateAwsDdbApiHandlerConfig extends Pick<BaseConfig, "extensions"> {
    /**
     * DynamoDB document client. Defaults to the standard AWS client (`getDocumentClient()`).
     * Injectable so integration tests can point the handler at a local (dynalite) DynamoDB.
     */
    documentClient?: DynamoDBDocument;
}

/**
 * The storage half of the composition, shared by the buffered and the response-streaming entry points
 * so the two Lambda functions built from this bundle cannot drift.
 */
function storageConfig(
    config: CreateAwsDdbApiHandlerConfig
): Pick<BaseConfig, "extensions" | "registerRootStorage"> {
    return {
        extensions: config.extensions,
        registerRootStorage: container => {
            // Built here, in `root`, rather than at factory time: one bundle exports both the buffered
            // and the streaming handler, so an eager client would be created twice per cold start.
            // `root` runs once, lazily.
            const documentClient = config.documentClient ?? getDocumentClient();

            DynamoDBCoreFeature.register(container, { documentClient });
            ApiCoreDdbFeature.register(container, { documentClient });
            HeadlessCmsDdbFeature.register(container);
            AuditLogsDdbFeature.register(container, {});
            AcoDdbFeature.register(container);
            WebsocketsDdbFeature.register(container);
        }
    };
}

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
