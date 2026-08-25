import { createAbstraction } from "@webiny/feature/api";
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";

export interface ISyncHelpers {
    ensureSyncTable(): Promise<void>;
    writeSyncForEntry<T extends CmsEntryValues>(
        model: StorageOperationsCmsModel<T>,
        entry: CmsEntry<T>,
        storageEntry: CmsStorageEntry<T>
    ): Promise<void>;
    resyncLatestAndPublishedFromPg<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        model: StorageOperationsCmsModel<T>,
        id: string
    ): Promise<void>;
}

export const SyncHelpers = createAbstraction<ISyncHelpers>("Cms/Pg/Os/SyncWriter/SyncHelpers");

export namespace SyncHelpers {
    export type Interface = ISyncHelpers;
}
