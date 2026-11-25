import type { CmsModelStorageOperationsCreateParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { convertException } from "@webiny/utils";
import { CreateModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/CreateModelStorageOperation.js";
import { ScopeTenant } from "@webiny/api-core/features/tenancy/ScopeTenant/index.js";
import { CmsDdbModelEntity } from "~/abstractions/CmsDdbModelEntity.js";
import { createKeys, createType } from "./keys.js";

class DdbCreateModelImpl implements CreateModelStorageOperation.Interface {
    constructor(
        private entity: CmsDdbModelEntity.Interface,
        private scopeTenant: ScopeTenant.Interface
    ) {}

    async execute(params: CmsModelStorageOperationsCreateParams) {
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
            throw new WebinyError(`Could not create CMS Content Model.`, "CREATE_MODEL_ERROR", {
                error: convertException(ex),
                model,
                keys
            });
        }
    }
}

export const DdbCreateModel = CreateModelStorageOperation.createImplementation({
    implementation: DdbCreateModelImpl,
    dependencies: [CmsDdbModelEntity, ScopeTenant]
});
