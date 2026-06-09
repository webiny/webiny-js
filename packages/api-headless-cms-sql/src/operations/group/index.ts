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
import { KnexInstance } from "~/features/knexInstance/abstractions.js";
import { TableNameResolver } from "~/features/tableNameResolver/abstractions.js";
import { GroupSchemaManager } from "~/features/groupSchemaManager/abstractions.js";
import { groupToRow } from "./mappers.js";
import { rowToGroup } from "./mappers.js";

export const createGroupsStorageOperations = (
    knex: KnexInstance.Interface,
    tableNameResolver: TableNameResolver.Interface,
    groupSchemaManager: GroupSchemaManager.Interface
): CmsGroupStorageOperations => {
    const tableName = tableNameResolver.resolve("groups");

    const ensureSchema = async () => {
        await groupSchemaManager.ensure(tableName);
    };

    const query = () => {
        return knex<IGroupRow>(tableName);
    };

    const get = async (params: CmsGroupStorageOperationsGetParams): Promise<CmsGroup | null> => {
        await ensureSchema();

        const row = await query().where("id", params.id).where("tenant", params.tenant).first();

        if (!row) {
            return null;
        }

        return rowToGroup(row);
    };

    const list = async (params: CmsGroupStorageOperationsListParams): Promise<CmsGroup[]> => {
        const { where, sort } = params;

        await ensureSchema();

        const qb = query().where("tenant", where.tenant);

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
    };

    const create = async (params: CmsGroupStorageOperationsCreateParams): Promise<void> => {
        const row = groupToRow(params.group);

        await ensureSchema();
        await query().insert(row);
    };

    const update = async (params: CmsGroupStorageOperationsUpdateParams): Promise<void> => {
        const row = groupToRow(params.group);

        await ensureSchema();
        await query().where("id", params.group.id).update(row);
    };

    const deleteGroup = async (params: CmsGroupStorageOperationsDeleteParams): Promise<void> => {
        await ensureSchema();
        await query().where("id", params.group.id).delete();
    };

    return {
        get,
        list,
        create,
        update,
        delete: deleteGroup
    };
};
