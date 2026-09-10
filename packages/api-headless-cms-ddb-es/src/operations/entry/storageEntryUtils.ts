import type {
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";

interface ConvertStorageEntryParams<T extends CmsEntryValues = CmsEntryValues> {
    storageEntry: CmsStorageEntry<T>;
    model: StorageOperationsCmsModel<T>;
}

export const convertToStorageEntry = <T extends CmsEntryValues = CmsEntryValues>(
    params: ConvertStorageEntryParams<T>
): CmsStorageEntry<T> => {
    const { model, storageEntry } = params;

    const values = model.convertValueKeyToStorage({
        fields: model.fields,
        values: storageEntry.values
    });
    return {
        ...storageEntry,
        values
    };
};
