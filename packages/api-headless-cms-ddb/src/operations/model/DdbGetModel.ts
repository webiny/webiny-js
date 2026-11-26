import type { CmsModelStorageOperationsGetParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { GetModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/GetModelStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsDdbModelEntity } from "~/abstractions/CmsDdbModelEntity.js";
import { createKeys } from "./keys.js";

class DdbGetModelImpl implements GetModelStorageOperation.Interface {
    constructor(
        private entity: CmsDdbModelEntity.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute(params: CmsModelStorageOperationsGetParams) {
        const tenant = this.scopeTenant.getId();
        const keys = createKeys({ tenant, modelId: params.modelId });
        try {
            const result = await this.entity.get(keys);
            return result?.data || null;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get model.",
                ex.code || "MODEL_GET_ERROR",
                { error: ex, keys }
            );
        }
    }
}

export const DdbGetModel = GetModelStorageOperation.createImplementation({
    implementation: DdbGetModelImpl,
    dependencies: [CmsDdbModelEntity, ScopeTenant]
});
