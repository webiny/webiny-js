import type { CmsModelStorageOperationsGetParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { GetModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/GetModelStorageOperation.js";
import { CmsDdbEsModelEntity } from "~/abstractions/CmsDdbEsModelEntity.js";
import { createKeys } from "./keys.js";

class DdbEsGetModelImpl implements GetModelStorageOperation.Interface {
    constructor(private entity: CmsDdbEsModelEntity.Interface) {}

    async execute(params: CmsModelStorageOperationsGetParams) {
        const keys = createKeys(params);

        try {
            const result = await this.entity.get(keys);

            return result ? result.data : null;
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not get model.",
                ex.code || "MODEL_GET_ERROR",
                {
                    error: ex,
                    keys
                }
            );
        }
    }
}

export const DdbEsGetModel = GetModelStorageOperation.createImplementation({
    implementation: DdbEsGetModelImpl,
    dependencies: [CmsDdbEsModelEntity]
});
