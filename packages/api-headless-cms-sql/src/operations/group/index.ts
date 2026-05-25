import type { Knex } from "knex";
import type {
    CmsGroup,
    CmsGroupStorageOperations,
    CmsGroupStorageOperationsCreateParams,
    CmsGroupStorageOperationsDeleteParams,
    CmsGroupStorageOperationsGetParams,
    CmsGroupStorageOperationsListParams,
    CmsGroupStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import type { TableNameResolver } from "~/utils/TableNameResolver.js";
import type { IGroupRow } from "./types.js";
import { GROUP_COLUMNS } from "./types.js";
import { groupToRow } from "./mappers.js";
import { rowToGroup } from "./mappers.js";
import { parseSortField } from "~/utils/parseSortField.js";

interface CreateGroupsStorageOperationsParams {
    knex: Knex;
    tableNameResolver: TableNameResolver;
}

const GROUPS_ENTITY = "groups";

export const createGroupsStorageOperations = (
    params: CreateGroupsStorageOperationsParams
): CmsGroupStorageOperations => {
    const { knex, tableNameResolver } = params;

    const table = (tenant: string) => {
        const tableName = tableNameResolver.resolve(tenant, GROUPS_ENTITY);

        return knex<IGroupRow>(tableName);
    };

    const get = async (getParams: CmsGroupStorageOperationsGetParams): Promise<CmsGroup | null> => {
        const row = await table(getParams.tenant).where("id", getParams.id).first();

        if (!row) {
            return null;
        }

        return rowToGroup(row);
    };

    const list = async (listParams: CmsGroupStorageOperationsListParams): Promise<CmsGroup[]> => {
        const { where, sort } = listParams;

        const query = table(where.tenant);

        if (sort && sort.length > 0) {
            for (const sortField of sort) {
                const [field, direction] = parseSortField(sortField);
                query.orderBy(field, direction);
            }
        }

        const rows = await query.select<IGroupRow[]>([...GROUP_COLUMNS]);

        return rows.map(rowToGroup);
    };

    const create = async (createParams: CmsGroupStorageOperationsCreateParams): Promise<void> => {
        const row = groupToRow(createParams.group);

        await table(createParams.group.tenant).insert(row);
    };

    const update = async (updateParams: CmsGroupStorageOperationsUpdateParams): Promise<void> => {
        const row = groupToRow(updateParams.group);

        await table(updateParams.group.tenant).where("id", updateParams.group.id).update(row);
    };

    const del = async (deleteParams: CmsGroupStorageOperationsDeleteParams): Promise<void> => {
        await table(deleteParams.group.tenant).where("id", deleteParams.group.id).delete();
    };

    return {
        get,
        list,
        create,
        update,
        delete: del
    };
};
