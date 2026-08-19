import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsUpdateParams
} from "@webiny/api-headless-cms/types/index.js";
import { UpdateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class PgOsUpdateEntryImpl implements UpdateEntryStorageOperation.Interface {
    constructor(
        private syncHelpers: SyncHelpers.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private inner: UpdateEntryStorageOperation.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ) {
        await this.syncHelpers.ensureSyncTable();
        const result = await this.inner.execute(model, params);
        const storageModel = this.storageModelProvider.getModel<T>(model);
        await this.syncHelpers.writeSyncForEntry(storageModel, params.entry, params.storageEntry);
        return result;
    }
}

export const PgOsUpdateEntry = UpdateEntryStorageOperation.createDecorator({
    decorator: PgOsUpdateEntryImpl,
    dependencies: [SyncHelpers, CmsStorageModelProvider]
});
