import type { Knex } from "knex";
import { Container } from "@webiny/di";
import { RequestStorage } from "@webiny/api-core";
import {
    ApiCoreSqlFeature,
    runSqlSchemaSetup,
    setSqlServiceManifestLoader,
    SqlConnectionFeature,
    SqlSchemaConfig,
    type SqlStorage,
    type SqlStorageExtensions
} from "@webiny/api-core-sql";
import { HeadlessCmsSqlFeature } from "@webiny/api-headless-cms-sql";
import { AcoSqlFeature } from "@webiny/api-aco-sql";
import { AuditLogsSqlFeature } from "@webiny/api-audit-logs-sql";
import { WebsocketsSqlFeature } from "@webiny/api-websockets-sql";

export interface CreateSqliteStorageParams {
    /** The connection: `createSqliteConnection()`. */
    knex: Knex;
    tableNamePrefix?: string;
}

/*
 * The storages of a request: SQL core (tenancy, security, users, key-value store), the SQL CMS, ACO
 * folder-level permissions, audit logs and the websocket connection registry. The SQL CMS has no
 * settings, so it is part of the storage rather than a module the project adds. Each runs on the
 * connection and table settings in the root.
 */
const SqliteRequestStorage: RequestStorage.Interface = {
    register(container) {
        ApiCoreSqlFeature.register(container);
        HeadlessCmsSqlFeature.register(container, {
            tableNamePrefix: container.resolve(SqlSchemaConfig).tableNamePrefix
        });
        AcoSqlFeature.register(container);
        AuditLogsSqlFeature.register(container);
        WebsocketsSqlFeature.register(container);
    }
};

class SqliteStorage implements SqlStorage {
    public readonly knex: Knex;
    public readonly tableNamePrefix?: string;
    private schemaManaged = false;

    public constructor(params: CreateSqliteStorageParams) {
        this.knex = params.knex;
        this.tableNamePrefix = params.tableNamePrefix;
    }

    /*
     * The root gets the connection and its settings, and service discovery reads the manifests on
     * it. Every storage is registered per request, by `SqliteRequestStorage`.
     */
    public register(container: Container): void {
        const connection = {
            knex: this.knex,
            tableNamePrefix: this.tableNamePrefix,
            schemaManaged: this.schemaManaged
        };
        SqlConnectionFeature.register(container, connection);
        setSqlServiceManifestLoader(connection);
        container.registerInstance(RequestStorage, SqliteRequestStorage);
    }

    /*
     * SQLite has one writer, so setup takes no lock, and it runs on the connection itself rather than
     * in one transaction. It creates the tables the lazy checks would: those of core, audit logs,
     * websockets, the CMS (models, groups, entries) and ACO, plus any module's in the project's
     * extensions.
     */
    public async setupSchema(extensions?: SqlStorageExtensions): Promise<string[]> {
        const container = new Container();
        SqlConnectionFeature.register(container, {
            knex: this.knex,
            tableNamePrefix: this.tableNamePrefix,
            schemaManaged: false
        });
        SqliteRequestStorage.register(container);
        const done = await runSqlSchemaSetup({ container, extensions });
        this.schemaManaged = true;
        return done;
    }
}

/**
 * The SQLite storage of the Webiny API, for the standalone server with `<Infra.Sqlite>`. It reads no
 * build params and takes no settings beyond its table prefix. In the root it registers only the
 * connection and its settings; its storages register in each request's container
 * (`RequestStorage`).
 */
export function createSqliteStorage(params: CreateSqliteStorageParams): SqlStorage {
    return new SqliteStorage(params);
}
