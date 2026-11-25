import type { CmsGroupStorageOperationsUpdateParams } from "@webiny/api-headless-cms/types/index.js";
import type { IGroupRow } from "./types.js";
import { UpdateGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/UpdateGroupStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { groupToRow } from "./mappers.js";
import { KnexClient } from "@webiny/api-core-sql";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

class SqlUpdateGroupImpl implements UpdateGroupStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private groupSchemaManager: GroupSchemaManager.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {
        this.tableName = tableNameResolver.resolve("groups");
    }

    async execute(params: CmsGroupStorageOperationsUpdateParams) {
        const tenant = this.scopeTenant.getId(params.group.tenant);
        const row = groupToRow(params.group, tenant);

        await this.groupSchemaManager.ensure(this.tableName);
        await this.knex
            .client<IGroupRow>(this.tableName)
            .where("tenant", tenant)
            .andWhere("id", params.group.id)
            .update(row);
    }
}

export const SqlUpdateGroup = UpdateGroupStorageOperation.createImplementation({
    implementation: SqlUpdateGroupImpl,
    dependencies: [KnexClient, TableNameResolver, GroupSchemaManager, ScopeTenant]
});
