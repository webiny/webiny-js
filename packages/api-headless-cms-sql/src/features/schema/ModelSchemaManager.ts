import type { IColumnDefinition } from "./abstractions/index.js";
import { ModelSchemaManager } from "./abstractions/index.js";
import { SchemaRegistry } from "./abstractions/index.js";
import { KnexInstance } from "./abstractions/index.js";
import { applyColumnDefinitions } from "./columnBuilder.js";

const MODEL_TABLE_COLUMNS: IColumnDefinition[] = [
    { name: "modelId", type: "varchar", nullable: false, primaryKey: true },
    { name: "tenant", type: "varchar", nullable: false },
    { name: "name", type: "varchar", nullable: false },
    { name: "singularApiName", type: "varchar", nullable: false },
    { name: "pluralApiName", type: "varchar", nullable: false },
    { name: "group", type: "varchar", nullable: false },
    { name: "icon", type: "text", nullable: true },
    { name: "description", type: "text", nullable: true },
    { name: "fields", type: "text", nullable: false },
    { name: "layout", type: "text", nullable: false },
    { name: "tags", type: "text", nullable: true },
    { name: "titleFieldId", type: "varchar", nullable: false },
    { name: "descriptionFieldId", type: "varchar", nullable: true },
    { name: "imageFieldId", type: "varchar", nullable: true },
    { name: "isPrivate", type: "boolean", nullable: false, defaultValue: false },
    { name: "isPlugin", type: "boolean", nullable: false, defaultValue: false },
    { name: "authorization", type: "text", nullable: true },
    { name: "createdBy_id", type: "varchar", nullable: true },
    { name: "createdBy_displayName", type: "varchar", nullable: true },
    { name: "createdBy_type", type: "varchar", nullable: true },
    { name: "createdBy", type: "text", nullable: true },
    { name: "createdOn", type: "varchar", nullable: true },
    { name: "savedOn", type: "varchar", nullable: true }
];

class ModelSchemaManagerImpl implements ModelSchemaManager.Interface {
    private readonly knex: KnexInstance.Interface;
    private readonly registry: SchemaRegistry.Interface;

    constructor(knex: KnexInstance.Interface, registry: SchemaRegistry.Interface) {
        this.knex = knex;
        this.registry = registry;
    }

    public async ensure(tableName: string): Promise<void> {
        if (this.registry.isVerified(tableName)) {
            return;
        }

        const exists = await this.knex.schema.hasTable(tableName);

        if (!exists) {
            await this.knex.schema.createTable(tableName, table => {
                applyColumnDefinitions(table, MODEL_TABLE_COLUMNS);
            });
        }

        this.registry.markVerified(tableName);
    }
}

export const ModelSchemaManagerImplementation = ModelSchemaManager.createImplementation({
    implementation: ModelSchemaManagerImpl,
    dependencies: [KnexInstance, SchemaRegistry]
});
