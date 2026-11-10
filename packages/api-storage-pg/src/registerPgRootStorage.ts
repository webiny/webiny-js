import type { Knex } from "knex";
import type { Container } from "@webiny/di";
import { registerExtensions } from "@webiny/handler";
import type { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { ApiCoreSqlFeature, registerSQLCore } from "@webiny/api-core-sql";
import { WebsocketsSqlFeature } from "@webiny/api-websockets-sql";
import { registerAuditLogsSqlStorageOperations } from "@webiny/api-audit-logs-sql";
import { HeadlessCmsPgFeature, readPgStorageSettings } from "@webiny/api-headless-cms-pg";
import { registerAcoPgStorageOperations } from "@webiny/api-aco-pg";

export interface PgRootStorageParams {
    knex: Knex;
    tableNamePrefix?: string;
    /** The build params the project was built with: the CMS takes its settings from them. */
    buildParams: BuildParams.Interface;
}

/**
 * The Postgres storage of the Webiny API, registered in the root container. Shared by every
 * transport that runs the API on Postgres (the standalone server and AWS Lambda), so they store
 * data the same way:
 * - core (tenancy, security, users, key-value store, service discovery), websockets and audit logs
 *   on the SQL storage;
 * - the CMS on the Postgres-native storage: entries in a jsonb table with a typed search table;
 * - ACO folder-level permissions from a folder catalog, kept in the same transaction as folder
 *   writes (no background tasks).
 *
 * Identity is not part of it: each transport brings its own (self-hosted auth on the standalone
 * server, the project's identity provider on Lambda).
 */
export async function registerPgRootStorage(
    container: Container,
    params: PgRootStorageParams
): Promise<void> {
    const { knex, tableNamePrefix, buildParams } = params;

    // Also points service discovery at the manifests table (`SqlServiceManifestLoader`).
    ApiCoreSqlFeature.register(container, { knex, tableNamePrefix });
    WebsocketsSqlFeature.register(container, { tableNamePrefix });

    // The `Pg*` build params (`<Infra.Postgres cmsStorage>`), read once for the root storage.
    HeadlessCmsPgFeature.register(container, {
        knex,
        tableNamePrefix,
        settings: readPgStorageSettings(buildParams)
    });

    await registerExtensions(container, [
        registerSQLCore({ knex }),
        // Folder-level permissions from the folder catalog, instead of the task-maintained one.
        registerAcoPgStorageOperations(),
        registerAuditLogsSqlStorageOperations({ knex, tableNamePrefix })
    ]);
}
