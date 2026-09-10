import type {
    CmsModel,
    CmsEntryStorageOperationsDeleteEntriesParams
} from "@webiny/api-headless-cms/types/index.js";
import { DeleteMultipleEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.js";
import { parseIdentifier } from "@webiny/utils";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { RemoveEntry } from "~/features/SyncWriter/abstractions/RemoveEntry.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class PgOsDeleteMultipleEntriesImpl implements DeleteMultipleEntriesStorageOperation.Interface {
    constructor(
        private syncHelpers: SyncHelpers.Interface,
        private removeEntry: RemoveEntry.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private inner: DeleteMultipleEntriesStorageOperation.Interface
    ) {}

    async execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteEntriesParams) {
        await this.syncHelpers.ensureSyncTable();
        const storageModel = this.storageModelProvider.getModel(model);
        await this.inner.execute(model, params);

        for (const id of params.entries) {
            const { id: entryId } = parseIdentifier(id);
            await this.removeEntry.execute({ model: storageModel, entryId });
        }
    }
}

export const PgOsDeleteMultipleEntries = DeleteMultipleEntriesStorageOperation.createDecorator({
    decorator: PgOsDeleteMultipleEntriesImpl,
    dependencies: [SyncHelpers, RemoveEntry, CmsStorageModelProvider]
});
