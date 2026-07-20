import type { Knex } from "knex";
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { Container } from "@webiny/feature/api";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { CompressionHandler } from "@webiny/utils/features/compression/abstractions/CompressionHandler.js";
import { createStorageModelAccessor } from "@webiny/api-headless-cms-storage";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import type { IEntryWriteOperations } from "./abstractions/EntryWriteOperations.js";
import { createSyncWriter } from "./syncWriter.js";
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
    knex: Knex;
    container: Container;
    sqlOps: CmsEntryStorageOperations;
    syncTableManager: SyncTableManager.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    compressionHandler: CompressionHandler.Interface;
}

export const createEntryWriteOperations = (
    params: CreateEntryWriteOperationsParams
): IEntryWriteOperations => {
    const { knex, container, sqlOps, syncTableManager, fieldIndexRegistry, compressionHandler } =
        params;

    const { getModel: getStorageOperationsModel } = createStorageModelAccessor(container);

    const syncWriter = createSyncWriter({
        knex,
        syncTableManager,
        fieldIndexRegistry,
        compressionHandler
    });

    const syncHelpers = createSyncHelpers({ syncTableManager, syncWriter, sqlOps });

    const deps: WriteOperationDeps = {
        sqlOps,
        syncHelpers,
        syncWriter,
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
