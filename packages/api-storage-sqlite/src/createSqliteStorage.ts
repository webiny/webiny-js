import type { Knex } from "knex";
import { Container } from "@webiny/di";
import { registerExtensions } from "@webiny/handler";
import {
    ApiCoreSqlFeature,
    registerSQLCore,
    runSqlSchemaSetup,
    type SqlStorage,
    type SqlStorageExtensions
} from "@webiny/api-core-sql";
import { HeadlessCmsSqlFeature } from "@webiny/api-headless-cms-sql";
import { registerAcoSqlStorageOperations } from "@webiny/api-aco-sql";
import { registerAuditLogsSqlStorageOperations } from "@webiny/api-audit-logs-sql";
import { WebsocketsSqlFeature } from "@webiny/api-websockets-sql";

export interface CreateSqliteStorageParams {
    /** The connection: `createSqliteConnection()`. */
    knex: Knex;
    tableNamePrefix?: string;
}

interface RegisterParams {
    knex: Knex;
    tableNamePrefix?: string;
    schemaManaged: boolean;
}

/*
 * SQL core (tenancy, security, users, key-value store, service discovery), the SQL CMS, ACO
 * folder-level permissions, audit logs and websockets. The SQL CMS has no settings, so it is part of
 * the storage rather than a module the project adds.
 */
async function registerStorage(container: Container, params: RegisterParams): Promise<void> {
    const { knex, tableNamePrefix, schemaManaged } = params;

    ApiCoreSqlFeature.register(container, { knex, tableNamePrefix, schemaManaged });
    WebsocketsSqlFeature.register(container, { tableNamePrefix });
    HeadlessCmsSqlFeature.register(container, { knex, tableNamePrefix });

    await registerExtensions(container, [
        registerSQLCore({ knex }),
        registerAcoSqlStorageOperations({ knex, tableNamePrefix, schemaManaged }),
        registerAuditLogsSqlStorageOperations({ knex, tableNamePrefix, schemaManaged })
    ]);
}

class SqliteStorage implements SqlStorage {
    public readonly knex: Knex;
    public readonly tableNamePrefix?: string;
    private schemaManaged = false;

    public constructor(params: CreateSqliteStorageParams) {
        this.knex = params.knex;
        this.tableNamePrefix = params.tableNamePrefix;
    }

    public register(container: Container): Promise<void> {
        return registerStorage(container, {
            knex: this.knex,
            tableNamePrefix: this.tableNamePrefix,
            schemaManaged: this.schemaManaged
        });
    }

    /*
     * SQLite has one writer, so setup takes no lock, and it runs on the connection itself rather than
     * in one transaction. It creates the tables the lazy checks would: those of core, audit logs,
     * websockets, the CMS (models, groups, entries) and ACO, plus any module's in the project's
     * extensions.
     */
    public async setupSchema(extensions?: SqlStorageExtensions): Promise<string[]> {
        const container = new Container();
        await registerStorage(container, {
            knex: this.knex,
            tableNamePrefix: this.tableNamePrefix,
            schemaManaged: false
        });
        const done = await runSqlSchemaSetup({ container, extensions });
        this.schemaManaged = true;
        return done;
    }
}

/**
 * The SQLite storage of the Webiny API, for the standalone server with `<Infra.Sqlite>`. It reads no
 * build params and takes no settings beyond its table prefix.
 */
export function createSqliteStorage(params: CreateSqliteStorageParams): SqlStorage {
    return new SqliteStorage(params);
}
