import type { CmsGroupStorageOperationsListParams } from "@webiny/api-headless-cms/types/index.js";
import type { IGroupRow } from "./types.js";
import { GROUP_COLUMNS } from "./types.js";
import { ListGroupsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/ListGroupsStorageOperation.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { rowToGroup } from "./mappers.js";
import { KnexClient } from "@webiny/api-core-sql";

class SqlListGroupsImpl implements ListGroupsStorageOperation.Interface {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private groupSchemaManager: GroupSchemaManager.Interface
    ) {
        this.tableName = tableNameResolver.resolve("groups");
    }

    async execute(params: CmsGroupStorageOperationsListParams) {
        const { where, sort } = params;

        await this.groupSchemaManager.ensure(this.tableName);

        const qb = this.knex.client<IGroupRow>(this.tableName).where("tenant", where.tenant);

        if (where.id) {
            qb.andWhere("id", where.id);
        }
        if (where.slug) {
            qb.andWhere("slug", where.slug);
        }
        if (where.isPlugin !== undefined) {
            qb.andWhere("isPlugin", where.isPlugin);
        }
        if (where.isPrivate !== undefined) {
            qb.andWhere("isPrivate", where.isPrivate);
        }

        if (sort?.length) {
            for (const sortField of sort) {
                const parts = sortField.split("_");
                const direction = parts.pop()?.toLowerCase() === "asc" ? "asc" : "desc";
                const field = parts.join("_");
                qb.orderBy(field, direction);
            }
        }

        const rows = await qb.select<IGroupRow[]>([...GROUP_COLUMNS]);

        return rows.map(rowToGroup);
    }
}

export const SqlListGroups = ListGroupsStorageOperation.createImplementation({
    implementation: SqlListGroupsImpl,
    dependencies: [KnexClient, TableNameResolver, GroupSchemaManager]
});
