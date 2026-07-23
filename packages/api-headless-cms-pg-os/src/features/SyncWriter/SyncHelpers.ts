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
import { SqlEntryOperations } from "@webiny/api-headless-cms-sql/operations/entry/abstractions/SqlEntryOperations.js";

class SyncHelpersImpl implements Abstraction.Interface {
    public constructor(
        private readonly syncTableManager: SyncTableManager.Interface,
        private readonly writeEntry: WriteEntry.Interface,
        private readonly writeLatest: WriteLatest.Interface,
        private readonly writePublished: WritePublished.Interface,
        private readonly removePublished: RemovePublished.Interface,
        private readonly sqlOps: SqlEntryOperations.Interface
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
        const latest = await this.sqlOps.getLatestRevisionByEntryId<T>(initialModel, { id });
        if (latest) {
            await this.writeLatest.execute({ model, entry: latest, storageEntry: latest });
        }

        const published = await this.sqlOps.getPublishedRevisionByEntryId<T>(initialModel, { id });
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
        SqlEntryOperations
    ]
});
