import { GroupSchemaManager as GroupSchemaManagerAbstraction } from "./abstractions.js";
import { KnexInstance } from "~/features/knexInstance/abstractions.js";

class GroupSchemaManagerImpl implements GroupSchemaManagerAbstraction.Interface {
    private readonly knex: KnexInstance.Interface;
    private readonly verified = new Set<string>();

    constructor(knex: KnexInstance.Interface) {
        this.knex = knex;

        const g = globalThis as Record<string, unknown>;
        const managers = (g.__sqlTableManagers ??= []) as GroupSchemaManagerAbstraction.Interface[];
        managers.push(this);
    }

    public reset(): void {
        this.verified.clear();
    }

    public async ensure(tableName: string): Promise<void> {
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
