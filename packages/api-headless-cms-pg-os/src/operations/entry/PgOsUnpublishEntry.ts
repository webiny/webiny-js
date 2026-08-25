import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsUnpublishParams
} from "@webiny/api-headless-cms/types/index.js";
import { UnpublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UnpublishEntryStorageOperation.js";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { WriteLatest } from "~/features/SyncWriter/abstractions/WriteLatest.js";
import { RemovePublished } from "~/features/SyncWriter/abstractions/RemovePublished.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class PgOsUnpublishEntryImpl implements UnpublishEntryStorageOperation.Interface {
    constructor(
        private syncHelpers: SyncHelpers.Interface,
        private writeLatest: WriteLatest.Interface,
        private removePublished: RemovePublished.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private inner: UnpublishEntryStorageOperation.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ) {
        await this.syncHelpers.ensureSyncTable();
        const result = await this.inner.execute(model, params);
        const storageModel = this.storageModelProvider.getModel<T>(model);
        await this.writeLatest.execute({
            model: storageModel,
            entry: params.entry,
            storageEntry: params.storageEntry
        });
        await this.removePublished.execute({
            model: storageModel,
            entryId: params.entry.entryId
        });
        return result;
    }
}

export const PgOsUnpublishEntry = UnpublishEntryStorageOperation.createDecorator({
    decorator: PgOsUnpublishEntryImpl,
    dependencies: [SyncHelpers, WriteLatest, RemovePublished, CmsStorageModelProvider]
});
