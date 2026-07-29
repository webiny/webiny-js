import type { CmsModelStorageOperationsCreateParams } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import { convertException } from "@webiny/utils";
import { CreateModelStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/model/CreateModelStorageOperation.js";
import { CmsDdbModelEntity } from "~/abstractions/CmsDdbModelEntity.js";
import { createKeys, createType } from "./keys.js";

class DdbCreateModelImpl implements CreateModelStorageOperation.Interface {
    constructor(private entity: CmsDdbModelEntity.Interface) {}

    async execute(params: CmsModelStorageOperationsCreateParams) {
        const { model } = params;
        const keys = createKeys(model);
        try {
            await this.entity.put({
                data: model,
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
    dependencies: [CmsDdbModelEntity]
});
