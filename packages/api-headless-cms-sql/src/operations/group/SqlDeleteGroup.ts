import type { CmsGroupStorageOperationsDeleteParams } from "@webiny/api-headless-cms/types/index.js";
import type { IGroupRow } from "./types.js";
import { DeleteGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/DeleteGroupStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { KnexClient } from "@webiny/api-core-sql";

class SqlDeleteGroupImpl implements DeleteGroupStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private groupSchemaManager: GroupSchemaManager.Interface
    ) {
        this.tableName = tableNameResolver.resolve("groups");
    }

    async execute(params: CmsGroupStorageOperationsDeleteParams) {
        await this.groupSchemaManager.ensure(this.tableName);
        await this.knex.client<IGroupRow>(this.tableName).where("id", params.group.id).delete();
    }
}

export const SqlDeleteGroup = DeleteGroupStorageOperation.createImplementation({
    implementation: SqlDeleteGroupImpl,
    dependencies: [KnexClient, TableNameResolver, GroupSchemaManager]
});
