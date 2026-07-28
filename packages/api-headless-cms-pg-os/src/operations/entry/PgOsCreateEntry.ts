import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsCreateParams
} from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class PgOsCreateEntryImpl implements CreateEntryStorageOperation.Interface {
    constructor(
        private syncHelpers: SyncHelpers.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private inner: CreateEntryStorageOperation.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ) {
        await this.syncHelpers.ensureSyncTable();
        const result = await this.inner.execute(model, params);
        const storageModel = this.storageModelProvider.getModel<T>(model);
        await this.syncHelpers.writeSyncForEntry(storageModel, params.entry, params.storageEntry);
        return result;
    }
}

export const PgOsCreateEntry = CreateEntryStorageOperation.createDecorator({
    decorator: PgOsCreateEntryImpl,
    dependencies: [SyncHelpers, CmsStorageModelProvider]
});
