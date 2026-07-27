import { createFeature } from "@webiny/feature/api/index.js";
import { EntryWriteOperations } from "~/operations/entry/abstractions/EntryWriteOperations.js";
import { EntrySearchOperations } from "~/operations/entry/abstractions/EntrySearchOperations.js";

import { CreateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryStorageOperation.js";
import { CreateEntryRevisionFromStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/CreateEntryRevisionFromStorageOperation.js";
import { UpdateEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UpdateEntryStorageOperation.js";
import { DeleteEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryStorageOperation.js";
import { DeleteEntryRevisionStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteEntryRevisionStorageOperation.js";
import { DeleteMultipleEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/DeleteMultipleEntriesStorageOperation.js";
import { MoveToBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveToBinStorageOperation.js";
import { RestoreFromBinStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/RestoreFromBinStorageOperation.js";
import { PublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/PublishEntryStorageOperation.js";
import { UnpublishEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/UnpublishEntryStorageOperation.js";
import { MoveEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/MoveEntryStorageOperation.js";
import { GetEntryStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetEntryStorageOperation.js";
import { ListEntriesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/ListEntriesStorageOperation.js";
import { GetUniqueFieldValuesStorageOperation } from "@webiny/api-headless-cms/features/shared/storageOperations/entry/GetUniqueFieldValuesStorageOperation.js";

import { SqlGetRevisions } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetRevisions.js";
import { SqlGetRevisionById } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetRevisionById.js";
import { SqlGetEntriesByIds } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetEntriesByIds.js";
import { SqlGetLatestEntriesByIds } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetLatestEntriesByIds.js";
import { SqlGetPublishedEntriesByIds } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetPublishedEntriesByIds.js";
import { SqlGetLatestRevisionByEntryId } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetLatestRevisionByEntryId.js";
import { SqlGetPublishedRevisionByEntryId } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetPublishedRevisionByEntryId.js";
import { SqlGetPreviousRevision } from "@webiny/api-headless-cms-sql/operations/entry/SqlGetPreviousRevision.js";

import { createImplementation } from "@webiny/feature/api";
import type {
    CmsModel,
    CmsEntryValues,
    CmsEntryStorageOperationsCreateParams,
    CmsEntryStorageOperationsCreateRevisionFromParams,
    CmsEntryStorageOperationsUpdateParams,
    CmsEntryStorageOperationsPublishParams,
    CmsEntryStorageOperationsUnpublishParams,
    CmsEntryStorageOperationsMoveToBinParams,
    CmsEntryStorageOperationsRestoreFromBinParams,
    CmsEntryStorageOperationsDeleteParams,
    CmsEntryStorageOperationsDeleteRevisionParams,
    CmsEntryStorageOperationsDeleteEntriesParams,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams
} from "@webiny/api-headless-cms/types/index.js";

// Write ops (11) — delegate to EntryWriteOperations
class PgOsCreateEntryImpl implements CreateEntryStorageOperation.Interface {
    constructor(private ops: EntryWriteOperations.Interface) {}
    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ) {
        return this.ops.create(model, params);
    }
}

const PgOsCreateEntry = createImplementation({
    abstraction: CreateEntryStorageOperation,
    implementation: PgOsCreateEntryImpl,
    dependencies: [EntryWriteOperations]
});

class PgOsCreateEntryRevisionFromImpl implements CreateEntryRevisionFromStorageOperation.Interface {
    constructor(private ops: EntryWriteOperations.Interface) {}
    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ) {
        return this.ops.createRevisionFrom(model, params);
    }
}

const PgOsCreateEntryRevisionFrom = createImplementation({
    abstraction: CreateEntryRevisionFromStorageOperation,
    implementation: PgOsCreateEntryRevisionFromImpl,
    dependencies: [EntryWriteOperations]
});

class PgOsUpdateEntryImpl implements UpdateEntryStorageOperation.Interface {
    constructor(private ops: EntryWriteOperations.Interface) {}
    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ) {
        return this.ops.update(model, params);
    }
}

const PgOsUpdateEntry = createImplementation({
    abstraction: UpdateEntryStorageOperation,
    implementation: PgOsUpdateEntryImpl,
    dependencies: [EntryWriteOperations]
});

class PgOsPublishEntryImpl implements PublishEntryStorageOperation.Interface {
    constructor(private ops: EntryWriteOperations.Interface) {}
    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsPublishParams<T>
    ) {
        return this.ops.publish(model, params);
    }
}

const PgOsPublishEntry = createImplementation({
    abstraction: PublishEntryStorageOperation,
    implementation: PgOsPublishEntryImpl,
    dependencies: [EntryWriteOperations]
});

class PgOsUnpublishEntryImpl implements UnpublishEntryStorageOperation.Interface {
    constructor(private ops: EntryWriteOperations.Interface) {}
    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ) {
        return this.ops.unpublish(model, params);
    }
}

const PgOsUnpublishEntry = createImplementation({
    abstraction: UnpublishEntryStorageOperation,
    implementation: PgOsUnpublishEntryImpl,
    dependencies: [EntryWriteOperations]
});

class PgOsMoveEntryImpl implements MoveEntryStorageOperation.Interface {
    constructor(private ops: EntryWriteOperations.Interface) {}
    async execute(model: CmsModel, id: string, folderId: string) {
        return this.ops.move(model, id, folderId);
    }
}

const PgOsMoveEntry = createImplementation({
    abstraction: MoveEntryStorageOperation,
    implementation: PgOsMoveEntryImpl,
    dependencies: [EntryWriteOperations]
});

class PgOsMoveToBinImpl implements MoveToBinStorageOperation.Interface {
    constructor(private ops: EntryWriteOperations.Interface) {}
    async execute(model: CmsModel, params: CmsEntryStorageOperationsMoveToBinParams) {
        return this.ops.moveToBin(model, params);
    }
}

const PgOsMoveToBin = createImplementation({
    abstraction: MoveToBinStorageOperation,
    implementation: PgOsMoveToBinImpl,
    dependencies: [EntryWriteOperations]
});

class PgOsRestoreFromBinImpl implements RestoreFromBinStorageOperation.Interface {
    constructor(private ops: EntryWriteOperations.Interface) {}
    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ) {
        return this.ops.restoreFromBin(model, params);
    }
}

const PgOsRestoreFromBin = createImplementation({
    abstraction: RestoreFromBinStorageOperation,
    implementation: PgOsRestoreFromBinImpl,
    dependencies: [EntryWriteOperations]
});

class PgOsDeleteEntryImpl implements DeleteEntryStorageOperation.Interface {
    constructor(private ops: EntryWriteOperations.Interface) {}
    async execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteParams) {
        return this.ops.delete(model, params);
    }
}

const PgOsDeleteEntry = createImplementation({
    abstraction: DeleteEntryStorageOperation,
    implementation: PgOsDeleteEntryImpl,
    dependencies: [EntryWriteOperations]
});

class PgOsDeleteEntryRevisionImpl implements DeleteEntryRevisionStorageOperation.Interface {
    constructor(private ops: EntryWriteOperations.Interface) {}
    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ) {
        return this.ops.deleteRevision(model, params);
    }
}

const PgOsDeleteEntryRevision = createImplementation({
    abstraction: DeleteEntryRevisionStorageOperation,
    implementation: PgOsDeleteEntryRevisionImpl,
    dependencies: [EntryWriteOperations]
});

class PgOsDeleteMultipleEntriesImpl implements DeleteMultipleEntriesStorageOperation.Interface {
    constructor(private ops: EntryWriteOperations.Interface) {}
    async execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteEntriesParams) {
        return this.ops.deleteMultipleEntries(model, params);
    }
}

const PgOsDeleteMultipleEntries = createImplementation({
    abstraction: DeleteMultipleEntriesStorageOperation,
    implementation: PgOsDeleteMultipleEntriesImpl,
    dependencies: [EntryWriteOperations]
});

// Search ops (3) — delegate to EntrySearchOperations
class PgOsGetEntryImpl implements GetEntryStorageOperation.Interface {
    constructor(private ops: EntrySearchOperations.Interface) {}
    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) {
        return this.ops.get<T>(model, params);
    }
}

const PgOsGetEntry = createImplementation({
    abstraction: GetEntryStorageOperation,
    implementation: PgOsGetEntryImpl,
    dependencies: [EntrySearchOperations]
});

class PgOsListEntriesImpl implements ListEntriesStorageOperation.Interface {
    constructor(private ops: EntrySearchOperations.Interface) {}
    async execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) {
        return this.ops.list<T>(model, params);
    }
}

const PgOsListEntries = createImplementation({
    abstraction: ListEntriesStorageOperation,
    implementation: PgOsListEntriesImpl,
    dependencies: [EntrySearchOperations]
});

class PgOsGetUniqueFieldValuesImpl implements GetUniqueFieldValuesStorageOperation.Interface {
    constructor(private ops: EntrySearchOperations.Interface) {}
    async execute(model: CmsModel, params: CmsEntryStorageOperationsGetUniqueFieldValuesParams) {
        return this.ops.getUniqueFieldValues(model, params);
    }
}

const PgOsGetUniqueFieldValues = createImplementation({
    abstraction: GetUniqueFieldValuesStorageOperation,
    implementation: PgOsGetUniqueFieldValuesImpl,
    dependencies: [EntrySearchOperations]
});

export const PgOsEntryStorageOpsFeature = createFeature({
    name: "cms.pgOs.entryStorageOps",
    register: container => {
        // Write ops (11) — PG-OS specific
        container.register(PgOsCreateEntry);
        container.register(PgOsCreateEntryRevisionFrom);
        container.register(PgOsUpdateEntry);
        container.register(PgOsPublishEntry);
        container.register(PgOsUnpublishEntry);
        container.register(PgOsMoveEntry);
        container.register(PgOsMoveToBin);
        container.register(PgOsRestoreFromBin);
        container.register(PgOsDeleteEntry);
        container.register(PgOsDeleteEntryRevision);
        container.register(PgOsDeleteMultipleEntries);

        // Search ops (3) — PG-OS specific (OpenSearch)
        container.register(PgOsGetEntry);
        container.register(PgOsListEntries);
        container.register(PgOsGetUniqueFieldValues);

        // SQL ops (8) — reuse SQL's per-method DI classes directly
        container.register(SqlGetRevisions);
        container.register(SqlGetRevisionById);
        container.register(SqlGetEntriesByIds);
        container.register(SqlGetLatestEntriesByIds);
        container.register(SqlGetPublishedEntriesByIds);
        container.register(SqlGetLatestRevisionByEntryId);
        container.register(SqlGetPublishedRevisionByEntryId);
        container.register(SqlGetPreviousRevision);
    }
});
