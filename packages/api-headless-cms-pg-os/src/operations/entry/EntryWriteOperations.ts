import { EntryWriteOperations as Abstraction } from "./abstractions/EntryWriteOperations.js";
import type { IEntryWriteOperations } from "./abstractions/EntryWriteOperations.js";
import { SqlEntryOperations } from "./abstractions/SqlEntryOperations.js";
import { SyncHelpers } from "~/features/SyncWriter/abstractions/SyncHelpers.js";
import { WriteEntry } from "~/features/SyncWriter/abstractions/WriteEntry.js";
import { WriteLatest } from "~/features/SyncWriter/abstractions/WriteLatest.js";
import { RemoveEntry } from "~/features/SyncWriter/abstractions/RemoveEntry.js";
import { RemoveLatest } from "~/features/SyncWriter/abstractions/RemoveLatest.js";
import { RemovePublished } from "~/features/SyncWriter/abstractions/RemovePublished.js";
import { CmsStorageModelProvider } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import type { WriteOperationDeps } from "./write/types.js";
import { createCreateOperation } from "./write/create.js";
import { createCreateRevisionFromOperation } from "./write/createRevisionFrom.js";
import { createUpdateOperation } from "./write/update.js";
import { createPublishOperation } from "./write/publish.js";
import { createUnpublishOperation } from "./write/unpublish.js";
import { createMoveOperation } from "./write/move.js";
import { createMoveToBinOperation } from "./write/moveToBin.js";
import { createRestoreFromBinOperation } from "./write/restoreFromBin.js";
import { createDeleteEntryOperation } from "./write/deleteEntry.js";
import { createDeleteRevisionOperation } from "./write/deleteRevision.js";
import { createDeleteMultipleEntriesOperation } from "./write/deleteMultipleEntries.js";

class EntryWriteOperationsImpl implements IEntryWriteOperations {
    public readonly create: IEntryWriteOperations["create"];
    public readonly createRevisionFrom: IEntryWriteOperations["createRevisionFrom"];
    public readonly update: IEntryWriteOperations["update"];
    public readonly publish: IEntryWriteOperations["publish"];
    public readonly unpublish: IEntryWriteOperations["unpublish"];
    public readonly move: IEntryWriteOperations["move"];
    public readonly moveToBin: IEntryWriteOperations["moveToBin"];
    public readonly restoreFromBin: IEntryWriteOperations["restoreFromBin"];
    public readonly delete: IEntryWriteOperations["delete"];
    public readonly deleteRevision: IEntryWriteOperations["deleteRevision"];
    public readonly deleteMultipleEntries: IEntryWriteOperations["deleteMultipleEntries"];

    public constructor(
        sqlOps: SqlEntryOperations.Interface,
        syncHelpers: SyncHelpers.Interface,
        writeEntry: WriteEntry.Interface,
        writeLatest: WriteLatest.Interface,
        removeEntry: RemoveEntry.Interface,
        removeLatest: RemoveLatest.Interface,
        removePublished: RemovePublished.Interface,
        storageModelProvider: CmsStorageModelProvider.Interface
    ) {
        const deps: WriteOperationDeps = {
            sqlOps,
            syncHelpers,
            writeEntry,
            writeLatest,
            removeEntry,
            removeLatest,
            removePublished,
            getStorageOperationsModel: model => storageModelProvider.getModel(model)
        };

        this.create = createCreateOperation(deps);
        this.createRevisionFrom = createCreateRevisionFromOperation(deps);
        this.update = createUpdateOperation(deps);
        this.publish = createPublishOperation(deps);
        this.unpublish = createUnpublishOperation(deps);
        this.move = createMoveOperation(deps);
        this.moveToBin = createMoveToBinOperation(deps);
        this.restoreFromBin = createRestoreFromBinOperation(deps);
        this.delete = createDeleteEntryOperation(deps);
        this.deleteRevision = createDeleteRevisionOperation(deps);
        this.deleteMultipleEntries = createDeleteMultipleEntriesOperation(deps);
    }
}

export const EntryWriteOperations = Abstraction.createImplementation({
    implementation: EntryWriteOperationsImpl,
    dependencies: [
        SqlEntryOperations,
        SyncHelpers,
        WriteEntry,
        WriteLatest,
        RemoveEntry,
        RemoveLatest,
        RemovePublished,
        CmsStorageModelProvider
    ]
});
