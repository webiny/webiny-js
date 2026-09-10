import type { CmsGroupStorageOperationsGetParams } from "@webiny/api-headless-cms/types/index.js";
import type { IGroupRow } from "./types.js";
import { GetGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/GetGroupStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { rowToGroup } from "./mappers.js";
import { KnexClient } from "@webiny/api-core-sql";

class SqlGetGroupImpl implements GetGroupStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private groupSchemaManager: GroupSchemaManager.Interface
    ) {
        this.tableName = tableNameResolver.resolve("groups");
    }

    async execute(params: CmsGroupStorageOperationsGetParams) {
        await this.groupSchemaManager.ensure(this.tableName);

        const row = await this.knex
            .client<IGroupRow>(this.tableName)
            .where("id", params.id)
            .where("tenant", params.tenant)
            .first();

        if (!row) {
            return null;
        }

        return rowToGroup(row);
    }
}

export const SqlGetGroup = GetGroupStorageOperation.createImplementation({
    implementation: SqlGetGroupImpl,
    dependencies: [KnexClient, TableNameResolver, GroupSchemaManager]
});
