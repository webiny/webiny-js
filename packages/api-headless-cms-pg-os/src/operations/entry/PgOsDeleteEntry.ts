import type {
    CmsModel,
    CmsEntryStorageOperationsDeleteParams
} from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { RemoveEntry } from "~/features/SyncWriter/abstractions/RemoveEntry.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class PgOsDeleteEntryImpl implements DeleteEntryStorageOperation.Interface {
    constructor(
        private syncHelpers: SyncHelpers.Interface,
        private removeEntry: RemoveEntry.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private inner: DeleteEntryStorageOperation.Interface
    ) {}

    async execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteParams) {
        await this.syncHelpers.ensureSyncTable();
        const storageModel = this.storageModelProvider.getModel(model);
        const { entryId } = params.entry;
        await this.inner.execute(model, params);
        await this.removeEntry.execute({ model: storageModel, entryId });
    }
}

export const PgOsDeleteEntry = DeleteEntryStorageOperation.createDecorator({
    decorator: PgOsDeleteEntryImpl,
    dependencies: [SyncHelpers, RemoveEntry, CmsStorageModelProvider]
});
