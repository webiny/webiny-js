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

    const get = async (getParams: CmsGroupStorageOperationsGetParams): Promise<CmsGroup | null> => {
        await ensureSchema();

        const row = await query()
            .where("id", getParams.id)
            .where("tenant", getParams.tenant)
            .first();

        if (!row) {
            return null;
        }

        return rowToGroup(row);
    };

    const list = async (listParams: CmsGroupStorageOperationsListParams): Promise<CmsGroup[]> => {
        const { where, sort } = listParams;

        await ensureSchema();

        const qb = query();

        if (sort && sort.length > 0) {
            for (const sortField of sort) {
                const parts = sortField.split("_");
                const direction = parts.pop()?.toLowerCase() === "asc" ? "asc" : "desc";
                const field = parts.join("_");
                qb.orderBy(field, direction);
            }
        }

        /* Apply where conditions for known group columns. */
        if (where.tenant) {
            qb.where("tenant", where.tenant);
        }
        if (where.id) {
            qb.where("id", where.id);
        }
        if (where.slug) {
            qb.where("slug", where.slug);
        }
        if (where.isPlugin !== undefined) {
            qb.where("isPlugin", where.isPlugin);
        }
        if (where.isPrivate !== undefined) {
            qb.where("isPrivate", where.isPrivate);
        }

        const rows = await qb.select<IGroupRow[]>([...GROUP_COLUMNS]);

        return rows.map(rowToGroup);
    };

    const create = async (createParams: CmsGroupStorageOperationsCreateParams): Promise<void> => {
        const row = groupToRow(createParams.group);

        await ensureSchema();
        await query().insert(row);
    };

    const update = async (updateParams: CmsGroupStorageOperationsUpdateParams): Promise<void> => {
        const row = groupToRow(updateParams.group);

        await ensureSchema();
        await query().where("id", updateParams.group.id).update(row);
    };

    const del = async (deleteParams: CmsGroupStorageOperationsDeleteParams): Promise<void> => {
        await ensureSchema();
        await query().where("id", deleteParams.group.id).delete();
    };

    return {
        get,
        list,
        create,
        update,
        delete: del
    };
};
