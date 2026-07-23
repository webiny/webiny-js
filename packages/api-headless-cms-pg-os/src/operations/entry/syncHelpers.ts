import type {
    CmsEntry,
    CmsEntryStorageOperations,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import type { WriteEntry } from "~/features/SyncWriter/abstractions/WriteEntry.js";
import type { WriteLatest } from "~/features/SyncWriter/abstractions/WriteLatest.js";
import type { WritePublished } from "~/features/SyncWriter/abstractions/WritePublished.js";
import type { RemovePublished } from "~/features/SyncWriter/abstractions/RemovePublished.js";
import { parseIdentifier } from "@webiny/utils";

export interface SyncHelpers {
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

interface CreateSyncHelpersParams {
    syncTableManager: SyncTableManager.Interface;
    writeEntry: WriteEntry.Interface;
    writeLatest: WriteLatest.Interface;
    writePublished: WritePublished.Interface;
    removePublished: RemovePublished.Interface;
    sqlOps: CmsEntryStorageOperations;
}

export const createSyncHelpers = (params: CreateSyncHelpersParams): SyncHelpers => {
    const { syncTableManager, writeEntry, writeLatest, writePublished, removePublished, sqlOps } =
        params;

    const ensureSyncTable = async (): Promise<void> => {
        await syncTableManager.ensureTable();
    };

    const writeSyncForEntry = async <T extends CmsEntryValues>(
        model: StorageOperationsCmsModel<T>,
        entry: CmsEntry<T>,
        storageEntry: CmsStorageEntry<T>
    ): Promise<void> => {
        await writeEntry.execute({ model, entry, storageEntry });
    };

    const resyncLatestAndPublishedFromPg = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        model: StorageOperationsCmsModel<T>,
        id: string
    ): Promise<void> => {
        const latest = await sqlOps.getLatestRevisionByEntryId<T>(initialModel, { id });
        if (latest) {
            await writeLatest.execute({
                model,
                entry: latest,
                storageEntry: latest
            });
        }

        const published = await sqlOps.getPublishedRevisionByEntryId<T>(initialModel, { id });
        if (published) {
            await writePublished.execute({
                model,
                entry: published,
                storageEntry: published
            });
        } else {
            const { id: entryId } = parseIdentifier(id);
            await removePublished.execute({ model, entryId });
        }
    };

    return { ensureSyncTable, writeSyncForEntry, resyncLatestAndPublishedFromPg };
};
