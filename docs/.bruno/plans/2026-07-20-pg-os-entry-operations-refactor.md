# PG-OS Entry Operations DI Refactor

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the 442-line `operations/entry/index.ts` into full DI pattern with each operation in its own file and shared helpers.

**Architecture:** Split into two DI abstractions — `EntryWriteOperations` (all write/mutate methods) and `EntrySearchOperations` (OpenSearch query methods). Each individual operation lives in its own file as a pure function. Shared sync helpers extracted to a `syncHelpers.ts` module. The existing `index.ts` becomes a thin compositor that creates `sqlOps` once (shared between write ops and passthrough reads), then merges both abstractions into the `CmsEntryStorageOperations` interface. SyncWriter stays as-is — it's already well-scoped.

**DI constraint:** `createSqlEntriesStorageOperations` needs `plugins` (from context, not container), so `sqlOps` cannot be a DI abstraction. The implementations use factory functions that receive `sqlOps` as a param. Abstractions are defined for type contracts and future DI migration, but registration via `feature.ts`/`createImplementation()` is deferred until `plugins` moves into the container.

**Tech Stack:** TypeScript, `@webiny/feature/api` (createAbstraction/createImplementation/createFeature), Knex, OpenSearch client.

## Global Constraints

- Follow existing DI pattern: `abstractions.ts` + `ClassName.ts` + `feature.ts`
- Namespace pattern: `export namespace X { export type Interface = IX; }`
- Implementation naming: `XImpl` class, export const via `Abstraction.createImplementation()`
- All files use `.js` extension in imports (ESM)
- No tests exist for this file — this is a pure structural refactor, behavior must not change

---

## File Structure

```
packages/api-headless-cms-pg-os/src/operations/entry/
├── abstractions.ts              (NEW — EntryWriteOperations + EntrySearchOperations abstractions)
├── syncHelpers.ts               (NEW — ensureSyncTable, writeSyncForEntry, resyncLatestAndPublishedFromPg)
├── write/
│   ├── create.ts                (NEW)
│   ├── createRevisionFrom.ts    (NEW)
│   ├── update.ts                (NEW)
│   ├── publish.ts               (NEW)
│   ├── unpublish.ts             (NEW)
│   ├── move.ts                  (NEW)
│   ├── moveToBin.ts             (NEW)
│   ├── restoreFromBin.ts        (NEW)
│   ├── deleteEntry.ts           (NEW)
│   ├── deleteRevision.ts        (NEW)
│   └── deleteMultipleEntries.ts (NEW)
├── search/
│   ├── list.ts                  (NEW)
│   ├── get.ts                   (NEW)
│   └── getUniqueFieldValues.ts  (NEW)
├── EntryWriteOperations.ts      (NEW — factory composing write/ files, receives sqlOps as param)
├── EntrySearchOperations.ts     (NEW — factory composing search/ files)
├── syncWriter.ts                (KEEP — no changes)
└── index.ts                     (MODIFY — thin compositor: creates sqlOps ONCE, passes to writeOps + passthrough)
```

**Consumer unchanged:** `HeadlessCmsPgOsFeature.ts` keeps calling `createEntriesStorageOperations()` — same signature, same return type. DI registration deferred (see Architecture note).

---

### Task 1: Create abstractions and shared helpers

**Files:**
- Create: `packages/api-headless-cms-pg-os/src/operations/entry/abstractions.ts`
- Create: `packages/api-headless-cms-pg-os/src/operations/entry/syncHelpers.ts`

**Interfaces:**
- Produces: `EntryWriteOperations` abstraction, `EntrySearchOperations` abstraction, `IEntryWriteOperations`, `IEntrySearchOperations`
- Produces: `SyncHelpers` type, `createSyncHelpers()` factory

- [ ] **Step 1: Create abstractions.ts**

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/abstractions.ts
import { createAbstraction } from "@webiny/feature/api/index.js";
import type {
    CmsEntry,
    CmsEntryStorageOperationsCreateParams,
    CmsEntryStorageOperationsCreateRevisionFromParams,
    CmsEntryStorageOperationsDeleteEntriesParams,
    CmsEntryStorageOperationsDeleteParams,
    CmsEntryStorageOperationsDeleteRevisionParams,
    CmsEntryStorageOperationsGetParams,
    CmsEntryStorageOperationsGetUniqueFieldValuesParams,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsEntryStorageOperationsMoveToBinParams,
    CmsEntryStorageOperationsPublishParams,
    CmsEntryStorageOperationsRestoreFromBinParams,
    CmsEntryStorageOperationsUnpublishParams,
    CmsEntryStorageOperationsUpdateParams,
    CmsEntryUniqueValue,
    CmsEntryValues,
    CmsModel
} from "@webiny/api-headless-cms/types/index.js";

export interface IEntryWriteOperations {
    create<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ): Promise<CmsEntry<T>>;
    createRevisionFrom<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ): Promise<CmsEntry<T>>;
    update<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ): Promise<CmsEntry<T>>;
    publish<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsPublishParams<T>
    ): Promise<CmsEntry<T>>;
    unpublish<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ): Promise<CmsEntry<T>>;
    move(model: CmsModel, id: string, folderId: string): Promise<void>;
    moveToBin(model: CmsModel, params: CmsEntryStorageOperationsMoveToBinParams): Promise<void>;
    restoreFromBin<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ): Promise<CmsEntry<T>>;
    delete(model: CmsModel, params: CmsEntryStorageOperationsDeleteParams): Promise<void>;
    deleteRevision<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ): Promise<void>;
    deleteMultipleEntries(
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteEntriesParams
    ): Promise<void>;
}

export const EntryWriteOperations =
    createAbstraction<IEntryWriteOperations>("Cms/PgOs/EntryWriteOperations");

export namespace EntryWriteOperations {
    export type Interface = IEntryWriteOperations;
}

export interface IEntrySearchOperations {
    get<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ): Promise<CmsEntry<T> | null>;
    list<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>>;
    getUniqueFieldValues(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetUniqueFieldValuesParams
    ): Promise<CmsEntryUniqueValue[]>;
}

export const EntrySearchOperations =
    createAbstraction<IEntrySearchOperations>("Cms/PgOs/EntrySearchOperations");

export namespace EntrySearchOperations {
    export type Interface = IEntrySearchOperations;
}
```

- [ ] **Step 2: Create syncHelpers.ts**

Extract the three sync helper functions from `index.ts`. These are shared by write operations.

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/syncHelpers.ts
import type {
    CmsEntry,
    CmsEntryStorageOperations,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { SyncWriter } from "./syncWriter.js";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";

export interface SyncHelpers {
    ensureSyncTable(): Promise<void>;
    writeSyncForEntry<T extends CmsEntryValues>(
        model: StorageOperationsCmsModel<T>,
        entry: CmsEntry<T>,
        storageEntry: CmsStorageEntry<T>
    ): Promise<void>;
    resyncLatestAndPublishedFromPg<T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        model: StorageOperationsCmsModel<T>,
        id: string
    ): Promise<void>;
}

interface CreateSyncHelpersParams {
    syncTableManager: SyncTableManager.Interface;
    syncWriter: SyncWriter;
    sqlOps: CmsEntryStorageOperations;
}

const extractEntryId = (id: string): string => {
    const hashIdx = id.indexOf("#");
    if (hashIdx === -1) {
        return id;
    }
    return id.slice(0, hashIdx);
};

export { extractEntryId };

export const createSyncHelpers = (params: CreateSyncHelpersParams): SyncHelpers => {
    const { syncTableManager, syncWriter, sqlOps } = params;

    const ensureSyncTable = async (): Promise<void> => {
        await syncTableManager.ensureTable();
    };

    const writeSyncForEntry = async <T extends CmsEntryValues>(
        model: StorageOperationsCmsModel<T>,
        entry: CmsEntry<T>,
        storageEntry: CmsStorageEntry<T>
    ): Promise<void> => {
        await syncWriter.writeLatest({ model, entry, storageEntry });
        if (entry.status === "published") {
            await syncWriter.writePublished({ model, entry, storageEntry });
        }
    };

    const resyncLatestAndPublishedFromPg = async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        model: StorageOperationsCmsModel<T>,
        id: string
    ): Promise<void> => {
        const latest = await sqlOps.getLatestRevisionByEntryId<T>(initialModel, { id });
        if (latest) {
            await syncWriter.writeLatest({ model, entry: latest, storageEntry: latest });
        }

        const published = await sqlOps.getPublishedRevisionByEntryId<T>(initialModel, { id });
        if (published) {
            await syncWriter.writePublished({ model, entry: published, storageEntry: published });
        } else {
            await syncWriter.removePublished({ model, entryId: extractEntryId(id) });
        }
    };

    return { ensureSyncTable, writeSyncForEntry, resyncLatestAndPublishedFromPg };
};
```

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/operations/entry/abstractions.ts \
       packages/api-headless-cms-pg-os/src/operations/entry/syncHelpers.ts
git commit -m "chore(api-headless-cms-pg-os): add entry operations abstractions and sync helpers"
```

---

### Task 2: Create individual write operation files

**Files:**
- Create: all 11 files in `packages/api-headless-cms-pg-os/src/operations/entry/write/`

**Interfaces:**
- Consumes: `SyncHelpers` from `syncHelpers.ts`, `SyncWriter` from `syncWriter.ts`, `CmsEntryStorageOperations` (sqlOps)
- Produces: One named export per file matching the method name from `IEntryWriteOperations`

Each write operation is a pure function factory. They all share the same deps type:

- [ ] **Step 1: Create write operation deps type and all 11 files**

All write operations share a common dependency shape. Each file exports a single function factory.

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/types.ts
import type {
    CmsEntryStorageOperations,
    CmsEntryValues,
    CmsModel,
    StorageOperationsCmsModel
} from "@webiny/api-headless-cms/types/index.js";
import type { SyncHelpers } from "../syncHelpers.js";
import type { SyncWriter } from "../syncWriter.js";

export type GetStorageOperationsModel = <T extends CmsEntryValues = CmsEntryValues>(
    model: CmsModel
) => StorageOperationsCmsModel<T>;

export interface WriteOperationDeps {
    sqlOps: CmsEntryStorageOperations;
    syncHelpers: SyncHelpers;
    syncWriter: SyncWriter;
    getStorageOperationsModel: GetStorageOperationsModel;
}
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/create.ts
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createCreateOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["create"] => {
    return async (initialModel, createParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.create(initialModel, createParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.writeSyncForEntry(model, createParams.entry, createParams.storageEntry);
        return result;
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/createRevisionFrom.ts
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createCreateRevisionFromOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["createRevisionFrom"] => {
    return async (initialModel, revisionParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.createRevisionFrom(initialModel, revisionParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.writeSyncForEntry(model, revisionParams.entry, revisionParams.storageEntry);
        return result;
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/update.ts
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createUpdateOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["update"] => {
    return async (initialModel, updateParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.update(initialModel, updateParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.writeSyncForEntry(model, updateParams.entry, updateParams.storageEntry);
        return result;
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/publish.ts
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createPublishOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["publish"] => {
    return async (initialModel, publishParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.publish(initialModel, publishParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncWriter.writeLatest({
            model,
            entry: publishParams.entry,
            storageEntry: publishParams.storageEntry
        });
        await deps.syncWriter.writePublished({
            model,
            entry: publishParams.entry,
            storageEntry: publishParams.storageEntry
        });
        return result;
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/unpublish.ts
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createUnpublishOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["unpublish"] => {
    return async (initialModel, unpublishParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.unpublish(initialModel, unpublishParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncWriter.writeLatest({
            model,
            entry: unpublishParams.entry,
            storageEntry: unpublishParams.storageEntry
        });
        await deps.syncWriter.removePublished({ model, entryId: unpublishParams.entry.entryId });
        return result;
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/move.ts
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createMoveOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["move"] => {
    return async (initialModel, id, folderId) => {
        await deps.syncHelpers.ensureSyncTable();
        await deps.sqlOps.move(initialModel, id, folderId);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.resyncLatestAndPublishedFromPg(initialModel, model, id);
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/moveToBin.ts
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsMoveToBinParams
} from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createMoveToBinOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["moveToBin"] => {
    return async (initialModel, moveToBinParams: CmsEntryStorageOperationsMoveToBinParams) => {
        await deps.syncHelpers.ensureSyncTable();
        await deps.sqlOps.moveToBin(initialModel, moveToBinParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.resyncLatestAndPublishedFromPg(
            initialModel,
            model,
            moveToBinParams.entry.id
        );
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/restoreFromBin.ts
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createRestoreFromBinOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["restoreFromBin"] => {
    return async (initialModel, restoreParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const result = await deps.sqlOps.restoreFromBin(initialModel, restoreParams);
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.syncHelpers.resyncLatestAndPublishedFromPg(
            initialModel,
            model,
            restoreParams.entry.id
        );
        return result;
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/deleteEntry.ts
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsDeleteParams
} from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createDeleteEntryOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["delete"] => {
    return async (initialModel, deleteParams: CmsEntryStorageOperationsDeleteParams) => {
        await deps.syncHelpers.ensureSyncTable();
        const model = deps.getStorageOperationsModel(initialModel);
        const { entryId } = deleteParams.entry;
        await deps.sqlOps.delete(initialModel, deleteParams);
        await deps.syncWriter.removeLatest({ model, entryId });
        await deps.syncWriter.removePublished({ model, entryId });
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/deleteRevision.ts
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsDeleteRevisionParams
} from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";

export const createDeleteRevisionOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["deleteRevision"] => {
    return async (
        initialModel,
        deleteRevisionParams: CmsEntryStorageOperationsDeleteRevisionParams
    ) => {
        await deps.syncHelpers.ensureSyncTable();
        await deps.sqlOps.deleteRevision(initialModel, deleteRevisionParams);
        const model = deps.getStorageOperationsModel(initialModel);

        const { latestStorageEntry, storageEntry } = deleteRevisionParams;
        if (latestStorageEntry) {
            await deps.syncWriter.writeLatest({
                model,
                entry: latestStorageEntry,
                storageEntry: latestStorageEntry
            });
        } else {
            await deps.syncWriter.removeLatest({ model, entryId: storageEntry.entryId });
        }

        if (storageEntry.status === "published") {
            await deps.syncWriter.removePublished({ model, entryId: storageEntry.entryId });
        }
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/write/deleteMultipleEntries.ts
import type {
    CmsEntryStorageOperations,
    CmsEntryStorageOperationsDeleteEntriesParams
} from "@webiny/api-headless-cms/types/index.js";
import type { WriteOperationDeps } from "./types.js";
import { extractEntryId } from "../syncHelpers.js";

export const createDeleteMultipleEntriesOperation = (
    deps: WriteOperationDeps
): CmsEntryStorageOperations["deleteMultipleEntries"] => {
    return async (
        initialModel,
        deleteMultipleParams: CmsEntryStorageOperationsDeleteEntriesParams
    ) => {
        await deps.syncHelpers.ensureSyncTable();
        const model = deps.getStorageOperationsModel(initialModel);
        await deps.sqlOps.deleteMultipleEntries(initialModel, deleteMultipleParams);

        for (const id of deleteMultipleParams.entries) {
            const entryId = extractEntryId(id);
            await deps.syncWriter.removeLatest({ model, entryId });
            await deps.syncWriter.removePublished({ model, entryId });
        }
    };
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/operations/entry/write/
git commit -m "chore(api-headless-cms-pg-os): extract individual write operations"
```

---

### Task 3: Create individual search operation files

**Files:**
- Create: all 3 files in `packages/api-headless-cms-pg-os/src/operations/entry/search/`

**Interfaces:**
- Consumes: `CmsEntryOpenSearchBodyBuilder`, `OpenSearchClient`, `CmsModelFieldToGraphQLRegistry`, `CmsEntryOpenSearchFieldIndexRegistry`, `createStorageModelAccessor`
- Produces: `createListOperation`, `createGetOperation`, `createGetUniqueFieldValuesOperation`

- [ ] **Step 1: Create search deps type and all 3 files**

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/search/types.ts
import type { CmsEntryValues, CmsModel, StorageOperationsCmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { Client as OpenSearchClient } from "@webiny/api-opensearch";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { GetStorageOperationsModel } from "../write/types.js";

export interface SearchOperationDeps {
    elasticsearch: OpenSearchClient;
    bodyBuilder: {
        build(params: {
            model: StorageOperationsCmsModel;
            params: Record<string, any>;
        }): Record<string, any>;
    };
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    getStorageOperationsModel: GetStorageOperationsModel;
}
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/search/list.ts
import type {
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsListParams,
    CmsEntryStorageOperationsListResponse,
    CmsEntry
} from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import {
    createLimit,
    decodeCursor,
    encodeCursor,
    getTotalCount,
    type OpenSearchSearchResponse
} from "@webiny/api-opensearch";
import { shouldIgnoreEsResponseError } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/shouldIgnoreEsResponseError.js";
import { extractEntriesFromIndex } from "@webiny/api-headless-cms-utils-os/helpers/entryIndexHelpers.js";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import type { CmsIndexEntry } from "@webiny/api-headless-cms-utils-os/types.js";
import type { SearchOperationDeps } from "./types.js";

export const createListOperation = (deps: SearchOperationDeps) => {
    return async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        listParams: CmsEntryStorageOperationsListParams
    ): Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>> => {
        const model = deps.getStorageOperationsModel<T>(initialModel);
        const limit = createLimit(listParams.limit);

        const { index } = configurations.es({ model });

        const body = deps.bodyBuilder.build({
            model,
            params: {
                ...listParams,
                limit,
                after: decodeCursor(listParams.after)
            }
        });

        let response: OpenSearchSearchResponse;
        try {
            response = await deps.elasticsearch.search({ index, body });
        } catch (error) {
            if (shouldIgnoreEsResponseError(error)) {
                return { hasMoreItems: false, totalCount: 0, cursor: null, items: [] };
            }
            throw new WebinyError(error.message, error.code || "OPENSEARCH_ERROR", {
                error,
                index,
                body,
                model
            });
        }

        const { hits, total } = response.body.hits;

        const items = extractEntriesFromIndex<T>({
            fieldRegistry: deps.fieldRegistry,
            fieldIndexRegistry: deps.fieldIndexRegistry,
            model,
            entries: hits.map(item => item._source as CmsIndexEntry<T>)
        });

        const hasMoreItems = items.length > limit;
        if (hasMoreItems) {
            items.pop();
        }

        // @ts-expect-error - `sort` is present on the hit, but narrowed away by `_source: false` typing.
        const cursor = items.length > 0 ? encodeCursor(hits[items.length - 1].sort) || null : null;

        return {
            hasMoreItems,
            totalCount: getTotalCount(total),
            cursor,
            items
        };
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/search/get.ts
import type {
    CmsEntry,
    CmsEntryValues,
    CmsModel,
    CmsEntryStorageOperationsGetParams
} from "@webiny/api-headless-cms/types/index.js";
import type { SearchOperationDeps } from "./types.js";
import { createListOperation } from "./list.js";

export const createGetOperation = (deps: SearchOperationDeps) => {
    const list = createListOperation(deps);

    return async <T extends CmsEntryValues = CmsEntryValues>(
        initialModel: CmsModel,
        getParams: CmsEntryStorageOperationsGetParams
    ): Promise<CmsEntry<T> | null> => {
        const { items } = await list<T>(initialModel, { ...getParams, limit: 1 });
        return items.shift() || null;
    };
};
```

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/search/getUniqueFieldValues.ts
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import WebinyError from "@webiny/error";
import type { OpenSearchSearchResponse } from "@webiny/api-opensearch";
import { shouldIgnoreEsResponseError } from "@webiny/api-headless-cms-utils-os/operations/entry/elasticsearch/shouldIgnoreEsResponseError.js";
import { configurations } from "@webiny/api-headless-cms-utils-os/configurations.js";
import type { SearchOperationDeps } from "./types.js";

export const createGetUniqueFieldValuesOperation = (
    deps: SearchOperationDeps
): CmsEntryStorageOperations["getUniqueFieldValues"] => {
    return async (model, uniqueFieldValuesParams) => {
        const { where, fieldId } = uniqueFieldValuesParams;
        const { index } = configurations.es({ model });

        const field = model.fields.find(f => f.fieldId === fieldId);
        if (!field) {
            return [];
        }

        const initialBody = deps.bodyBuilder.build({
            model,
            params: { limit: 1, where }
        });

        const body = {
            ...initialBody,
            size: 0,
            aggregations: {
                getUniqueFieldValues: {
                    terms: {
                        field: `values.${field.storageId}.keyword`,
                        size: 1000000
                    }
                }
            }
        };

        let response: OpenSearchSearchResponse;
        try {
            response = await deps.elasticsearch.search({ index, body });
        } catch (error) {
            if (shouldIgnoreEsResponseError(error)) {
                return [];
            }
            throw new WebinyError(error.message, error.code || "OPENSEARCH_ERROR", {
                error,
                index,
                model,
                body
            });
        }

        const aggregations = response.body.aggregations || {};
        const agg = aggregations["getUniqueFieldValues"];
        const buckets =
            agg && "buckets" in agg && Array.isArray(agg.buckets) ? agg.buckets : [];
        return buckets.map((bucket: { key: string; doc_count: number }) => ({
            value: bucket.key,
            count: bucket.doc_count
        }));
    };
};
```

- [ ] **Step 2: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/operations/entry/search/
git commit -m "chore(api-headless-cms-pg-os): extract individual search operations"
```

---

### Task 4: Create DI implementation classes

**Files:**
- Create: `packages/api-headless-cms-pg-os/src/operations/entry/EntryWriteOperations.ts`
- Create: `packages/api-headless-cms-pg-os/src/operations/entry/EntrySearchOperations.ts`

**Interfaces:**
- Consumes: All write/* and search/* factories, abstractions from `abstractions.ts`
- Produces: DI-registered implementations for `EntryWriteOperations` and `EntrySearchOperations`

- [ ] **Step 1: Create EntryWriteOperations.ts**

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/EntryWriteOperations.ts
import type { Knex } from "knex";
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { Container } from "@webiny/feature/api";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { CompressionHandler } from "@webiny/utils/features/compression/abstractions/CompressionHandler.js";
import { createStorageModelAccessor } from "@webiny/api-headless-cms-storage";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import type { IEntryWriteOperations } from "./abstractions.js";
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
```

- [ ] **Step 2: Create EntrySearchOperations.ts**

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/EntrySearchOperations.ts
import type { Container } from "@webiny/feature/api";
import type { Client as OpenSearchClient } from "@webiny/api-opensearch";
import { CmsEntryOpenSearchBodyBuilder } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { createStorageModelAccessor } from "@webiny/api-headless-cms-storage";
import type { IEntrySearchOperations } from "./abstractions.js";
import type { SearchOperationDeps } from "./search/types.js";
import { createListOperation } from "./search/list.js";
import { createGetOperation } from "./search/get.js";
import { createGetUniqueFieldValuesOperation } from "./search/getUniqueFieldValues.js";

interface CreateEntrySearchOperationsParams {
    container: Container;
    elasticsearch: OpenSearchClient;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
}

export const createEntrySearchOperations = (
    params: CreateEntrySearchOperationsParams
): IEntrySearchOperations => {
    const { container, elasticsearch, fieldRegistry, fieldIndexRegistry } = params;

    const bodyBuilder = container.resolve(CmsEntryOpenSearchBodyBuilder);
    const { getModel: getStorageOperationsModel } = createStorageModelAccessor(container);

    const deps: SearchOperationDeps = {
        elasticsearch,
        bodyBuilder,
        fieldRegistry,
        fieldIndexRegistry,
        getStorageOperationsModel
    };

    return {
        list: createListOperation(deps),
        get: createGetOperation(deps),
        getUniqueFieldValues: createGetUniqueFieldValuesOperation(deps)
    };
};
```

- [ ] **Step 3: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/operations/entry/EntryWriteOperations.ts \
       packages/api-headless-cms-pg-os/src/operations/entry/EntrySearchOperations.ts
git commit -m "chore(api-headless-cms-pg-os): add DI implementation classes for entry operations"
```

---

### Task 5: Rewrite index.ts as thin compositor

**Files:**
- Modify: `packages/api-headless-cms-pg-os/src/operations/entry/index.ts`

**Interfaces:**
- Consumes: `createEntryWriteOperations`, `createEntrySearchOperations`, `createSqlEntriesStorageOperations`
- Produces: `CmsEntryStorageOperations` (same signature and return type — consumer HeadlessCmsPgOsFeature.ts unchanged)

- [ ] **Step 1: Rewrite index.ts**

Replace the entire file with a thin compositor that merges write + search + SQL passthrough ops:

```typescript
// packages/api-headless-cms-pg-os/src/operations/entry/index.ts
import type { Knex } from "knex";
import type { CmsEntryStorageOperations } from "@webiny/api-headless-cms/types/index.js";
import type { Container } from "@webiny/feature/api";
import type { PluginsContainer } from "@webiny/plugins";
import type { Client as OpenSearchClient } from "@webiny/api-opensearch";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import type { CmsEntryOpenSearchFieldIndexRegistry } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import type { EntryTableManager } from "@webiny/api-headless-cms-sql/features/entryTableManager/abstractions.js";
import type { CompressionHandler } from "@webiny/utils/features/compression/abstractions/CompressionHandler.js";
import { createEntriesStorageOperations as createSqlEntriesStorageOperations } from "@webiny/api-headless-cms-sql/operations/entry/index.js";
import type { SyncTableManager } from "~/features/syncTableManager/abstractions.js";
import { createEntryWriteOperations } from "./EntryWriteOperations.js";
import { createEntrySearchOperations } from "./EntrySearchOperations.js";

interface CreateEntriesStorageOperationsParams {
    knex: Knex;
    container: Container;
    plugins: PluginsContainer;
    elasticsearch: OpenSearchClient;
    entryTableManager: EntryTableManager.Interface;
    syncTableManager: SyncTableManager.Interface;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    fieldIndexRegistry: CmsEntryOpenSearchFieldIndexRegistry.Interface;
    compressionHandler: CompressionHandler.Interface;
}

export const createEntriesStorageOperations = (
    params: CreateEntriesStorageOperationsParams
): CmsEntryStorageOperations => {
    const {
        knex,
        container,
        plugins,
        elasticsearch,
        entryTableManager,
        syncTableManager,
        fieldRegistry,
        fieldIndexRegistry,
        compressionHandler
    } = params;

    const sqlOps = createSqlEntriesStorageOperations({
        knex: { client: knex },
        entryTableManager,
        container,
        plugins
    });

    const writeOps = createEntryWriteOperations({
        knex,
        container,
        sqlOps,
        syncTableManager,
        fieldIndexRegistry,
        compressionHandler
    });

    const searchOps = createEntrySearchOperations({
        container,
        elasticsearch,
        fieldRegistry,
        fieldIndexRegistry
    });

    return {
        ...writeOps,
        ...searchOps,
        getRevisions: sqlOps.getRevisions,
        getRevisionById: sqlOps.getRevisionById,
        getByIds: sqlOps.getByIds,
        getLatestByIds: sqlOps.getLatestByIds,
        getPublishedByIds: sqlOps.getPublishedByIds,
        getLatestRevisionByEntryId: sqlOps.getLatestRevisionByEntryId,
        getPublishedRevisionByEntryId: sqlOps.getPublishedRevisionByEntryId,
        getPreviousRevision: sqlOps.getPreviousRevision
    };
};
```

- [ ] **Step 2: Verify build compiles**

```bash
yarn build -p @webiny/api-headless-cms-pg-os 2>&1 | tail -30
```

Expected: clean build with no errors.

- [ ] **Step 3: Run pre-commit checks**

```bash
yarn format > /dev/null 2>&1
yarn lint
```

- [ ] **Step 4: Commit**

```bash
git add packages/api-headless-cms-pg-os/src/operations/entry/
git commit -m "chore(api-headless-cms-pg-os): rewrite entry index.ts as thin compositor"
```

---

### Task 6: Verify — build and existing tests

**Files:** None (verification only)

- [ ] **Step 1: Full package build**

```bash
yarn build -p @webiny/api-headless-cms-pg-os 2>&1 | tail -30
```

- [ ] **Step 2: Run pre-commit suite**

```bash
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn format > /dev/null 2>&1
yarn lint
yarn webiny sync-dependencies
```

- [ ] **Step 3: Commit any generated file changes**

```bash
git add .
git status
# If changes exist:
git commit -m "chore(api-headless-cms-pg-os): update generated configs after refactor"
```
