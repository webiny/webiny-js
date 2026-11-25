import type { CmsGroupStorageOperationsDeleteParams } from "@webiny/api-headless-cms/types/index.js";
import type { IGroupRow } from "./types.js";
import { DeleteGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/DeleteGroupStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { KnexClient } from "@webiny/api-core-sql";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

class SqlDeleteGroupImpl implements DeleteGroupStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private groupSchemaManager: GroupSchemaManager.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {
        this.tableName = tableNameResolver.resolve("groups");
    }

    async execute(params: CmsGroupStorageOperationsDeleteParams) {
        const tenant = this.scopeTenant.getId(params.group.tenant);

        await this.groupSchemaManager.ensure(this.tableName);
        await this.knex
            .client<IGroupRow>(this.tableName)
            .where("tenant", tenant)
            .andWhere("id", params.group.id)
            .delete();
    }
}

export const SqlDeleteGroup = DeleteGroupStorageOperation.createImplementation({
    implementation: SqlDeleteGroupImpl,
    dependencies: [KnexClient, TableNameResolver, GroupSchemaManager, ScopeTenant]
});
