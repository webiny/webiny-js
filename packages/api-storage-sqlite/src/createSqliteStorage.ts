import type { Knex } from "knex";
import type { Container } from "@webiny/di";
import { RequestStorage } from "@webiny/api-core";
import {
    ApiCoreSqlFeature,
    runSchemaSetupSteps,
    setSqlServiceManifestLoader,
    SqlConnectionFeature,
    SqlSchemaConfig,
    SqlSchemaSetupRunner,
    type SqlStorage
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

/** Whether the storage's schema is set up. Shared by the storage's root settings and its runner. */
interface SchemaState {
    managed: boolean;
}

/*
 * SQLite has one writer, so setup takes no lock: a plain transaction, so a failure leaves nothing
 * half-made. It creates the tables the lazy checks would: those of core, audit logs, websockets, the
 * CMS (models, groups, entries) and ACO, plus the transport's login tables and any module's in the
 * project's extensions.
 */
class SqliteSchemaSetupRunner implements SqlSchemaSetupRunner.Interface {
    public constructor(
        private readonly root: Container,
        private readonly knex: Knex,
        private readonly tableNamePrefix: string | undefined,
        private readonly state: SchemaState
    ) {}

    public async run(params: SqlSchemaSetupRunner.RunParams): Promise<string[]> {
        const knex = params.knex ?? this.knex;
        const done = await knex.transaction(async trx => {
            return runSchemaSetupSteps({
                root: this.root,
                knex: trx,
                tableNamePrefix: this.tableNamePrefix,
                request: params.request
            });
        });
        this.state.managed = true;
        return done;
    }
}

class SqliteStorage implements SqlStorage {
    public readonly knex: Knex;
    public readonly tableNamePrefix?: string;
    private readonly state: SchemaState = { managed: false };

    public constructor(params: CreateSqliteStorageParams) {
        this.knex = params.knex;
        this.tableNamePrefix = params.tableNamePrefix;
    }

    /*
     * The root gets the connection and its settings, the schema setup runner, and service discovery
     * reads the manifests on the connection. Every storage is registered per request, by
     * `SqliteRequestStorage`.
     */
    public register(container: Container): void {
        SqlConnectionFeature.register(container, {
            knex: this.knex,
            tableNamePrefix: this.tableNamePrefix,
            schemaManaged: () => this.state.managed
        });
        setSqlServiceManifestLoader({
            knex: this.knex,
            tableNamePrefix: this.tableNamePrefix,
            schemaManaged: () => this.state.managed
        });
        container.registerInstance(RequestStorage, SqliteRequestStorage);
        container.registerInstance(
            SqlSchemaSetupRunner,
            new SqliteSchemaSetupRunner(container, this.knex, this.tableNamePrefix, this.state)
        );
    }
}

/**
 * The SQLite storage of the Webiny API, for the standalone server with `<Infra.Sqlite>`. It reads no
 * build params and takes no settings beyond its table prefix. In the root it registers only the
 * connection and its settings, and its `SqlSchemaSetupRunner`; its storages register in each
 * request's container (`RequestStorage`).
 */
export function createSqliteStorage(params: CreateSqliteStorageParams): SqlStorage {
    return new SqliteStorage(params);
}
