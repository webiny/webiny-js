import type { CmsModelStorageOperationsGetParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { GetModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/GetModelStorageOperation.js";
import { CmsDdbModelEntity } from "~/abstractions/CmsDdbModelEntity.js";
import { createKeys } from "./keys.js";

class DdbGetModelImpl implements GetModelStorageOperation.Interface {
    constructor(private entity: CmsDdbModelEntity.Interface) {}

    async execute(params: CmsModelStorageOperationsGetParams) {
        const keys = createKeys(params);
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
    dependencies: [CmsDdbModelEntity]
});
