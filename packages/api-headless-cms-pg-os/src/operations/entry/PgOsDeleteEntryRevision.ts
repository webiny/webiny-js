import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsDeleteRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryRevisionStorageOperation.js";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { WriteLatest } from "~/features/SyncWriter/abstractions/WriteLatest.js";
import { RemoveLatest } from "~/features/SyncWriter/abstractions/RemoveLatest.js";
import { RemovePublished } from "~/features/SyncWriter/abstractions/RemovePublished.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class PgOsDeleteEntryRevisionImpl implements DeleteEntryRevisionStorageOperation.Interface {
    constructor(
        private syncHelpers: SyncHelpers.Interface,
        private writeLatest: WriteLatest.Interface,
        private removeLatest: RemoveLatest.Interface,
        private removePublished: RemovePublished.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private inner: DeleteEntryRevisionStorageOperation.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ) {
        await this.syncHelpers.ensureSyncTable();
        await this.inner.execute(model, params);
        const storageModel = this.storageModelProvider.getModel<T>(model);

        const { latestStorageEntry, storageEntry } = params;
        if (latestStorageEntry) {
            await this.writeLatest.execute({
                model: storageModel,
                entry: latestStorageEntry,
                storageEntry: latestStorageEntry
            });
        } else {
            await this.removeLatest.execute({
                model: storageModel,
                entryId: storageEntry.entryId
            });
        }

        if (storageEntry.status === "published") {
            await this.removePublished.execute({
                model: storageModel,
                entryId: storageEntry.entryId
            });
        }
    }
}

export const PgOsDeleteEntryRevision = DeleteEntryRevisionStorageOperation.createDecorator({
    decorator: PgOsDeleteEntryRevisionImpl,
    dependencies: [SyncHelpers, WriteLatest, RemoveLatest, RemovePublished, CmsStorageModelProvider]
});
