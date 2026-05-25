import type { IColumnDefinition } from "~/features/fieldTypeMapper/abstractions.js";
import { GroupSchemaManagerAbstraction } from "./abstractions.js";
import { SchemaRegistryAbstraction } from "~/features/schemaRegistry/abstractions.js";
import { KnexInstanceAbstraction } from "~/features/knexInstance/abstractions.js";
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
    private readonly knex: KnexInstanceAbstraction.Interface;
    private readonly registry: SchemaRegistryAbstraction.Interface;

    constructor(
        knex: KnexInstanceAbstraction.Interface,
        registry: SchemaRegistryAbstraction.Interface
    ) {
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
    dependencies: [KnexInstanceAbstraction, SchemaRegistryAbstraction]
});
