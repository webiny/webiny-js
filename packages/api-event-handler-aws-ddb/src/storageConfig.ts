import type { CreateWebinyApiHandlerConfig as BaseConfig } from "@webiny/api-event-handler-aws";
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
 * The storage half of the composition (core + CMS + audit-logs + ACO + websockets storage
 * operations), shared by the buffered, streaming and web function entry points so they cannot drift.
 */
export function storageConfig(
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
