import type { IColumnDefinition } from "~/features/fieldTypeMapper/abstractions.js";
import { GroupSchemaManager as GroupSchemaManagerAbstraction } from "./abstractions.js";
import { SchemaRegistry } from "~/features/schemaRegistry/abstractions.js";
import { KnexInstance } from "~/features/knexInstance/abstractions.js";
import { applyColumnDefinitions } from "~/features/entrySchemaManager/columnBuilder.js";

const GROUP_TABLE_COLUMNS: IColumnDefinition[] = [
    { name: "id", type: "varchar", nullable: false, primaryKey: true },
    { name: "name", type: "varchar", nullable: false },
    { name: "slug", type: "varchar", nullable: false },
    { name: "tenant", type: "varchar", nullable: false },
    { name: "description", type: "text", nullable: true },
    { name: "icon", type: "text", nullable: true },
    { name: "createdBy_id", type: "varchar", nullable: true },
    { name: "createdBy_displayName", type: "varchar", nullable: true },
    { name: "createdBy_type", type: "varchar", nullable: true },
    { name: "createdBy", type: "text", nullable: true },
    { name: "createdOn", type: "varchar", nullable: true },
    { name: "savedOn", type: "varchar", nullable: true },
    { name: "isPrivate", type: "boolean", nullable: false, defaultValue: false },
    { name: "isPlugin", type: "boolean", nullable: false, defaultValue: false }
];

class GroupSchemaManagerImpl implements GroupSchemaManagerAbstraction.Interface {
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
                applyColumnDefinitions(table, GROUP_TABLE_COLUMNS);
            });
        }

        this.registry.markVerified(tableName);
    }
}

export const GroupSchemaManager = GroupSchemaManagerAbstraction.createImplementation({
    implementation: GroupSchemaManagerImpl,
    dependencies: [KnexInstance, SchemaRegistry]
});
