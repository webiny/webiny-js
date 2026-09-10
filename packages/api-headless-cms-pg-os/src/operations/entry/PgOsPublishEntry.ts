import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsPublishParams
} from "@webiny/api-headless-cms/types/index.js";
import { PublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { WriteEntry } from "~/features/SyncWriter/abstractions/WriteEntry.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class PgOsPublishEntryImpl implements PublishEntryStorageOperation.Interface {
    constructor(
        private syncHelpers: SyncHelpers.Interface,
        private writeEntry: WriteEntry.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private inner: PublishEntryStorageOperation.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsPublishParams<T>
    ) {
        await this.syncHelpers.ensureSyncTable();
        const result = await this.inner.execute(model, params);
        const storageModel = this.storageModelProvider.getModel<T>(model);
        await this.writeEntry.execute({
            model: storageModel,
            entry: params.entry,
            storageEntry: params.storageEntry
        });
        return result;
    }
}

export const PgOsPublishEntry = PublishEntryStorageOperation.createDecorator({
    decorator: PgOsPublishEntryImpl,
    dependencies: [SyncHelpers, WriteEntry, CmsStorageModelProvider]
});
