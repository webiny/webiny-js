/**
 * Webiny API handler for the standalone Node server transport with SQL storage.
 *
 * Thin variant over the transport base (@webiny/api-event-handler-standalone): supplies the SQL storage
 * wiring AND the self-hosted identity provider (JWT IdP + SQL credential storage). CMS, core, and
 * websockets storage are DI Features registered directly on the container. ACO and audit-logs
 * remain legacy RegisterExtensionPlugins applied via `registerExtensions`.
 *
 * The caller supplies the Knex client (there is no single canonical connection for a standalone DB).
 * The JWT signing secret is read from `WEBINY_SELF_HOSTED_AUTH_SECRET` when the handler is created.
 */
import type { Knex } from "knex";
import type { Container } from "@webiny/di";
import { registerExtensions, type RegisterExtensionPlugin } from "@webiny/handler";
import {
    createWebinyApiHandler as createBaseHandler,
    type CreateWebinyApiHandlerConfig as BaseConfig
} from "@webiny/api-event-handler-standalone";
import { ApiCoreSqlFeature, registerSQLCore } from "@webiny/api-core-sql";
import { HeadlessCmsSqlFeature } from "@webiny/api-headless-cms-sql";
import { registerAcoSqlStorageOperations } from "@webiny/api-aco-sql";
import { registerAuditLogsSqlStorageOperations } from "@webiny/api-audit-logs-sql";
import { WebsocketsSqlFeature } from "@webiny/api-websockets-sql";
import { SelfHostedAuthApiFeature } from "@webiny/self-hosted-auth";
import { readSigningSecret } from "~/readSigningSecret.js";
import { SelfHostedAuthSqlFeature } from "@webiny/self-hosted-auth-sql";
import type { BuildParams } from "@webiny/api-core/features/buildParams/index.js";

export interface ContentStorageParams {
    knex: Knex;
    tableNamePrefix?: string;
    /** The build params the project was built with, for storage settings. */
    buildParams: BuildParams.Interface;
}

/**
 * Where content lives: the CMS storage and the ACO folder-level permissions that go with it.
 * Everything else (core, websockets, audit logs, self-hosted auth) uses the SQL storage either way.
 */
export interface ContentStorage {
    /** DI features, registered on the root container. */
    register(container: Container, params: ContentStorageParams): void;
    /** Extension plugins, applied to the root container after the core SQL storage. */
    extensions(params: ContentStorageParams): RegisterExtensionPlugin[];
}

/** The generic SQL storage: runs on SQLite and Postgres alike. */
export const sqlContentStorage: ContentStorage = {
    register(container, { knex, tableNamePrefix }) {
        HeadlessCmsSqlFeature.register(container, { knex, tableNamePrefix });
    },
    extensions({ knex, tableNamePrefix }) {
        return [registerAcoSqlStorageOperations({ knex, tableNamePrefix })];
    }
};

export type CreateSqlApiHandlerConfig = Pick<BaseConfig, "extensions"> & {
    /**
     * Knex client for the SQL database. Required — the caller owns the connection (there is no single
     * canonical standalone DB connection to default to).
     */
    knex: Knex;
    /**
     * Optional table-name prefix, threaded to every SQL storage operation.
     */
    tableNamePrefix?: string;
    /** CMS and ACO storage. Defaults to the generic SQL storage. */
    contentStorage?: ContentStorage;
};

export function createSqlApiHandler(config: CreateSqlApiHandlerConfig) {
    const { knex, tableNamePrefix, contentStorage = sqlContentStorage } = config;
    // Read once, so a missing secret stops the server at boot instead of failing the first login.
    const signingSecret = readSigningSecret(process.env);

    return createBaseHandler({
        extensions: config.extensions,
        registerRootStorage: async (container, { buildParams }) => {
            // Clean DI Features: SQL core storage-ops factory + websockets storage.
            ApiCoreSqlFeature.register(container, { knex, tableNamePrefix });
            WebsocketsSqlFeature.register(container, { tableNamePrefix });

            // Identity provider: the self-hosted JWT IdP + its SQL credential storage. Registered in
            // the root so the RequestIdentityLoader (driven by NodeHttpIdentityLoaderDecorator) can
            // resolve it. SelfHostedAuthSqlFeature supplies the credential storage operations over Knex.
            SelfHostedAuthSqlFeature.register(container, { knex, tableNamePrefix });
            SelfHostedAuthApiFeature.register(container, { signingSecret });

            contentStorage.register(container, { knex, tableNamePrefix, buildParams });

            await registerExtensions(container, [
                registerSQLCore({ knex }),
                ...contentStorage.extensions({ knex, tableNamePrefix, buildParams }),
                registerAuditLogsSqlStorageOperations({ knex, tableNamePrefix })
            ]);
        }
    });
}
