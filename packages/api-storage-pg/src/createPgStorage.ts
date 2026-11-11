import type { Knex } from "knex";
import { Container } from "@webiny/di";
import { RequestStorage } from "@webiny/api-core";
import {
    ApiCoreSqlFeature,
    runSqlSchemaSetup,
    setSqlServiceManifestLoader,
    SqlConnectionFeature,
    type SqlStorage,
    type SqlStorageExtensions
} from "@webiny/api-core-sql";
import { WebsocketsSqlFeature } from "@webiny/api-websockets-sql";
import { AuditLogsSqlFeature } from "@webiny/api-audit-logs-sql";

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

/*
 * The storages of a request: SQL core (tenancy, security, users, key-value store), audit logs and
 * the websocket connection registry. Each runs on the connection and table settings in the root.
 */
const PgRequestStorage: RequestStorage.Interface = {
    register(container) {
        ApiCoreSqlFeature.register(container);
        AuditLogsSqlFeature.register(container);
        WebsocketsSqlFeature.register(container);
    }
};

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

    /*
     * The root gets the connection and its settings, and service discovery reads the manifests on
     * it. Every storage is registered per request, by `PgRequestStorage`.
     */
    public register(container: Container): void {
        const connection = {
            knex: this.knex,
            tableNamePrefix: this.tableNamePrefix,
            schemaManaged: this.schemaManaged
        };
        SqlConnectionFeature.register(container, connection);
        setSqlServiceManifestLoader(connection);
        container.registerInstance(RequestStorage, PgRequestStorage);
    }

    /*
     * It all runs in one transaction that first takes an advisory lock, so several processes starting
     * together run it one after another: the second finds everything in place. A failure rolls the
     * whole setup back. The parts that lock on their own (the CMS and the folder catalog) nest in this
     * transaction, so they don't wait for themselves.
     *
     * The setup's container holds the connection (the transaction) and a request's storages, and the
     * project's extensions are applied to it, so the modules the API runs (the CMS, the folder
     * catalog) set up their tables with their settings.
     */
    public async setupSchema(extensions?: SqlStorageExtensions): Promise<string[]> {
        const done = await this.knex.transaction(async trx => {
            await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [
                setupLockKey(this.tableNamePrefix)
            ]);
            const container = new Container();
            SqlConnectionFeature.register(container, {
                knex: trx,
                tableNamePrefix: this.tableNamePrefix,
                schemaManaged: false
            });
            PgRequestStorage.register(container);
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
 * In the root it registers only the connection and its settings; its storages register in each
 * request's container (`RequestStorage`).
 *
 * Identity is not part of it: each transport brings its own (self-hosted auth on the standalone
 * server, the project's identity provider on Lambda).
 */
export function createPgStorage(params: CreatePgStorageParams): SqlStorage {
    return new PgStorage(params);
}
