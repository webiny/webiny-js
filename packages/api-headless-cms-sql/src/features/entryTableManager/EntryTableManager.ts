import { getConnectionKey, getSchemaMemory, KnexClient } from "@webiny/api-core-sql";
import { EntryTableManager as EntryTableManagerAbstraction } from "./abstractions.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";

/*
 * The CMS storage is registered per request, so a new instance is built for each one. Whether the
 * entries table exists is kept for the process, per connection and table, in the schema memory.
 */
class EntryTableManagerImpl implements EntryTableManagerAbstraction.Interface {
    private readonly knex;
    private readonly tableName;
    private readonly memory;

    constructor(knex: KnexClient.Interface, tableNameResolver: TableNameResolver.Interface) {
        this.knex = knex;
        this.tableName = tableNameResolver.resolve("entries");
        this.memory = getSchemaMemory(
            `cms.sql.entries:${getConnectionKey(knex.client)}:${this.tableName}`
        );
    }

    public reset(): void {
        this.memory.reset();
    }

    public ensureTable(): Promise<void> {
        // One hasTable+createTable per process: concurrent callers (e.g. Promise.all entry creates)
        // share it instead of racing into "table already exists". A failed one is retried next call.
        return this.memory.once(() => this.doEnsureTable());
    }

    private async doEnsureTable(): Promise<void> {
        const exists = await this.knex.client.schema.hasTable(this.tableName);

        if (!exists) {
            await this.createTable();
        }
    }

    public getTableName(): string {
        return this.tableName;
    }

    private async createTable(): Promise<void> {
        try {
            await this.knex.client.schema.createTable(this.tableName, table => {
                table.text("id").notNullable();
                table.text("entryId").notNullable();
                table.text("modelId").notNullable();
                table.text("tenant").notNullable();
                table.integer("version").notNullable();
                table.boolean("isLatest").defaultTo(false);
                table.boolean("isPublished").defaultTo(false);
                table.boolean("wbyDeleted").defaultTo(false);
                table.text("data").notNullable();

                table.primary(["tenant", "id"]);

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
