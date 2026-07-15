/**
 * Webiny API handler for the self-hosted Node server transport with SQL storage.
 *
 * Thin variant over the transport base (@webiny/api-event-handler-server): supplies the SQL storage
 * wiring AND the self-hosted identity provider (JWT IdP + SQL credential storage). The SQL storage
 * layer is currently a MIX: `ApiCoreSqlFeature` / `WebsocketsSqlFeature` are DI Features (like the
 * AWS DDB storage), while the CMS / ACO / audit-logs SQL storage operations are still legacy
 * `register*StorageOperations` RegisterExtensionPlugins, applied here via `registerExtensions`. The
 * storage composition mirrors the api-headless-cms-sql test setup (registerSQLCore +
 * registerSqlStorageOperations + ...).
 *
 * The caller supplies the Knex client (there is no single canonical connection for a self-hosted DB).
 * The JWT signing secret is configured via `<SelfHostedAuth signingSecret>` (BuildParams).
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
import { SelfHostedAuthApiFeature } from "@webiny/self-hosted-auth";
import { SelfHostedAuthSqlFeature } from "@webiny/self-hosted-auth-sql";

export type CreateSqlApiHandlerConfig = Pick<BaseConfig, "extensions"> & {
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

export function createSqlApiHandler(config: CreateSqlApiHandlerConfig) {
    const { knex, tableNamePrefix } = config;

    return createBaseHandler({
        extensions: config.extensions,
        registerRootStorage: async container => {
            // Clean DI Features: SQL core storage-ops factory + websockets storage.
            ApiCoreSqlFeature.register(container, { knex, tableNamePrefix });
            WebsocketsSqlFeature.register(container, { tableNamePrefix });

            // Identity provider: the self-hosted JWT IdP + its SQL credential storage. Registered in
            // the root so the RequestIdentityLoader (driven by NodeHttpIdentityLoaderDecorator) can
            // resolve it. SelfHostedAuthSqlFeature supplies CredentialsStorageOperations over Knex.
            SelfHostedAuthSqlFeature.register(container, { knex, tableNamePrefix });
            // The JWT signing secret comes from <SelfHostedAuth signingSecret> (BuildParams).
            SelfHostedAuthApiFeature.register(container);

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
