import { SqlSchemaSetup } from "@webiny/api-core-sql";
import { TableNameResolver } from "@webiny/api-headless-cms-sql/features/tableNameResolver/abstractions.js";
import { ModelSchemaManager } from "@webiny/api-headless-cms-sql/features/modelSchemaManager/abstractions.js";
import { GroupSchemaManager } from "@webiny/api-headless-cms-sql/features/groupSchemaManager/abstractions.js";
import { PgSchema } from "./abstractions.js";

/**
 * The `cms` schema setup step: the models and groups tables, then the entries, search, scopes and
 * value-count tables with their indexes, functions and triggers (as the settings ask, e.g.
 * `slotIndexes`).
 */
class CmsPgSchemaSetupImpl implements SqlSchemaSetup.Interface {
    public readonly name = "cms";

    public constructor(
        private readonly tables: TableNameResolver.Interface,
        private readonly models: ModelSchemaManager.Interface,
        private readonly groups: GroupSchemaManager.Interface,
        private readonly schema: PgSchema.Interface
    ) {}

    public async setup(): Promise<void> {
        await this.models.setup(this.tables.resolve("models"));
        await this.groups.setup(this.tables.resolve("groups"));
        await this.schema.setup();
    }
}

export const CmsPgSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: CmsPgSchemaSetupImpl,
    dependencies: [TableNameResolver, ModelSchemaManager, GroupSchemaManager, PgSchema]
});
