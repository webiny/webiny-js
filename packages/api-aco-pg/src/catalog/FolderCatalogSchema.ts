import type { Knex } from "knex";
import { createAbstraction } from "@webiny/feature/api";
import {
    getConnectionKey,
    getSchemaMemory,
    KnexClient,
    SqlSchemaConfig,
    type ISchemaMemory
} from "@webiny/api-core-sql";
import { TableNameResolverConfig } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";

export interface IFolderCatalogTables {
    /** One row per folder: its place in the tree, by ids and by slugs. */
    folders: string;
    /** The folder's own (explicit) permissions, one row per target. Inherited ones are not stored. */
    grants: string;
    /** Tenants whose catalog has been built from their folder entries. */
    state: string;
}

export interface IFolderCatalogSchema {
    /**
     * Creates the catalog tables once per process, on a connection of its own; a no-op when the
     * schema is managed (`SqlSchemaConfig`).
     */
    ensure(): Promise<void>;
    /** Creates the catalog tables, whatever the mode (the storage's schema setup). */
    setup(): Promise<void>;
    /**
     * The same, inside the caller's transaction. For write paths that already hold a transaction:
     * waiting for a second connection there can wait forever on a small pool.
     */
    ensureIn(trx: Knex.Transaction): Promise<void>;
    getTables(): IFolderCatalogTables;
    /** Whether this process has already seen the tenant's catalog built. */
    isKnownBuilt(tenant: string): boolean;
    rememberBuilt(tenant: string): void;
    /** Forgets that the tables exist (test setups drop all tables between tests). */
    reset(): void;
}

export const FolderCatalogSchema = createAbstraction<IFolderCatalogSchema>(
    "Aco/Pg/FolderCatalogSchema"
);

export namespace FolderCatalogSchema {
    export type Interface = IFolderCatalogSchema;
    export type Tables = IFolderCatalogTables;
}

const createSchemaSql = ({ folders, grants, state }: IFolderCatalogTables): string[] => [
    /*
     * `id_path` lists the ids from the root folder down to this one, so a subtree is every row
     * whose `id_path` contains the folder's id (GIN), and a move rewrites the prefix of each. It is
     * a text array rather than `ltree`, so ids of any form work and no extension is needed.
     * `slug_path` is the folder's `path` as the API reports it (e.g. `root/a/b`).
     */
    `CREATE TABLE IF NOT EXISTS "${folders}" (
    tenant     text NOT NULL,
    id         text COLLATE "C" NOT NULL,
    type       text NOT NULL,
    slug       text NOT NULL,
    parent_id  text COLLATE "C",
    id_path    text[] NOT NULL,
    slug_path  text COLLATE "C" NOT NULL,
    PRIMARY KEY (tenant, id)
)`,
    `CREATE INDEX IF NOT EXISTS "${folders}_id_path" ON "${folders}" USING gin (id_path)`,
    `CREATE INDEX IF NOT EXISTS "${folders}_parent" ON "${folders}" (tenant, type, parent_id)`,
    `CREATE INDEX IF NOT EXISTS "${folders}_slug_path" ON "${folders}" (tenant, type, slug_path)`,
    `CREATE TABLE IF NOT EXISTS "${grants}" (
    tenant     text NOT NULL,
    folder_id  text COLLATE "C" NOT NULL,
    position   integer NOT NULL,
    target     text NOT NULL,
    level      text NOT NULL,
    PRIMARY KEY (tenant, folder_id, position)
)`,
    /* "Who has access": grants by target. */
    `CREATE INDEX IF NOT EXISTS "${grants}_target" ON "${grants}" (tenant, target)`,
    `CREATE TABLE IF NOT EXISTS "${state}" (
    tenant    text PRIMARY KEY,
    built_on  timestamptz NOT NULL DEFAULT now()
)`
];

/*
 * `<prefix>_webiny_aco_<name>_<suffix>`: the project's table prefix and suffix, as for the CMS tables
 * (`webiny_cms_<name>`), under the ACO name.
 */
const resolveAcoTableName = (config: TableNameResolverConfig.Interface, name: string): string => {
    const sanitize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const prefix = config.tableNamePrefix ? `${sanitize(config.tableNamePrefix)}_` : "";
    const suffix = config.tableNameSuffix ? `_${sanitize(config.tableNameSuffix)}` : "";
    return `${prefix}webiny_aco_${name}${suffix}`;
};

class FolderCatalogSchemaImpl implements FolderCatalogSchema.Interface {
    private readonly tables: IFolderCatalogTables;
    /*
     * Whether this process has created the tables, and the tenants it has seen built. Process-wide
     * rather than per instance: the module is registered per request, with the project's extensions.
     * Test setups drop all tables between tests and reset every memory.
     */
    private readonly memory: ISchemaMemory;

    public constructor(
        private readonly knex: KnexClient.Interface,
        tableNameConfig: TableNameResolverConfig.Interface,
        private readonly schemaConfig?: SqlSchemaConfig.Interface
    ) {
        this.tables = {
            folders: resolveAcoTableName(tableNameConfig, "folders"),
            grants: resolveAcoTableName(tableNameConfig, "folder_grants"),
            state: resolveAcoTableName(tableNameConfig, "folder_catalog_state")
        };
        // One memory per database and table set.
        this.memory = getSchemaMemory(
            `aco.pg.folderCatalog:${getConnectionKey(knex.client)}:${this.tables.folders}`
        );
    }

    public getTables(): IFolderCatalogTables {
        return this.tables;
    }

    public isKnownBuilt(tenant: string): boolean {
        return this.memory.known.has(tenant);
    }

    public rememberBuilt(tenant: string): void {
        this.memory.known.add(tenant);
    }

    public reset(): void {
        this.memory.reset();
    }

    public ensure(): Promise<void> {
        if (this.schemaConfig?.isManaged()) {
            // Set up before the API took traffic: no DDL (and no advisory lock) on a cold start.
            return Promise.resolve();
        }
        return this.memory.once(() => this.create());
    }

    public setup(): Promise<void> {
        return this.create();
    }

    public async ensureIn(trx: Knex.Transaction): Promise<void> {
        if (this.memory.isReady() || this.schemaConfig?.isManaged()) {
            return;
        }
        const generation = this.memory.generation;
        await this.createIn(trx);
        // Known to exist only once the caller's transaction commits (and not after a reset).
        trx.executionPromise
            .then(() => {
                if (this.memory.generation === generation) {
                    this.memory.markReady();
                }
            })
            .catch(() => undefined);
    }

    private async create(): Promise<void> {
        await this.knex.client.transaction(trx => this.createIn(trx));
        this.memory.markReady();
    }

    private async createIn(trx: Knex.Transaction): Promise<void> {
        // Serialize DDL across processes; IF NOT EXISTS alone races on catalog inserts.
        await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [this.tables.folders]);
        for (const sql of createSchemaSql(this.tables)) {
            await trx.raw(sql);
        }
    }
}

export const FolderCatalogSchemaImplementation = FolderCatalogSchema.createImplementation({
    implementation: FolderCatalogSchemaImpl,
    dependencies: [KnexClient, TableNameResolverConfig, [SqlSchemaConfig, { optional: true }]]
});
