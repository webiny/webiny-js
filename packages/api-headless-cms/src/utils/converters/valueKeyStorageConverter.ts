import type {
    CmsContext,
    CmsEntryValues,
    CmsModel,
    StorageOperationsCmsModel
} from "~/types/index.js";
import { createValueKeyToStorageConverter } from "./valueKeyToStorageConverter.js";
import { createValueKeyFromStorageConverter } from "./valueKeyFromStorageConverter.js";
import { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";
import { CmsFieldConverter } from "~/fieldConverters/abstractions.js";

export const createCmsModelFieldConvertersAttachFactory = (context: CmsContext) => {
    return <T extends CmsEntryValues = CmsEntryValues>(
        model: StorageOperationsCmsModel | CmsModel
    ): StorageOperationsCmsModel<T> => {
        const storageModel = model as Partial<StorageOperationsCmsModel<T>>;
        if (!!storageModel.convertValueKeyToStorage && !!storageModel.convertValueKeyFromStorage) {
            return storageModel as StorageOperationsCmsModel<T>;
        }

        const fieldRegistry = context.container.resolve(CmsModelFieldToGraphQLRegistry);
        const fieldConverters = context.container.resolveAll(CmsFieldConverter);
        return {
            ...model,
            convertValueKeyToStorage: createValueKeyToStorageConverter<T>({
                model,
                fieldConverters,
                fieldRegistry
            }),
            convertValueKeyFromStorage: createValueKeyFromStorageConverter<T>({
                model,
                fieldConverters,
                fieldRegistry
            })
        };
    };
};
