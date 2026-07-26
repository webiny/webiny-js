import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntry,
    CmsEntryValues,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse
} from "~/types/types.js";

export interface IListEntriesStorageOperation {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>>;
}

export const ListEntriesStorageOperation = createAbstraction<IListEntriesStorageOperation>(
    "Cms/Entry/ListEntriesStorageOperation"
);

export namespace ListEntriesStorageOperation {
    export type Interface = IListEntriesStorageOperation;
}
