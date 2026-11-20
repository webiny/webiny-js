import type { Knex } from "knex";
import {
    createTableIfMissing,
    ensureTable,
    getConnectionKey,
    getSchemaMemory,
    KnexClient,
    recordTable,
    SqlSchemaConfig,
    type ISchemaMemory
} from "@webiny/api-core-sql";
import { GroupSchemaManager as GroupSchemaManagerAbstraction } from "./abstractions.js";

const createTable = (table: Knex.CreateTableBuilder): void => {
    table.text("id").notNullable();
    table.text("name").notNullable();
    table.text("slug").notNullable();
    table.text("tenant").notNullable();
    table.text("description");
    table.text("icon");
    table.text("createdBy_id");
    table.text("createdBy_displayName");
    table.text("createdBy_type");
    table.text("createdBy");
    table.text("createdOn");
    table.text("savedOn");
    table.boolean("isPrivate").notNullable().defaultTo(false);
    table.boolean("isPlugin").notNullable().defaultTo(false);

    table.primary(["tenant", "id"]);
};

class GroupSchemaManagerImpl implements GroupSchemaManagerAbstraction.Interface {
    private readonly knex;
    /*
     * Tables checked by this process, per connection. Process-wide rather than per instance: the
     * Postgres CMS registers this manager per request.
     */
    private readonly memory: ISchemaMemory;

    constructor(
        knex: KnexClient.Interface,
        private readonly schemaConfig?: SqlSchemaConfig.Interface
    ) {
        this.knex = knex;
        this.memory = getSchemaMemory(
            `cms.sql.GroupSchemaManager:${getConnectionKey(knex.client)}`
        );
    }

    public reset(): void {
        this.memory.reset();
    }

    public async ensure(tableName: string): Promise<void> {
        if (this.schemaConfig?.isManaged()) {
            return;
        }
        // Concurrent first uses of the table share one check.
        await ensureTable({
            knex: this.knex.client,
            memory: this.memory,
            tableName,
            create: createTable
        });
    }

    public async setup(tableName: string): Promise<void> {
        await createTableIfMissing(this.knex.client, tableName, createTable);
        recordTable(this.knex.client, this.memory, tableName);
    }
}

export const GroupSchemaManager = GroupSchemaManagerAbstraction.createImplementation({
    implementation: GroupSchemaManagerImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});
