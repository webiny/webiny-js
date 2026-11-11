import { KnexClient, isSqlSchemaManaged } from "@webiny/api-core-sql";
import { TableNameResolver } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { PgSchema as Abstraction } from "./abstractions.js";
import { createSchemaSql } from "./createSchemaSql.js";
import { PgStorageConfig } from "~/features/config/abstractions.js";
import { scopeCache } from "~/features/scopes/scopeCache.js";
import { clearEstimateCache } from "~/features/search/estimateCache.js";

class PgSchemaImpl implements Abstraction.Interface {
    private readonly tables: Abstraction.Tables;
    private initPromise?: Promise<void>;

    public constructor(
        private readonly knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private readonly config: PgStorageConfig.Interface
    ) {
        this.tables = {
            entries: tableNameResolver.resolve("entries"),
            search: tableNameResolver.resolve("search"),
            scopes: tableNameResolver.resolve("scopes"),
            values: tableNameResolver.resolve("values"),
            valueDeltas: tableNameResolver.resolve("value_deltas")
        };
        // Test setups drop all tables between tests and call reset() on every registered manager.
        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as Abstraction.Interface[];
        managers.push(this);
    }

    public getTables(): Abstraction.Tables {
        return this.tables;
    }

    public reset(): void {
        this.initPromise = undefined;
        scopeCache.clear();
        clearEstimateCache();
    }

    public ensure(): Promise<void> {
        if (isSqlSchemaManaged()) {
            // Created at deploy time: no DDL (and no advisory lock) on a cold start.
            return Promise.resolve();
        }
        if (!this.initPromise) {
            this.initPromise = this.create().catch(err => {
                this.initPromise = undefined;
                throw err;
            });
        }
        return this.initPromise;
    }

    public setup(): Promise<void> {
        return this.create();
    }

    private async create(): Promise<void> {
        const statements = createSchemaSql(this.tables, { slotIndexes: this.config.slotIndexes });
        await this.knex.client.transaction(async trx => {
            // Serialize DDL across processes; IF NOT EXISTS alone races on catalog inserts.
            await trx.raw("SELECT pg_advisory_xact_lock(hashtext(?))", [this.tables.search]);
            for (const sql of statements) {
                await trx.raw(sql);
            }
        });
    }
}

export const PgSchemaManager = Abstraction.createImplementation({
    implementation: PgSchemaImpl,
    dependencies: [KnexClient, TableNameResolver, PgStorageConfig]
});
