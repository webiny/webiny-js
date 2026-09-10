import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsRestoreFromBinParams
} from "@webiny/api-headless-cms/types/index.js";
import { RestoreFromBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/RestoreFromBinStorageOperation.js";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class PgOsRestoreFromBinImpl implements RestoreFromBinStorageOperation.Interface {
    constructor(
        private syncHelpers: SyncHelpers.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private inner: RestoreFromBinStorageOperation.Interface
    ) {}

    async execute<T extends CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ) {
        await this.syncHelpers.ensureSyncTable();
        const result = await this.inner.execute(model, params);
        const storageModel = this.storageModelProvider.getModel<T>(model);
        await this.syncHelpers.resyncLatestAndPublishedFromPg(model, storageModel, params.entry.id);
        return result;
    }
}

export const PgOsRestoreFromBin = RestoreFromBinStorageOperation.createDecorator({
    decorator: PgOsRestoreFromBinImpl,
    dependencies: [SyncHelpers, CmsStorageModelProvider]
});
