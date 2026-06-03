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
            table.text("status").notNullable();
            table.boolean("locked").defaultTo(false);
            table.boolean("isLatest").defaultTo(false);
            table.boolean("isPublished").defaultTo(false);
            table.boolean("wbyDeleted").defaultTo(false);
            table.text("binOriginalFolderId");

            /* Location fields. */
            table.text("location");
            table.text("location_folderId");

            /* Revision-level date fields. */
            table.text("revisionCreatedOn");
            table.text("revisionModifiedOn");
            table.text("revisionSavedOn");
            table.text("revisionDeletedOn");
            table.text("revisionRestoredOn");
            table.text("revisionFirstPublishedOn");
            table.text("revisionLastPublishedOn");

            /* Revision-level identity fields (JSON blobs). */
            table.text("revisionCreatedBy");
            table.text("revisionModifiedBy");
            table.text("revisionSavedBy");
            table.text("revisionDeletedBy");
            table.text("revisionRestoredBy");
            table.text("revisionFirstPublishedBy");
            table.text("revisionLastPublishedBy");

            /* Entry-level date fields. */
            table.text("createdOn");
            table.text("modifiedOn");
            table.text("savedOn");
            table.text("deletedOn");
            table.text("restoredOn");
            table.text("firstPublishedOn");
            table.text("lastPublishedOn");

            /* Entry-level identity fields (JSON blobs). */
            table.text("createdBy");
            table.text("modifiedBy");
            table.text("savedBy");
            table.text("deletedBy");
            table.text("restoredBy");
            table.text("firstPublishedBy");
            table.text("lastPublishedBy");

            /* Misc meta columns. */
            table.text("meta");
            table.text("system");
            table.text("live");
            table.text("revisionDescription");
            table.bigInteger("expiresAt");

            /* Values blob. */
            table.text("values");

            /* Composite indexes. */
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
