import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsCreateRevisionFromParams
} from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryRevisionFromStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class PgOsCreateEntryRevisionFromImpl implements CreateEntryRevisionFromStorageOperation.Interface {
    constructor(
        private syncHelpers: SyncHelpers.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private inner: CreateEntryRevisionFromStorageOperation.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ) {
        await this.syncHelpers.ensureSyncTable();
        const result = await this.inner.execute(model, params);
        const storageModel = this.storageModelProvider.getModel<T>(model);
        await this.syncHelpers.writeSyncForEntry(storageModel, params.entry, params.storageEntry);
        return result;
    }
}

export const PgOsCreateEntryRevisionFrom = CreateEntryRevisionFromStorageOperation.createDecorator({
    decorator: PgOsCreateEntryRevisionFromImpl,
    dependencies: [SyncHelpers, CmsStorageModelProvider]
});
