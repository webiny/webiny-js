import type { CmsModelStorageOperationsUpdateParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { UpdateModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/UpdateModelStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsDdbModelEntity } from "~/abstractions/CmsDdbModelEntity.js";
import { createKeys, createType } from "./keys.js";

class DdbUpdateModelImpl implements UpdateModelStorageOperation.Interface {
    constructor(
        private entity: CmsDdbModelEntity.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute(params: CmsModelStorageOperationsUpdateParams) {
        const { model } = params;
        const tenant = this.scopeTenant.getId(model.tenant);
        const keys = createKeys({ tenant, modelId: model.modelId });
        try {
            await this.entity.put({
                data: { ...model, tenant },
                ...keys,
                TYPE: createType()
            });
            return model;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not update model.",
                ex.code || "MODEL_UPDATE_ERROR",
                { error: ex, model, keys }
            );
        }
    }
}

export const DdbUpdateModel = UpdateModelStorageOperation.createImplementation({
    implementation: DdbUpdateModelImpl,
    dependencies: [CmsDdbModelEntity, ScopeTenant]
});
