import type {
    CmsContext,
    CmsEntryValues,
    CmsModel,
    StorageOperationsCmsModel
} from "~/types/index.js";
import { createValueKeyToStorageConverter } from "./valueKeyToStorageConverter.js";
import { createValueKeyFromStorageConverter } from "./valueKeyFromStorageConverter.js";
import { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

export const createCmsModelFieldConvertersAttachFactory = (context: CmsContext) => {
    return <T extends CmsEntryValues = CmsEntryValues>(
        model: StorageOperationsCmsModel | CmsModel
    ): StorageOperationsCmsModel<T> => {
        const storageModel = model as Partial<StorageOperationsCmsModel<T>>;
        if (!!storageModel.convertValueKeyToStorage && !!storageModel.convertValueKeyFromStorage) {
            return storageModel as StorageOperationsCmsModel<T>;
        }

        const fieldRegistry = context.container.resolve(CmsModelFieldToGraphQLRegistry);
        return {
            ...model,
            convertValueKeyToStorage: createValueKeyToStorageConverter<T>({
                model,
                plugins: context.plugins,
                fieldRegistry
            }),
            convertValueKeyFromStorage: createValueKeyFromStorageConverter<T>({
                model,
                plugins: context.plugins,
                fieldRegistry
            })
        };
    };
};
