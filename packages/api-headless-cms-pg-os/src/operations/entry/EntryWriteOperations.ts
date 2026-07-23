import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { Container } from "@webiny/feature/api";
import { createStorageModelAccessor } from "@webiny/api-headless-cms-storage";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import { WriteEntry } from "~/features/SyncWriter/abstractions/WriteEntry.js";
import { WriteLatest } from "~/features/SyncWriter/abstractions/WriteLatest.js";
import { WritePublished } from "~/features/SyncWriter/abstractions/WritePublished.js";
import { RemoveEntry } from "~/features/SyncWriter/abstractions/RemoveEntry.js";
import { RemoveLatest } from "~/features/SyncWriter/abstractions/RemoveLatest.js";
import { RemovePublished } from "~/features/SyncWriter/abstractions/RemovePublished.js";
import type { IEntryWriteOperations } from "./abstractions/EntryWriteOperations.js";
import { createSyncHelpers } from "./syncHelpers.js";
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

interface CreateEntryWriteOperationsParams {
    container: Container;
    sqlOps: CmsEntryStorageOperations;
    syncTableManager: SyncTableManager.Interface;
}

export const createEntryWriteOperations = (
    params: CreateEntryWriteOperationsParams
): IEntryWriteOperations => {
    const { container, sqlOps, syncTableManager } = params;

    const { getModel: getStorageOperationsModel } = createStorageModelAccessor(container);

    const writeEntry = container.resolve(WriteEntry);
    const writeLatest = container.resolve(WriteLatest);
    const writePublished = container.resolve(WritePublished);
    const removeEntry = container.resolve(RemoveEntry);
    const removeLatest = container.resolve(RemoveLatest);
    const removePublished = container.resolve(RemovePublished);

    const syncHelpers = createSyncHelpers({
        syncTableManager,
        writeEntry,
        writeLatest,
        writePublished,
        removePublished,
        sqlOps
    });

    const deps: WriteOperationDeps = {
        sqlOps,
        syncHelpers,
        writeEntry,
        writeLatest,
        writePublished,
        removeEntry,
        removeLatest,
        removePublished,
        getStorageOperationsModel
    };

    return {
        create: createCreateOperation(deps),
        createRevisionFrom: createCreateRevisionFromOperation(deps),
        update: createUpdateOperation(deps),
        publish: createPublishOperation(deps),
        unpublish: createUnpublishOperation(deps),
        move: createMoveOperation(deps),
        moveToBin: createMoveToBinOperation(deps),
        restoreFromBin: createRestoreFromBinOperation(deps),
        delete: createDeleteEntryOperation(deps),
        deleteRevision: createDeleteRevisionOperation(deps),
        deleteMultipleEntries: createDeleteMultipleEntriesOperation(deps)
    };
};
