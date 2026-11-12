import {
    getConnectionKey,
    getSchemaMemory,
    KnexClient,
    SqlSchemaConfig
} from "@webiny/api-core-sql";
import { ModelSchemaManager as ModelSchemaManagerAbstraction } from "./abstractions.js";

class ModelSchemaManagerImpl implements ModelSchemaManagerAbstraction.Interface {
    private readonly knex;
    /*
     * Tables checked by this process, per connection. Process-wide rather than per instance: the
     * Postgres CMS registers this manager per request.
     */
    private readonly verified;

    constructor(
        knex: KnexClient.Interface,
        private readonly schemaConfig?: SqlSchemaConfig.Interface
    ) {
        this.knex = knex;
        this.verified = getSchemaMemory(
            `cms.sql.ModelSchemaManager:${getConnectionKey(knex.client)}`
        ).known;
    }

    public reset(): void {
        this.verified.clear();
    }

    public async ensure(tableName: string): Promise<void> {
        if (this.schemaConfig?.isManaged() || this.verified.has(tableName)) {
            return;
        }
        await this.setup(tableName);
    }

    public async setup(tableName: string): Promise<void> {
        const exists = await this.knex.client.schema.hasTable(tableName);

        if (!exists) {
            await this.knex.client.schema.createTable(tableName, table => {
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
            });
        }

        // A transaction can still roll back, and the table with it: only a committed table is known.
        if (!this.knex.client.isTransaction) {
            this.verified.add(tableName);
        }
    }
}

export const ModelSchemaManager = ModelSchemaManagerAbstraction.createImplementation({
    implementation: ModelSchemaManagerImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});
