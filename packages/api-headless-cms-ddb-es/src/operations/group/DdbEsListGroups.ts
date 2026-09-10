import type {
    CmsGroup,
    CmsGroupStorageOperationsListParams
} from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { sortItems } from "@webiny/db-dynamodb";
import { ListGroupsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/ListGroupsStorageOperation.js";
import { CmsDdbEsGroupEntity } from "~/abstractions/CmsDdbEsGroupEntity.js";
import { FilterUtil } from "@webiny/db-dynamodb/exports/api/db.js";
import { createPartitionKey } from "./keys.js";

class DdbEsListGroupsImpl implements ListGroupsStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsGroupEntity.Interface,
        private filterUtil: FilterUtil.Interface
    ) {}

    async execute(params: CmsGroupStorageOperationsListParams) {
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

export const DdbEsListGroups = ListGroupsStorageOperation.createImplementation({
    implementation: DdbEsListGroupsImpl,
    dependencies: [CmsDdbEsGroupEntity, FilterUtil]
});
