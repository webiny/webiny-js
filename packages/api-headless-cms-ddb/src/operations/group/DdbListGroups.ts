import type {
    CmsGroup,
    CmsGroupStorageOperationsListParams
} from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { sortItems } from "@webiny/db-dynamodb";
import { ListGroupsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/group/ListGroupsStorageOperation.js";
import { CmsDdbGroupEntity } from "~/abstractions/CmsDdbGroupEntity.js";
import { FilterUtil } from "@webiny/db-dynamodb/feature/FilterUtil/index.js";
import { createPartitionKey } from "./keys.js";

class DdbListGroupsImpl implements ListGroupsStorageOperation.Interface {
    constructor(
        private entity: CmsDdbGroupEntity.Interface,
        private filterUtil: FilterUtil.Interface
    ) {}

    async execute(params: CmsGroupStorageOperationsListParams) {
        const { sort, where } = params;

        let records: CmsGroup[] = [];
        try {
            const ddbRecords = await this.entity.queryAll({
                partitionKey: createPartitionKey(where),
                options: { gte: " " }
            });
            records = ddbRecords.map(item => item.data);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list groups.",
                ex.code || "LIST_GROUP_ERROR",
                { error: ex, ...params, sort, where }
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

        return sortItems({ items: filteredItems, sort });
    }
}

export const DdbListGroups = ListGroupsStorageOperation.createImplementation({
    implementation: DdbListGroupsImpl,
    dependencies: [CmsDdbGroupEntity, FilterUtil]
});
