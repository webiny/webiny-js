import {
    CmsGroup,
    CmsGroupStorageOperations,
    CmsGroupStorageOperationsCreateParams,
    CmsGroupStorageOperationsDeleteParams,
    CmsGroupStorageOperationsGetParams,
    CmsGroupStorageOperationsListParams,
    CmsGroupStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types";
import { Entity } from "dynamodb-toolbox";
import WebinyError from "@webiny/error";
import { get as getRecord } from "@webiny/db-dynamodb/utils/get";
import { cleanupItem } from "@webiny/db-dynamodb/utils/cleanup";
import { queryAll, QueryAllParams } from "@webiny/db-dynamodb/utils/query";
import { filterItems } from "@webiny/db-dynamodb/utils/filter";
import { PluginsContainer } from "@webiny/plugins";
import { ValueFilterPlugin } from "@webiny/db-dynamodb/plugins/definitions/ValueFilterPlugin";
import { sortItems } from "@webiny/db-dynamodb/utils/sort";

interface PartitionKeyParams {
    tenant: string;
    locale: string;
}
const createPartitionKey = (params: PartitionKeyParams): string => {
    const { tenant, locale } = params;
    return `T#${tenant}#L#${locale}#CMS#CMG`;
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
}
const createKeys = (params: PartitionKeyParams & SortKeyParams): Keys => {
    return {
        PK: createPartitionKey(params),
        SK: createSortKeys(params)
    };
};

const createType = (): string => {
    return "cms.group";
};

export interface CreateGroupsStorageOperationsParams {
    entity: Entity<any>;
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
                ...group,
                TYPE: createType(),
                ...keys
            });
            return group;
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
                ...group,
                TYPE: createType(),
                ...keys
            });
            return group;
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
        // TODO make sure that group has locale and tenant on it - add it in the crud just in case
        const keys = createKeys(group);

        try {
            await entity.delete(keys);
            return group;
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
            const group = await getRecord<CmsGroup>({
                entity,
                keys
            });

            return cleanupItem(entity, group);
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
        const { sort, where: initialWhere } = params;

        const queryAllParams: QueryAllParams = {
            entity,
            partitionKey: createPartitionKey(initialWhere),
            options: {
                gte: " "
            }
        };

        let records: CmsGroup[] = [];
        try {
            records = await queryAll(queryAllParams);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list groups.",
                ex.code || "LIST_GROUP_ERROR",
                {
                    error: ex,
                    ...params,
                    sort,
                    where: initialWhere
                }
            );
        }

        const where: Partial<CmsGroupStorageOperationsListParams["where"]> = {
            ...initialWhere
        };
        delete where["tenant"];
        delete where["locale"];

        const filteredItems = filterItems({
            items: records,
            where,
            fields: [],
            plugins
        });

        if (!sort || sort.length === 0 || filteredItems.length === 0) {
            return filteredItems;
        }
        return sortItems({
            items: filteredItems,
            sort,
            fields: []
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
