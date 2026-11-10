import { SqlSchemaSetup } from "@webiny/api-core-sql";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { ModelSchemaManager } from "~/features/modelSchemaManager/abstractions.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { EntryTableManager } from "~/features/entryTableManager/abstractions.js";

/** The `cms` schema setup step: the models, groups and entries tables. */
class CmsSqlSchemaSetupImpl implements SqlSchemaSetup.Interface {
    public readonly name = "cms";

    public constructor(
        private readonly tables: TableNameResolver.Interface,
        private readonly models: ModelSchemaManager.Interface,
        private readonly groups: GroupSchemaManager.Interface,
        private readonly entries: EntryTableManager.Interface
    ) {}

    public async setup(): Promise<void> {
        await this.models.setup(this.tables.resolve("models"));
        await this.groups.setup(this.tables.resolve("groups"));
        await this.entries.ensureTable();
    }
}

export const CmsSqlSchemaSetup = SqlSchemaSetup.createImplementation({
    implementation: CmsSqlSchemaSetupImpl,
    dependencies: [TableNameResolver, ModelSchemaManager, GroupSchemaManager, EntryTableManager]
});
