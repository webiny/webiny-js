import type {
    CmsEntry,
    CmsEntryStorageOperations,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { SyncWriter } from "./syncWriter.js";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";

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
    syncWriter: SyncWriter;
    sqlOps: CmsEntryStorageOperations;
}

const extractEntryId = (id: string): string => {
    const hashIdx = id.indexOf("#");
    if (hashIdx === -1) {
        return id;
    }
    return id.slice(0, hashIdx);
};

export { extractEntryId };

export const createSyncHelpers = (params: CreateSyncHelpersParams): SyncHelpers => {
    const { syncTableManager, syncWriter, sqlOps } = params;

    const ensureSyncTable = async (): Promise<void> => {
        await syncTableManager.ensureTable();
    };

    const writeSyncForEntry = async <T extends CmsEntryValues>(
        model: StorageOperationsCmsModel<T>,
        entry: CmsEntry<T>,
        storageEntry: CmsStorageEntry<T>
    ): Promise<void> => {
        await syncWriter.writeLatest({ model, entry, storageEntry });
        if (entry.status === "published") {
            await syncWriter.writePublished({ model, entry, storageEntry });
        }
    };

    const resyncLatestAndPublishedFromPg = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        model: StorageOperationsCmsModel<T>,
        id: string
    ): Promise<void> => {
        const latest = await sqlOps.getLatestRevisionByEntryId<T>(initialModel, { id });
        if (latest) {
            await syncWriter.writeLatest({ model, entry: latest, storageEntry: latest });
        }

        const published = await sqlOps.getPublishedRevisionByEntryId<T>(initialModel, { id });
        if (published) {
            await syncWriter.writePublished({ model, entry: published, storageEntry: published });
        } else {
            await syncWriter.removePublished({ model, entryId: extractEntryId(id) });
        }
    };

    return { ensureSyncTable, writeSyncForEntry, resyncLatestAndPublishedFromPg };
};
