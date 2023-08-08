import {
    CmsEntry,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types";
import { convertEntryKeysToStorage } from "./convertEntryKeys";

interface TransformKeysParams {
    model: StorageOperationsCmsModel;
    entry: CmsEntry;
    storageEntry: CmsStorageEntry;
}

export const transformEntryKeys = (params: TransformKeysParams) => {
    const { model, entry, storageEntry } = params;
    return {
        entry: convertEntryKeysToStorage({
            model,
            entry
        }),
        storageEntry: convertEntryKeysToStorage({
            model,
            entry: storageEntry
        })
    };
};
