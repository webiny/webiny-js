import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";

export interface IWriteEntryParams<T extends CmsEntryValues = CmsEntryValues> {
    model: StorageOperationsCmsModel<T>;
    entry: CmsEntry<T>;
    storageEntry: CmsStorageEntry<T>;
}

export interface IWriteEntry {
    execute(params: IWriteEntryParams): Promise<void>;
}

export const WriteEntry = createAbstraction<IWriteEntry>("Cms/Pg/Os/SyncWriter/WriteEntry");

export namespace WriteEntry {
    export type Interface = IWriteEntry;
    export type Params = IWriteEntryParams;
}
