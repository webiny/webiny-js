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
import { sortItems } from "@webiny/db-dynamodb";
import { IGroupEntity } from "~/definitions/types.js";
import { FilterUtil } from "@webiny/db-dynamodb/exports/api/db.js";
import type { CmsContext } from "~/types.js";

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

interface IDynamoDbTableKeys {
    PK: string;
    SK: string;
    GSI_TENANT: string;
}
const createKeys = (params: PartitionKeyParams & SortKeyParams): IDynamoDbTableKeys => {
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
    container: CmsContext["container"];
}
export const createGroupsStorageOperations = (
    params: CreateGroupsStorageOperationsParams
): CmsGroupStorageOperations => {
    const { entity, container } = params;

    const filterUtil = container.resolve(FilterUtil);

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

            return result ? result.data : null;
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

        const filteredItems = filterUtil.filter({
            items: records,
            where,
            fields: []
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
