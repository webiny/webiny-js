/**
 * EXPERIMENTAL — Webiny API handler for the self-hosted Node server transport with DynamoDB storage.
 *
 * Thin variant over the transport base (@webiny/api-event-handler-server): supplies the complete
 * root storage wiring — the DB feature + the DynamoDB storage operations (core + CMS + audit-logs +
 * ACO + websockets). Mirrors @webiny/api-event-handler-aws-ddb, but the server base bakes in no DB
 * assumption, so this variant registers DbFeature itself.
 *
 * ⚠️ Inherits the server transport's not-yet-deployable status (missing Node routing terminal +
 * auth/tenant loaders — see @webiny/api-event-handler-server). A SQL variant is expected to follow.
 */
import { getDocumentClient } from "@webiny/aws-sdk/client-dynamodb/index.js";
import { DbFeature } from "@webiny/handler-db";
import {
    createWebinyApiHandler as createBaseHandler,
    type CreateWebinyApiHandlerConfig as BaseConfig
} from "@webiny/api-event-handler-server";
import { ApiCoreDdbFeature } from "@webiny/api-core-ddb";
import { HeadlessCmsDdbFeature } from "@webiny/api-headless-cms-ddb";
import { AuditLogsDdbFeature } from "@webiny/api-audit-logs-ddb";
import { AcoDdbFeature } from "@webiny/api-aco-ddb";
import { WebsocketsDdbFeature } from "@webiny/api-websockets-ddb";

export type CreateWebinyApiHandlerConfig = Pick<BaseConfig, "extensions"> & {
    /**
     * DynamoDB document client. Defaults to the standard client (`getDocumentClient()`). Injectable
     * so integration tests can point the handler at a local (dynalite) DynamoDB.
     */
    documentClient?: ReturnType<typeof getDocumentClient>;
    /**
     * DynamoDB table name. Defaults to `process.env.DB_TABLE`.
     */
    dbTable?: string;
};

export function createWebinyApiHandler(config: CreateWebinyApiHandlerConfig) {
    const documentClient = config.documentClient ?? getDocumentClient();
    const table = config.dbTable ?? process.env.DB_TABLE;

    return createBaseHandler({
        extensions: config.extensions,
        registerRootStorage: container => {
            DbFeature.register(container, { documentClient, table });
            ApiCoreDdbFeature.register(container, { documentClient });
            HeadlessCmsDdbFeature.register(container);
            AuditLogsDdbFeature.register(container, {});
            AcoDdbFeature.register(container);
            WebsocketsDdbFeature.register(container);
        }
    });
}
