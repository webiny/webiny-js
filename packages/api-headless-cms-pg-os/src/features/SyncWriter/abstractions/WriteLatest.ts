import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";

export interface IWriteLatestParams<T extends CmsEntryValues = CmsEntryValues> {
    model: StorageOperationsCmsModel<T>;
    entry: CmsEntry<T>;
    storageEntry: CmsStorageEntry<T>;
}

export interface IWriteLatest {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        params: IWriteLatestParams<T>
    ): Promise<void>;
}

export const WriteLatest = createAbstraction<IWriteLatest>("Cms/Pg/Os/SyncWriter/WriteLatest");

export namespace WriteLatest {
    export type Interface = IWriteLatest;
    export type Params<T extends CmsEntryValues = CmsEntryValues> = IWriteLatestParams<T>;
}
