import { KnexClient } from "@webiny/api-core-sql";
import { SyncTableManager as SyncTableManagerAbstraction } from "./abstractions.js";
import { TableNameResolver } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";

class SyncTableManagerImpl implements SyncTableManagerAbstraction.Interface {
    private readonly knex;
    private readonly tableName;
    private initialized = false;
    private initPromise?: Promise<void>;

    constructor(knex: KnexClient.Interface, tableNameResolver: TableNameResolver.Interface) {
        this.knex = knex;
        this.tableName = tableNameResolver.resolve("os_sync");

        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as SyncTableManagerAbstraction.Interface[];
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
        if (!this.initPromise) {
            this.initPromise = this.doEnsureTable().catch(err => {
                this.initPromise = undefined;
                throw err;
            });
        }
        return this.initPromise;
    }

    public getTableName(): string {
        return this.tableName;
    }

    private async doEnsureTable(): Promise<void> {
        const exists = await this.knex.client.schema.hasTable(this.tableName);

        if (!exists) {
            await this.createTable();
        }

        this.initialized = true;
    }

    private async createTable(): Promise<void> {
        try {
            await this.knex.client.schema.createTable(this.tableName, table => {
                table.text("id").primary();
                table.text("entryId").notNullable();
                table.text("index").notNullable();
                table.text("operation").notNullable();
                table.text("data").notNullable();
                table.text("tenant").notNullable();

                table.index(["tenant"]);
            });
        } catch (err) {
            if (await this.knex.client.schema.hasTable(this.tableName)) {
                return;
            }
            throw err;
        }
    }
}

export const SyncTableManager = SyncTableManagerAbstraction.createImplementation({
    implementation: SyncTableManagerImpl,
    dependencies: [KnexClient, TableNameResolver]
});
