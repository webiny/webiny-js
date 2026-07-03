import { KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager as EntryTableManagerAbstraction } from "./abstractions.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";

class EntryTableManagerImpl implements EntryTableManagerAbstraction.Interface {
    private readonly knex;
    private readonly tableName;
    private initialized = false;
    private initPromise?: Promise<void>;

    constructor(knex: KnexClient.Interface, tableNameResolver: TableNameResolver.Interface) {
        this.knex = knex;
        this.tableName = tableNameResolver.resolve("entries");

        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as EntryTableManagerAbstraction.Interface[];
        managers.push(this);
    }

    public reset(): void {
        this.initialized = false;
        this.initPromise = undefined;
    }

    public async ensureTable(): Promise<void> {
        if (this.initialized) {
            return;
        }
        // Memoize the in-flight init so concurrent callers (e.g. Promise.all entry creates) share a
        // single hasTable+createTable and don't race into "table already exists". Clear on failure
        // so a later call can retry.
        if (!this.initPromise) {
            this.initPromise = this.doEnsureTable().catch(err => {
                this.initPromise = undefined;
                throw err;
            });
        }
        return this.initPromise;
    }

    private async doEnsureTable(): Promise<void> {
        const exists = await this.knex.client.schema.hasTable(this.tableName);

        if (!exists) {
            await this.createTable();
        }

        this.initialized = true;
    }

    public getTableName(): string {
        return this.tableName;
    }

    private async createTable(): Promise<void> {
        try {
            await this.knex.client.schema.createTable(this.tableName, table => {
                table.text("id").primary();
                table.text("entryId").notNullable();
                table.text("modelId").notNullable();
                table.text("tenant").notNullable();
                table.integer("version").notNullable();
                table.boolean("isLatest").defaultTo(false);
                table.boolean("isPublished").defaultTo(false);
                table.boolean("wbyDeleted").defaultTo(false);
                table.text("data").notNullable();

                table.index(["tenant", "modelId", "isLatest"]);
                table.index(["tenant", "modelId", "isPublished"]);
                table.index(["tenant", "modelId", "entryId"]);
            });
        } catch (err) {
            // The entries table is shared across all EntryTableManager instances (one per request
            // container), so another instance/connection may create it concurrently. If it now
            // exists, that's success; otherwise the failure is real.
            if (await this.knex.client.schema.hasTable(this.tableName)) {
                return;
            }
            throw err;
        }
    }
}

export const EntryTableManager = EntryTableManagerAbstraction.createImplementation({
    implementation: EntryTableManagerImpl,
    dependencies: [KnexClient, TableNameResolver]
});
