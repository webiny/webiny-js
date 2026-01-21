import type { PluginsContainer } from "@webiny/plugins";
import type { CmsEntryValues, CmsModel, StorageOperationsCmsModel } from "~/types/index.js";
import { createValueKeyToStorageConverter } from "./valueKeyToStorageConverter.js";
import { createValueKeyFromStorageConverter } from "./valueKeyFromStorageConverter.js";

export const createCmsModelFieldConvertersAttachFactory = (plugins: PluginsContainer) => {
    return <T extends CmsEntryValues = CmsEntryValues>(
        model: StorageOperationsCmsModel | CmsModel
    ): StorageOperationsCmsModel<T> => {
        const storageModel = model as Partial<StorageOperationsCmsModel<T>>;
        if (!!storageModel.convertValueKeyToStorage && !!storageModel.convertValueKeyFromStorage) {
            return storageModel as StorageOperationsCmsModel<T>;
        }
        return {
            ...model,
            convertValueKeyToStorage: createValueKeyToStorageConverter<T>({
                model,
                plugins
            }),
            convertValueKeyFromStorage: createValueKeyFromStorageConverter<T>({
                model,
                plugins
            })
        };
    };
};
