import type { CmsModelStorageOperationsDeleteParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { DeleteModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/DeleteModelStorageOperation.js";
import { CmsDdbModelEntity } from "~/abstractions/CmsDdbModelEntity.js";
import { createKeys } from "./keys.js";

class DdbDeleteModelImpl implements DeleteModelStorageOperation.Interface {
    constructor(private entity: CmsDdbModelEntity.Interface) {}

    async execute(params: CmsModelStorageOperationsDeleteParams) {
        const { model } = params;
        const keys = createKeys(model);
        try {
            await this.entity.delete(keys);
        } catch (ex) {
            throw new WebinyError(
                ex.message || "Could not delete model.",
                ex.code || "MODEL_DELETE_ERROR",
                { error: ex, model, keys }
            );
        }
    }
}

export const DdbDeleteModel = DeleteModelStorageOperation.createImplementation({
    implementation: DdbDeleteModelImpl,
    dependencies: [CmsDdbModelEntity]
});
