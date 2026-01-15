import type {
    CmsEntry, CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { convertEntryKeysToStorage } from "./convertEntryKeys.js";

interface TransformKeysParams<T extends CmsEntryValues = CmsEntryValues> {
    model: StorageOperationsCmsModel<T>;
    entry: CmsEntry<T>;
    storageEntry: CmsStorageEntry<T>;
}

export const transformEntryKeys = <T extends CmsEntryValues = CmsEntryValues>(params: TransformKeysParams<T>) => {
    const { model, entry, storageEntry } = params;
    return {
        entry: convertEntryKeysToStorage<T>({
            model,
            entry
        }),
        storageEntry: convertEntryKeysToStorage<T>({
            model,
            entry: storageEntry
        })
    };
};
