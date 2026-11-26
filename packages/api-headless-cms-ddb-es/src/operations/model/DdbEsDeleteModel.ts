import type { CmsModelStorageOperationsDeleteParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { DeleteModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/DeleteModelStorageOperation.js";
import { CmsDdbEsModelEntity } from "~/abstractions/CmsDdbEsModelEntity.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { createKeys } from "./keys.js";

class DdbEsDeleteModelImpl implements DeleteModelStorageOperation.Interface {
    constructor(
        private entity: CmsDdbEsModelEntity.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute(params: CmsModelStorageOperationsDeleteParams): Promise<void> {
        const { model } = params;
        const tenant = this.scopeTenant.getId();
        const keys = createKeys({ tenant, modelId: model.modelId });

        try {
            await this.entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete model.",
                ex.code || "MODEL_DELETE_ERROR",
                {
                    error: ex,
                    model,
                    keys
                }
            );
        }
    }
}

export const DdbEsDeleteModel = DeleteModelStorageOperation.createImplementation({
    implementation: DdbEsDeleteModelImpl,
    dependencies: [CmsDdbEsModelEntity, ScopeTenant]
});
