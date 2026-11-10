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
import { WebsocketsSqlFeature } from "@webiny/api-websockets-sql";
import { registerAuditLogsSqlStorageOperations } from "@webiny/api-audit-logs-sql";

export interface CreatePgStorageParams {
    /** The connection: `createPgConnection()` on a server, `createLambdaPgConnection()` on Lambda. */
    knex: Knex;
    tableNamePrefix?: string;
    /**
     * The schema was set up before the API took traffic (by a deploy-time `setupSchema()`), so no
     * part of the storage checks for or creates tables at runtime. Off by default: the storage
     * registers schema-managed only after its own `setupSchema()` succeeded, and otherwise checks
     * and creates each table on first use.
     */
    schemaManaged?: boolean;
}

/** What the API on Postgres can't run without: the CMS storage is a module the project adds. */
const REQUIRED_MODULES = [
    {
        name: "cms",
        message:
            "The Postgres storage has no CMS storage: add <HeadlessCmsPg /> (from @webiny/api-headless-cms-pg/project) to webiny.config.tsx."
    }
];

interface RegisterParams {
    knex: Knex;
    tableNamePrefix?: string;
    schemaManaged: boolean;
}

/*
 * SQL core (tenancy, security, users, key-value store, service discovery), websockets and audit
 * logs, plus what the modules on the storage find in the container: the connection (`KnexClient`),
 * the table prefix and the schema-managed setting (`SqlSchemaConfig`).
 */
async function registerStorage(container: Container, params: RegisterParams): Promise<void> {
    const { knex, tableNamePrefix, schemaManaged } = params;

    // Also points service discovery at the manifests table (`SqlServiceManifestLoader`).
    ApiCoreSqlFeature.register(container, { knex, tableNamePrefix, schemaManaged });
    WebsocketsSqlFeature.register(container, { tableNamePrefix });

    await registerExtensions(container, [
        registerSQLCore({ knex }),
        registerAuditLogsSqlStorageOperations({ knex, tableNamePrefix, schemaManaged })
    ]);
}

/**
 * The advisory lock every schema setup of one storage takes. Keyed by the table prefix, so storages
 * of different prefixes in one database don't wait for each other.
 */
const setupLockKey = (tableNamePrefix?: string): string => {
    return `${tableNamePrefix ?? ""}webiny_schema_setup`;
};

class PgStorage implements SqlStorage {
    public readonly knex: Knex;
    public readonly tableNamePrefix?: string;
    private schemaManaged: boolean;

    public constructor(params: CreatePgStorageParams) {
        this.knex = params.knex;
        this.tableNamePrefix = params.tableNamePrefix;
        this.schemaManaged = params.schemaManaged === true;
    }

    public register(container: Container): Promise<void> {
        return registerStorage(container, {
            knex: this.knex,
            tableNamePrefix: this.tableNamePrefix,
            schemaManaged: this.schemaManaged
        });
    }

    /*
     * It all runs in one transaction that first takes an advisory lock, so several processes starting
     * together run it one after another: the second finds everything in place. A failure rolls the
     * whole setup back. The parts that lock on their own (the CMS and the folder catalog) nest in this
     * transaction, so they don't wait for themselves.
     *
     * The storage is registered in a container of its own, on that transaction, and the project's
     * extensions are applied to it, so the modules the API runs (the CMS, the folder catalog) set up
     * their tables with their settings.
     *
     * Like `register()`, it points service discovery at the connection it runs on; `register()`,
     * which a transport calls after it, points it back.
     */
    public async setupSchema(extensions?: SqlStorageExtensions): Promise<string[]> {
        const done = await this.knex.transaction(async trx => {
            await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [
                setupLockKey(this.tableNamePrefix)
            ]);
            const container = new Container();
            await registerStorage(container, {
                knex: trx,
                tableNamePrefix: this.tableNamePrefix,
                schemaManaged: false
            });
            return runSqlSchemaSetup({ container, extensions, required: REQUIRED_MODULES });
        });
        this.schemaManaged = true;
        return done;
    }
}

/**
 * The Postgres SQL storage of the Webiny API, shared by every transport that runs it on Postgres
 * (the standalone server and AWS Lambda): SQL core, websockets and audit logs. Generic: it holds no
 * CMS and no ACO. Those are modules the project adds with its extensions (`<HeadlessCmsPg />`,
 * `<AcoPg />`), which run on what the storage registers: the connection, the table prefix and the
 * schema-managed setting. Without the CMS module, `setupSchema()` fails, naming it.
 *
 * Identity is not part of it: each transport brings its own (self-hosted auth on the standalone
 * server, the project's identity provider on Lambda).
 */
export function createPgStorage(params: CreatePgStorageParams): SqlStorage {
    return new PgStorage(params);
}
