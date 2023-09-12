import { createCmsModelFieldConvertersAttachFactory } from "@webiny/api-headless-cms/utils/converters/valueKeyStorageConverter";
import { getPlugins } from "~tests/migrations/5.37.0/002/ddb-es/mocks/plugins";
import { CmsModel, StorageOperationsCmsModel } from "@webiny/api-headless-cms/types";

const storageModels: Record<string, StorageOperationsCmsModel> = {};

const factory = createCmsModelFieldConvertersAttachFactory(getPlugins());
export const getStorageModel = (model: CmsModel) => {
    const key = `${model.tenant}:${model.locale}:${model.modelId}`;
    if (storageModels[key]) {
        return storageModels[key];
    }
    return (storageModels[key] = factory(model));
};
