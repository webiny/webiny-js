import type { CmsGroupStorageOperationsCreateParams } from "@webiny/api-headless-cms/types/index.js";
import type { IGroupRow } from "./types.js";
import { CreateGroupStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/CreateGroupStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { groupToRow } from "./mappers.js";
import { KnexClient } from "@webiny/api-core-sql";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";

class SqlCreateGroupImpl implements CreateGroupStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private groupSchemaManager: GroupSchemaManager.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {
        this.tableName = tableNameResolver.resolve("groups");
    }

    async execute(params: CmsGroupStorageOperationsCreateParams) {
        const tenant = this.scopeTenant.getId(params.group.tenant);
        const row = groupToRow(params.group, tenant);

        await this.groupSchemaManager.ensure(this.tableName);
        await this.knex.client<IGroupRow>(this.tableName).insert(row);
    }
}

export const SqlCreateGroup = CreateGroupStorageOperation.createImplementation({
    implementation: SqlCreateGroupImpl,
    dependencies: [KnexClient, TableNameResolver, GroupSchemaManager, ScopeTenant]
});
