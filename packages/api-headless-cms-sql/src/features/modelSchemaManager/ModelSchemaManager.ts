import { KnexClient } from "@webiny/api-core-sql";
import { ModelSchemaManager as ModelSchemaManagerAbstraction } from "./abstractions.js";

class ModelSchemaManagerImpl implements ModelSchemaManagerAbstraction.Interface {
    private readonly knex;
    private readonly verified = new Set<string>();

    constructor(knex: KnexClient.Interface) {
        this.knex = knex;

        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as ModelSchemaManagerAbstraction.Interface[];
        managers.push(this);
    }

    public reset(): void {
        this.verified.clear();
    }

    public async ensure(tableName: string): Promise<void> {
        if (this.verified.has(tableName)) {
            return;
        }

        const exists = await this.knex.client.schema.hasTable(tableName);

        if (!exists) {
            await this.knex.client.schema.createTable(tableName, table => {
                table.text("modelId").primary().notNullable();
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
            });
        }

        this.verified.add(tableName);
    }
}

export const ModelSchemaManager = ModelSchemaManagerAbstraction.createImplementation({
    implementation: ModelSchemaManagerImpl,
    dependencies: [KnexClient]
});
