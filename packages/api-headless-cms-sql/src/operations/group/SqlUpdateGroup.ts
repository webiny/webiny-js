import type { CmsGroupStorageOperationsUpdateParams } from "@webiny/api-headless-cms/types/index.js";
import type { IGroupRow } from "./types.js";
import { UpdateGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/UpdateGroupStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { groupToRow } from "./mappers.js";
import { KnexClient } from "@webiny/api-core-sql";

class SqlUpdateGroupImpl implements UpdateGroupStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private groupSchemaManager: GroupSchemaManager.Interface
    ) {
        this.tableName = tableNameResolver.resolve("groups");
    }

    async execute(params: CmsGroupStorageOperationsUpdateParams) {
        const row = groupToRow(params.group);

        await this.groupSchemaManager.ensure(this.tableName);
        await this.knex.client<IGroupRow>(this.tableName).where("id", params.group.id).update(row);
    }
}

export const SqlUpdateGroup = UpdateGroupStorageOperation.createImplementation({
    implementation: SqlUpdateGroupImpl,
    dependencies: [KnexClient, TableNameResolver, GroupSchemaManager]
});
