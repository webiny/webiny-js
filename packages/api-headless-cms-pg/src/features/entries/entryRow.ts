import type {
    CmsEntry,
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";

export interface IEntryRow {
    tenant: string;
    model_id: string;
    id: string;
    entry_id: string;
    version: number;
    is_latest: boolean;
    is_published: boolean;
    wby_deleted: boolean;
    data: CmsStorageEntry;
}

/**
 * Entry values are stored by `storageId` (as in the DynamoDB storages), not by `fieldId`: a field
 * renamed in the admin UI keeps its `storageId`, so its stored values stay with it, and a field
 * deleted and added again under the same name gets a new `storageId`, so it doesn't see the old
 * field's values.
 */
export const entryToRow = (entry: CmsStorageEntry, model: StorageOperationsCmsModel): IEntryRow => {
    const values = model.convertValueKeyToStorage({ fields: model.fields, values: entry.values });
    return {
        tenant: entry.tenant,
        model_id: entry.modelId,
        id: entry.id,
        entry_id: entry.entryId,
        version: entry.version,
        is_latest: !!entry.isLatest,
        is_published: !!entry.isPublished,
        wby_deleted: !!entry.wbyDeleted,
        // jsonb; serialized explicitly so Date values become ISO strings, as in the SQL storage.
        data: JSON.stringify({ ...entry, values }) as unknown as CmsStorageEntry
    };
};

/* The stored entry with its values keyed by `fieldId` again. */
export const rowToEntry = <T extends CmsEntryValues = CmsEntryValues>(
    row: Pick<IEntryRow, "data">,
    model: StorageOperationsCmsModel
): CmsEntry<T> => {
    const values = model.convertValueKeyFromStorage({
        fields: model.fields,
        values: row.data.values
    });
    return { ...row.data, values } as unknown as CmsEntry<T>;
};
