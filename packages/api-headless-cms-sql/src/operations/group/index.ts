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
import { KnexInstance } from "~/features/schema/abstractions/index.js";
import { TableNameResolver } from "~/features/schema/abstractions/index.js";
import { GroupSchemaManager } from "~/features/schema/abstractions/index.js";
import { groupToRow } from "./mappers.js";
import { rowToGroup } from "./mappers.js";
import { parseSortField } from "~/utils/parseSortField.js";

const GROUPS_ENTITY = "groups";

export const createGroupsStorageOperations = (
    knex: KnexInstance.Interface,
    tableNameResolver: TableNameResolver.Interface,
    groupSchemaManager: GroupSchemaManager.Interface
): CmsGroupStorageOperations => {
    const ensureSchema = async (tenant: string) => {
        const name = tableNameResolver.resolve(tenant, GROUPS_ENTITY);

        await groupSchemaManager.ensure(name);
    };

    const query = (tenant: string) => {
        const name = tableNameResolver.resolve(tenant, GROUPS_ENTITY);

        return knex<IGroupRow>(name);
    };

    const get = async (getParams: CmsGroupStorageOperationsGetParams): Promise<CmsGroup | null> => {
        await ensureSchema(getParams.tenant);

        const row = await query(getParams.tenant).where("id", getParams.id).first();

        if (!row) {
            return null;
        }

        return rowToGroup(row);
    };

    const list = async (listParams: CmsGroupStorageOperationsListParams): Promise<CmsGroup[]> => {
        const { where, sort } = listParams;

        await ensureSchema(where.tenant);

        const qb = query(where.tenant);

        if (sort && sort.length > 0) {
            for (const sortField of sort) {
                const [field, direction] = parseSortField(sortField);
                qb.orderBy(field, direction);
            }
        }

        const rows = await qb.select<IGroupRow[]>([...GROUP_COLUMNS]);

        return rows.map(rowToGroup);
    };

    const create = async (createParams: CmsGroupStorageOperationsCreateParams): Promise<void> => {
        const row = groupToRow(createParams.group);

        await ensureSchema(createParams.group.tenant);
        await query(createParams.group.tenant).insert(row);
    };

    const update = async (updateParams: CmsGroupStorageOperationsUpdateParams): Promise<void> => {
        const row = groupToRow(updateParams.group);

        await ensureSchema(updateParams.group.tenant);
        await query(updateParams.group.tenant).where("id", updateParams.group.id).update(row);
    };

    const del = async (deleteParams: CmsGroupStorageOperationsDeleteParams): Promise<void> => {
        await ensureSchema(deleteParams.group.tenant);
        await query(deleteParams.group.tenant).where("id", deleteParams.group.id).delete();
    };

    return {
        get,
        list,
        create,
        update,
        delete: del
    };
};
