import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { MoveEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveEntryStorageOperation.js";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";

class PgOsMoveEntryImpl implements MoveEntryStorageOperation.Interface {
    constructor(
        private syncHelpers: SyncHelpers.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface,
        private inner: MoveEntryStorageOperation.Interface
    ) {}

    async execute(model: CmsModel, id: string, folderId: string) {
        await this.syncHelpers.ensureSyncTable();
        await this.inner.execute(model, id, folderId);
        const storageModel = this.storageModelProvider.getModel(model);
        await this.syncHelpers.resyncLatestAndPublishedFromPg(model, storageModel, id);
    }
}

export const PgOsMoveEntry = MoveEntryStorageOperation.createDecorator({
    decorator: PgOsMoveEntryImpl,
    dependencies: [SyncHelpers, CmsStorageModelProvider]
});
