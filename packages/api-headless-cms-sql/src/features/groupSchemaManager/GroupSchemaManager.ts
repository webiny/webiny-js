import { getSchemaMemory, KnexClient, SqlSchemaConfig } from "@webiny/api-core-sql";
import { GroupSchemaManager as GroupSchemaManagerAbstraction } from "./abstractions.js";

class GroupSchemaManagerImpl implements GroupSchemaManagerAbstraction.Interface {
    private readonly knex;
    /*
     * Tables checked by this process. Process-wide rather than per instance: the Postgres CMS
     * registers this manager per request.
     */
    private readonly verified = getSchemaMemory("cms.sql.GroupSchemaManager").known;

    constructor(
        knex: KnexClient.Interface,
        private readonly schemaConfig?: SqlSchemaConfig.Interface
    ) {
        this.knex = knex;
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
            });
        }

        this.verified.add(tableName);
    }
}

export const GroupSchemaManager = GroupSchemaManagerAbstraction.createImplementation({
    implementation: GroupSchemaManagerImpl,
    dependencies: [KnexClient, [SqlSchemaConfig, { optional: true }]]
});
