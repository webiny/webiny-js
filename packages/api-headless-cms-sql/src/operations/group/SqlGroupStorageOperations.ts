import type {
    CmsGroup,
    CmsGroupStorageOperations,
    CmsGroupStorageOperationsCreateParams,
    CmsGroupStorageOperationsDeleteParams,
    CmsGroupStorageOperationsGetParams,
    CmsGroupStorageOperationsListParams,
    CmsGroupStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import type { IGroupRow } from "./types.js";
import { GROUP_COLUMNS } from "./types.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { groupToRow, rowToGroup } from "./mappers.js";
import { KnexClient } from "@webiny/api-core-sql";
import { createImplementation } from "@webiny/feature/api";
import { GroupStorageOperations } from "@webiny/api-headless-cms/features/shared/storageOperations/GroupStorageOperations.js";

class SqlGroupStorageOperationsImpl implements CmsGroupStorageOperations {
    private tableName: string;

    constructor(
        private knex: KnexClient.Interface,
        tableNameResolver: TableNameResolver.Interface,
        private groupSchemaManager: GroupSchemaManager.Interface
    ) {
        this.tableName = tableNameResolver.resolve("groups");
    }

    private async ensureSchema() {
        await this.groupSchemaManager.ensure(this.tableName);
    }

    private query() {
        return this.knex.client<IGroupRow>(this.tableName);
    }

    public async get(params: CmsGroupStorageOperationsGetParams): Promise<CmsGroup | null> {
        await this.ensureSchema();

        const row = await this.query()
            .where("id", params.id)
            .where("tenant", params.tenant)
            .first();

        if (!row) {
            return null;
        }

        return rowToGroup(row);
    }

    public async list(params: CmsGroupStorageOperationsListParams): Promise<CmsGroup[]> {
        const { where, sort } = params;

        await this.ensureSchema();

        const qb = this.query().where("tenant", where.tenant);

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

    public async create(params: CmsGroupStorageOperationsCreateParams): Promise<void> {
        const row = groupToRow(params.group);

        await this.ensureSchema();
        await this.query().insert(row);
    }

    public async update(params: CmsGroupStorageOperationsUpdateParams): Promise<void> {
        const row = groupToRow(params.group);

        await this.ensureSchema();
        await this.query().where("id", params.group.id).update(row);
    }

    public async delete(params: CmsGroupStorageOperationsDeleteParams): Promise<void> {
        await this.ensureSchema();
        await this.query().where("id", params.group.id).delete();
    }
}

export const SqlGroupStorageOperations = createImplementation({
    abstraction: GroupStorageOperations,
    implementation: SqlGroupStorageOperationsImpl,
    dependencies: [KnexClient, TableNameResolver, GroupSchemaManager]
});
