import type { CmsModelStorageOperationsListParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { ListModelsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/ListModelsStorageOperation.js";
import { CmsDdbModelEntity } from "~/abstractions/CmsDdbModelEntity.js";
import { createPartitionKey } from "./keys.js";

class DdbListModelsImpl implements ListModelsStorageOperation.Interface {
    constructor(private entity: CmsDdbModelEntity.Interface) {}

    async execute(params: CmsModelStorageOperationsListParams) {
        const { where } = params;
        const partitionKey = createPartitionKey(where);
        try {
            const result = await this.entity.queryAll({
                partitionKey,
                options: { gte: " " }
            });
            return result.map(item => item.data);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list models.",
                ex.code || "MODEL_LIST_ERROR",
                { error: ex, partitionKey }
            );
        }
    }
}

export const DdbListModels = ListModelsStorageOperation.createImplementation({
    implementation: DdbListModelsImpl,
    dependencies: [CmsDdbModelEntity]
});
