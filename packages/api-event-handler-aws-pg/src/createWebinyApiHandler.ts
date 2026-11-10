/**
 * Webiny API handler for AWS Lambda with Postgres storage (Aurora PostgreSQL, directly or through
 * RDS Proxy). No DynamoDB and no OpenSearch.
 *
 * Thin variant over the storage-agnostic base (@webiny/api-event-handler-aws): supplies the Postgres
 * storage of `@webiny/api-storage-pg`, the same storage the standalone Postgres server uses. Identity
 * stays with the base (the project's identity provider extension, e.g. Cognito).
 *
 * Two entry points share that wiring: the buffered API Gateway handler and the response-streaming
 * Function URL handler. They are separate Lambda functions built from the same bundle. The tables
 * are created at deploy time by `createAwsPgMigrateHandler`.
 */
import type { Knex } from "knex";
import {
    createWebinyApiHandler as createBaseHandler,
    createWebinyStreamApiHandler as createBaseStreamHandler,
    type CreateWebinyApiHandlerConfig as BaseConfig
} from "@webiny/api-event-handler-aws";
import { getSqlTablePrefix } from "@webiny/api-core-sql";
import { registerPgRootStorage } from "@webiny/api-storage-pg";
import { getLambdaPgKnex } from "~/connection/createLambdaPgConnection.js";

export interface CreateAwsPgApiHandlerConfig extends Pick<BaseConfig, "extensions"> {
    /**
     * Knex client for Postgres. Defaults to the execution environment's connection
     * (`getLambdaPgKnex()`, from the `WEBINY_PG_*` env vars). Injectable so tests can point the
     * handler at a local Postgres.
     */
    knex?: Knex;
    /** Table name prefix. Defaults to `WEBINY_SQL_TABLE_PREFIX`. */
    tableNamePrefix?: string;
}

/**
 * The storage half of the composition, shared by the buffered and the response-streaming entry points
 * so the two Lambda functions built from this bundle cannot drift.
 */
function storageConfig(
    config: CreateAwsPgApiHandlerConfig
): Pick<BaseConfig, "extensions" | "registerRootStorage"> {
    return {
        extensions: config.extensions,
        registerRootStorage: async (container, { readBuildParams }) => {
            // Built here, in `root`, rather than at factory time: one bundle exports both the buffered
            // and the streaming handler, and `root` runs once, lazily.
            await registerPgRootStorage(container, {
                knex: config.knex ?? getLambdaPgKnex(),
                tableNamePrefix: config.tableNamePrefix ?? (getSqlTablePrefix() || undefined),
                buildParams: await readBuildParams()
            });
        }
    };
}

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
