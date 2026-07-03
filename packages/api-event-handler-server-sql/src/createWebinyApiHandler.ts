/**
 * EXPERIMENTAL — Webiny API handler for the self-hosted Node server transport with SQL storage.
 *
 * Thin variant over the transport base (@webiny/api-event-handler-server): supplies the SQL storage
 * wiring. The SQL storage layer is currently a MIX: `ApiCoreSqlFeature` / `WebsocketsSqlFeature` are
 * DI Features (like the AWS DDB storage), while the CMS / ACO /
 * audit-logs SQL storage operations are still legacy `register*StorageOperations` RegisterExtensionPlugins,
 * applied here via `registerExtensions`. The composition mirrors the only existing reference — the
 * api-headless-cms-sql test setup (registerSQLCore + registerSqlStorageOperations + ...).
 *
 * The caller supplies the Knex client (there is no single canonical connection for a self-hosted DB).
 *
 * ⚠️ BUILD-VERIFIED ONLY, NOT RUNTIME-VERIFIED. No SQL-backed API handler has been assembled/run
 * before this; combined with the server transport's not-yet-deployable status (missing Node routing
 * terminal + auth/tenant loaders — see @webiny/api-event-handler-server), this is a scaffold/starting
 * point, not a working deployment. The SQL storage packages finishing their DI-Feature migration
 * would make this a uniform-DI-Feature composition like the AWS DDB storage.
 */
import type { Knex } from "knex";
import { registerExtensions } from "@webiny/handler";
import {
    createWebinyApiHandler as createBaseHandler,
    type CreateWebinyApiHandlerConfig as BaseConfig
} from "@webiny/api-event-handler-server";
import { ApiCoreSqlFeature, registerSQLCore } from "@webiny/api-core-sql";
import { registerSqlStorageOperations } from "@webiny/api-headless-cms-sql";
import { registerAcoSqlStorageOperations } from "@webiny/api-aco-sql";
import { registerAuditLogsSqlStorageOperations } from "@webiny/api-audit-logs-sql";
import { WebsocketsSqlFeature } from "@webiny/api-websockets-sql";

export type CreateWebinyApiHandlerConfig = Pick<BaseConfig, "extensions"> & {
    /**
     * Knex client for the SQL database. Required — the caller owns the connection (there is no single
     * canonical self-hosted DB connection to default to).
     */
    knex: Knex;
    /**
     * Optional table-name prefix, threaded to every SQL storage operation.
     */
    tableNamePrefix?: string;
};

export function createWebinyApiHandler(config: CreateWebinyApiHandlerConfig) {
    const { knex, tableNamePrefix } = config;

    return createBaseHandler({
        extensions: config.extensions,
        registerRootStorage: async container => {
            // Clean DI Features: SQL core storage-ops factory + websockets storage.
            ApiCoreSqlFeature.register(container, { knex, tableNamePrefix });
            WebsocketsSqlFeature.register(container, { tableNamePrefix });

            // Legacy RegisterExtensionPlugins (register-time DI wiring), applied in order.
            // registerSQLCore registers the KnexClient (resolved by the SQL storage ops), so it is
            // applied first.
            await registerExtensions(container, [
                registerSQLCore({ knex }),
                ...registerSqlStorageOperations({ knex, tableNamePrefix }),
                registerAcoSqlStorageOperations({ knex, tableNamePrefix }),
                registerAuditLogsSqlStorageOperations({ knex, tableNamePrefix })
            ]);
        }
    });
}
