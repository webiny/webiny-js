import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";

export interface IWritePublishedParams<T extends CmsEntryValues = CmsEntryValues> {
    model: StorageOperationsCmsModel<T>;
    entry: CmsEntry<T>;
    storageEntry: CmsStorageEntry<T>;
}

export interface IWritePublished {
    execute(params: IWritePublishedParams): Promise<void>;
}

export const WritePublished = createAbstraction<IWritePublished>(
    "Cms/Pg/Os/SyncWriter/WritePublished"
);

export namespace WritePublished {
    export type Interface = IWritePublished;
    export type Params = IWritePublishedParams;
}
