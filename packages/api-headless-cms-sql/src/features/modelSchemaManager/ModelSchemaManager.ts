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
import { ModelSchemaManager as ModelSchemaManagerAbstraction } from "./abstractions.js";

const createTable = (table: Knex.CreateTableBuilder): void => {
    table.text("modelId").notNullable();
    table.text("tenant").notNullable();
    table.text("name").notNullable();
    table.text("singularApiName").notNullable();
    table.text("pluralApiName").notNullable();
    table.text("group").notNullable();
    table.text("icon");
    table.text("description");
    table.text("fields").notNullable();
    table.text("layout").notNullable();
    table.text("tags");
    table.text("titleFieldId").notNullable();
    table.text("descriptionFieldId");
    table.text("imageFieldId");
    table.boolean("isPrivate").notNullable().defaultTo(false);
    table.boolean("isPlugin").notNullable().defaultTo(false);
    table.text("authorization");
    table.text("createdBy_id");
    table.text("createdBy_displayName");
    table.text("createdBy_type");
    table.text("createdBy");
    table.text("createdOn");
    table.text("savedOn");
    table.text("settings");

    table.primary(["tenant", "modelId"]);
};

class ModelSchemaManagerImpl implements ModelSchemaManagerAbstraction.Interface {
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
            `cms.sql.ModelSchemaManager:${getConnectionKey(knex.client)}`
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

export const ModelSchemaManager = ModelSchemaManagerAbstraction.createImplementation({
    implementation: ModelSchemaManagerImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});
