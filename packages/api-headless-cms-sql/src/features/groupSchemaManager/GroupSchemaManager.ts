import { GroupSchemaManager as GroupSchemaManagerAbstraction } from "./abstractions.js";
import { KnexInstance } from "~/features/knexInstance/abstractions.js";

class GroupSchemaManagerImpl implements GroupSchemaManagerAbstraction.Interface {
    private readonly knex: KnexInstance.Interface;
    private readonly verified = new Set<string>();
    private lastVersion = 0;

    constructor(knex: KnexInstance.Interface) {
        this.knex = knex;
    }

    public async ensure(tableName: string): Promise<void> {
        /* Check if globalThis version changed (test reset mechanism). */
        const currentVersion =
            ((globalThis as Record<string, unknown>).__schemaManagerVersion as number) || 0;

        if (currentVersion !== this.lastVersion) {
            this.verified.clear();
            this.lastVersion = currentVersion;
        }

        if (this.verified.has(tableName)) {
            return;
        }

        const exists = await this.knex.schema.hasTable(tableName);

        if (!exists) {
            await this.knex.schema.createTable(tableName, table => {
                table.text("id").primary().notNullable();
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
            });
        }

        this.verified.add(tableName);
    }
}

export const GroupSchemaManager = GroupSchemaManagerAbstraction.createImplementation({
    implementation: GroupSchemaManagerImpl,
    dependencies: [KnexInstance]
});
