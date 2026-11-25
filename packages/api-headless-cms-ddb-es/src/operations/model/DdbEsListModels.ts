import type { CmsModelStorageOperationsListParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { ListModelsStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/ListModelsStorageOperation.js";
import { CmsDdbEsModelEntity } from "~/abstractions/CmsDdbEsModelEntity.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { createPartitionKey } from "./keys.js";

class DdbEsListModelsImpl implements ListModelsStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsModelEntity.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute(params: CmsModelStorageOperationsListParams) {
        const { where } = params;
        const tenant = this.scopeTenant.getId(where?.tenant);
        const partitionKey = createPartitionKey({ tenant });
        try {
            const result = await this.entity.queryAll({
                partitionKey,
                options: {
                    gte: " "
                }
            });
            return result ? result.map(item => item.data) : [];
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not list models.",
                ex.code || "MODEL_LIST_ERROR",
                {
                    error: ex,
                    partitionKey
                }
            );
        }
    }
}

export const DdbEsListModels = ListModelsStorageOperation.createImplementation({
    implementation: DdbEsListModelsImpl,
    dependencies: [CmsDdbEsModelEntity, ScopeTenant]
});
