import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import { parseIdentifier } from "@webiny/utils";
import { SyncHelpers as Abstraction } from "./abstractions/SyncHelpers.js";
import { WriteEntry } from "./abstractions/WriteEntry.js";
import { WriteLatest } from "./abstractions/WriteLatest.js";
import { WritePublished } from "./abstractions/WritePublished.js";
import { RemovePublished } from "./abstractions/RemovePublished.js";
import { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import { GetLatestRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetLatestRevisionByEntryIdStorageOperation.js";
import { GetPublishedRevisionByEntryIdStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetPublishedRevisionByEntryIdStorageOperation.js";

class SyncHelpersImpl implements Abstraction.Interface {
    public constructor(
        private readonly syncTableManager: SyncTableManager.Interface,
        private readonly writeEntry: WriteEntry.Interface,
        private readonly writeLatest: WriteLatest.Interface,
        private readonly writePublished: WritePublished.Interface,
        private readonly removePublished: RemovePublished.Interface,
        private readonly getLatestRevision: GetLatestRevisionByEntryIdStorageOperation.Interface,
        private readonly getPublishedRevision: GetPublishedRevisionByEntryIdStorageOperation.Interface
    ) {}

    public async ensureSyncTable(): Promise<void> {
        await this.syncTableManager.ensureTable();
    }

    public async writeSyncForEntry<T extends CmsEntryValues>(
        model: StorageOperationsCmsModel<T>,
        entry: CmsEntry<T>,
        storageEntry: CmsStorageEntry<T>
    ): Promise<void> {
        await this.writeEntry.execute({ model, entry, storageEntry });
    }

    public async resyncLatestAndPublishedFromPg<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        model: StorageOperationsCmsModel<T>,
        id: string
    ): Promise<void> {
        const latest = await this.getLatestRevision.execute<T>(initialModel, { id });
        if (latest) {
            await this.writeLatest.execute({ model, entry: latest, storageEntry: latest });
        }

        const published = await this.getPublishedRevision.execute<T>(initialModel, { id });
        if (published) {
            await this.writePublished.execute({
                model,
                entry: published,
                storageEntry: published
            });
        } else {
            const { id: entryId } = parseIdentifier(id);
            await this.removePublished.execute({ model, entryId });
        }
    }
}

export const SyncHelpers = Abstraction.createImplementation({
    implementation: SyncHelpersImpl,
    dependencies: [
        SyncTableManager,
        WriteEntry,
        WriteLatest,
        WritePublished,
        RemovePublished,
        GetLatestRevisionByEntryIdStorageOperation,
        GetPublishedRevisionByEntryIdStorageOperation
    ]
});
