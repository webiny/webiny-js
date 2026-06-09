import { EntryTableManager as EntryTableManagerAbstraction } from "./abstractions.js";
import { KnexInstance } from "~/features/knexInstance/abstractions.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";

class EntryTableManagerImpl implements EntryTableManagerAbstraction.Interface {
    private readonly knex: KnexInstance.Interface;
    private readonly tableName: string;
    private initialized = false;

    constructor(knex: KnexInstance.Interface, tableNameResolver: TableNameResolver.Interface) {
        this.knex = knex;
        this.tableName = tableNameResolver.resolve("entries");

        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as EntryTableManagerAbstraction.Interface[];
        managers.push(this);
    }

    public reset(): void {
        this.initialized = false;
    }

    public async ensureTable(): Promise<void> {
        if (this.initialized) {
            return;
        }

        const exists = await this.knex.schema.hasTable(this.tableName);

        if (!exists) {
            await this.createTable();
        }

        this.initialized = true;
    }

    public getTableName(): string {
        return this.tableName;
    }

    private async createTable(): Promise<void> {
        await this.knex.schema.createTable(this.tableName, table => {
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
    }
}

export const EntryTableManager = EntryTableManagerAbstraction.createImplementation({
    implementation: EntryTableManagerImpl,
    dependencies: [KnexInstance, TableNameResolver]
});
