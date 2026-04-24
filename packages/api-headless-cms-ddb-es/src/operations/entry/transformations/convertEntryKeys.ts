import type {
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";

interface ConvertStorageEntryParams<T extends CmsEntryValues = CmsEntryValues> {
    entry: CmsStorageEntry<T>;
    model: StorageOperationsCmsModel<T>;
}
export const convertEntryKeysToStorage = <T extends CmsEntryValues = CmsEntryValues>(
    params: ConvertStorageEntryParams<T>
): CmsStorageEntry<T> => {
    const { model, entry } = params;

    const values = model.convertValueKeyToStorage({
        fields: model.fields,
        values: entry.values
    });
    return {
        ...entry,
        values
    };
};

export const convertEntryKeysFromStorage = <T extends CmsEntryValues = CmsEntryValues>(
    params: ConvertStorageEntryParams<T>
): CmsStorageEntry<T> => {
    const { model, entry } = params;

    const values = model.convertValueKeyFromStorage({
        fields: model.fields,
        values: entry.values
    });
    return {
        ...entry,
        values
    };
};
