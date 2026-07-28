import type {
    CmsModel,
    CmsEntryStorageOperationsMoveToBinParams
} from "@webiny/api-headless-cms/types/index.js";
import { MoveToBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveToBinStorageOperation.js";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class PgOsMoveToBinImpl implements MoveToBinStorageOperation.Interface {
    constructor(
        private syncHelpers: SyncHelpers.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private inner: MoveToBinStorageOperation.Interface
    ) {}

    async execute(model: CmsModel, params: CmsEntryStorageOperationsMoveToBinParams) {
        await this.syncHelpers.ensureSyncTable();
        await this.inner.execute(model, params);
        const storageModel = this.storageModelProvider.getModel(model);
        await this.syncHelpers.resyncLatestAndPublishedFromPg(model, storageModel, params.entry.id);
    }
}

export const PgOsMoveToBin = MoveToBinStorageOperation.createDecorator({
    decorator: PgOsMoveToBinImpl,
    dependencies: [SyncHelpers, CmsStorageModelProvider]
});
