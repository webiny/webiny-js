import type {
    CmsGroup,
    CmsGroupStorageOperations,
    CmsGroupStorageOperationsCreateParams,
    CmsGroupStorageOperationsDeleteParams,
    CmsGroupStorageOperationsGetParams,
    CmsGroupStorageOperationsListParams,
    CmsGroupStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { filterItems, sortItems, ValueFilterPlugin } from "@webiny/db-dynamodb";
import type { PluginsContainer } from "@webiny/plugins";
import type { IGroupEntity } from "~/definitions/types.js";

interface PartitionKeyParams {
    tenant: string;
}
const createPartitionKey = (params: PartitionKeyParams): string => {
    const { tenant } = params;
    return `T#${tenant}#CMS#CMG`;
};

interface SortKeyParams {
    id: string;
}
const createSortKeys = (params: SortKeyParams): string => {
    const { id } = params;
    return id;
};

interface Keys {
    PK: string;
    SK: string;
    GSI_TENANT: string;
}
const createKeys = (params: PartitionKeyParams & SortKeyParams): Keys => {
    return {
        PK: createPartitionKey(params),
        SK: createSortKeys(params),
        GSI_TENANT: params.tenant
    };
};

const createType = (): string => {
    return "cms.group";
};

interface CreateGroupsStorageOperationsParams {
    entity: IGroupEntity;
    plugins: PluginsContainer;
}
export const createGroupsStorageOperations = (
    params: CreateGroupsStorageOperationsParams
): CmsGroupStorageOperations => {
    const { entity, plugins } = params;

    const filteringPlugins = plugins.byType<ValueFilterPlugin>(ValueFilterPlugin.type);
    if (filteringPlugins.length === 0) {
        throw new WebinyError(
            "DynamoDB filtering plugins not loaded.",
            "MISSING_DYNAMODB_FILTERING_PLUGINS"
        );
    }

    const create = async (params: CmsGroupStorageOperationsCreateParams) => {
        const { group } = params;
        const keys = createKeys(group);
        try {
            await entity.put({
                data: group,
                TYPE: createType(),
                ...keys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not create group.",
                ex.code || "CREATE_GROUP_ERROR",
                {
                    error: ex,
                    group,
                    keys
                }
            );
        }
    };
    const update = async (params: CmsGroupStorageOperationsUpdateParams) => {
        const { group } = params;
        const keys = createKeys(group);
        try {
            await entity.put({
                data: group,
                TYPE: createType(),
                ...keys
            });
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update group.",
                ex.code || "UPDATE_GROUP_ERROR",
                {
                    error: ex,
                    group,
                    keys
                }
            );
        }
    };
    const deleteGroup = async (params: CmsGroupStorageOperationsDeleteParams) => {
        const { group } = params;
        const keys = createKeys(group);
        try {
            await entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete group.",
                ex.code || "DELETE_GROUP_ERROR",
                {
                    error: ex,
                    group,
                    keys
                }
            );
        }
    };
    const get = async (params: CmsGroupStorageOperationsGetParams) => {
        const keys = createKeys(params);

        try {
            const result = await entity.get(keys);

            return result?.data || null;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get group.",
                ex.code || "GET_GROUP_ERROR",
                {
                    error: ex,
                    ...params,
                    keys
                }
            );
        }
    };
    const list = async (params: CmsGroupStorageOperationsListParams) => {
        const { sort, where } = params;

        let records: CmsGroup[] = [];
        try {
            const ddbRecords = await entity.queryAll({
                partitionKey: createPartitionKey(where),
                options: {
                    gte: " "
                }
            });
            records = ddbRecords.map(item => item.data);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list groups.",
                ex.code || "LIST_GROUP_ERROR",
                {
                    error: ex,
                    ...params,
                    sort,
                    where
                }
            );
        }

        const filteredItems = filterItems({
            items: records,
            where,
            fields: [],
            plugins
        });
        if (!sort || sort.length === 0) {
            return filteredItems;
        }

        return sortItems({
            items: filteredItems,
            sort
        });
    };

    return {
        create,
        update,
        delete: deleteGroup,
        get,
        list
    };
};
