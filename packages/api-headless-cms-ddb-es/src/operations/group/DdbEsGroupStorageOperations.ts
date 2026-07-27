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
import { createImplementation } from "@webiny/feature/api";
import { GroupStorageOperations } from "@webiny/api-headless-cms/features/shared/storageOperations/GroupStorageOperations.js";
import { CmsDdbEsGroupEntity } from "~/abstractions/CmsDdbEsGroupEntity.js";
import { FilterUtil } from "@webiny/db-dynamodb/exports/api/db.js";

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

class DdbEsGroupStorageOperationsImpl implements CmsGroupStorageOperations {
    constructor(
        private entity: CmsDdbEsGroupEntity.Interface,
        private filterUtil: FilterUtil.Interface
    ) {}

    public async create(params: CmsGroupStorageOperationsCreateParams) {
        const { group } = params;
        const keys = createKeys(group);
        try {
            await this.entity.put({
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
    }

    public async update(params: CmsGroupStorageOperationsUpdateParams) {
        const { group } = params;
        const keys = createKeys(group);
        try {
            await this.entity.put({
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
    }

    public async delete(params: CmsGroupStorageOperationsDeleteParams) {
        const { group } = params;
        const keys = createKeys(group);
        try {
            await this.entity.delete(keys);
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
    }

    public async get(params: CmsGroupStorageOperationsGetParams) {
        const keys = createKeys(params);

        try {
            const result = await this.entity.get(keys);

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
    }

    public async list(params: CmsGroupStorageOperationsListParams) {
        const { sort, where } = params;

        let records: CmsGroup[] = [];
        try {
            const ddbRecords = await this.entity.queryAll({
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

        const filteredItems = this.filterUtil.filter({
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
    }
}

export const DdbEsGroupStorageOperations = createImplementation({
    abstraction: GroupStorageOperations,
    implementation: DdbEsGroupStorageOperationsImpl,
    dependencies: [CmsDdbEsGroupEntity, FilterUtil]
});
