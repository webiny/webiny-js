# DDB Entry Storage Operations — Per-Method DI Split

## Goal

Convert `api-headless-cms-ddb` entry storage operations from a monolithic factory function (`createEntriesStorageOperations`) to 22 individual DI classes, each implementing one per-method abstraction via `createImplementation`. Eliminate `CmsEntryStorageOpsRegistrar` and `registerCmsEntryStorageOperations`. Enforce completeness at compile time.

Scope: DDB adapter only. Other adapters (DDB-ES, SQL, PG-OS) keep their registrar pattern until migrated in follow-up PRs.

## Current State

- `packages/api-headless-cms-ddb/src/operations/entry/index.ts` (1421 lines)
- One factory function returns an object with 22 methods + `dataLoaders`
- Shared deps resolved at factory creation time: `entity`, `dataLoaders`, `storageTransformRegistry`, `getStorageOperationsModel()` (wraps `CmsStorageModelProvider`)
- `DdbCmsEntryStorageOpsRegistrar` calls factory per-request, then bridges to 22 per-method abstractions via `registerCmsEntryStorageOperations`
- `HeadlessCmsFeature` resolves registrar and calls `register(container)`

## Architecture

### New DI Abstractions

**CmsDdbDataLoaders** — wraps `DataLoadersHandler`, registered per-request. All methods that use dataloader caching depend on this token.

```
// abstractions/CmsDdbDataLoaders.ts
export const CmsDdbDataLoaders = createAbstraction<IDataLoadersHandler>("Cms/Ddb/DataLoaders");
```

### Shared Utilities

`convertToStorageEntry` and `convertFromStorageEntry` stay as importable utility functions (pure transforms, no state). `createKeys`, `createPartitionKey` etc. stay as utility functions. Each DI class imports what it needs.

### Per-Method DI Classes

22 files in `operations/entry/`, one per method. Naming: `Ddb<Operation>.ts`.

Each class:
- Implements the corresponding per-method abstraction interface (e.g., `ICreateEntryStorageOperation`)
- Lists its own deps explicitly via `createImplementation({ dependencies: [...] })`
- Uses `execute(model, params)` method signature matching the abstraction

Example:

```typescript
// operations/entry/DdbCreateEntry.ts
class DdbCreateEntryImpl implements ICreateEntryStorageOperation {
    constructor(
        private entity: CmsDdbEntryEntity.Interface,
        private dataLoaders: CmsDdbDataLoaders.Interface,
        private storageModelProvider: CmsStorageModelProvider.Interface
    ) {}

    async execute<T>(model, params) {
        const storageModel = this.storageModelProvider.getModel(model);
        // ... create logic from current factory
    }
}

export const DdbCreateEntry = createImplementation({
    abstraction: CreateEntryStorageOperation,
    implementation: DdbCreateEntryImpl,
    dependencies: [CmsDdbEntryEntity, CmsDdbDataLoaders, CmsStorageModelProvider]
});
```

### Method → Abstraction → DI Class Mapping

| Method | Abstraction | DI Class | Deps |
|--------|------------|----------|------|
| create | CreateEntryStorageOperation | DdbCreateEntry | entity, dataLoaders, storageModelProvider |
| createRevisionFrom | CreateEntryRevisionFromStorageOperation | DdbCreateEntryRevisionFrom | entity, dataLoaders, storageModelProvider |
| update | UpdateEntryStorageOperation | DdbUpdateEntry | entity, dataLoaders, storageModelProvider |
| move | MoveEntryStorageOperation | DdbMoveEntry | entity, storageModelProvider |
| moveToBin | MoveToBinStorageOperation | DdbMoveToBin | entity, dataLoaders, storageModelProvider |
| delete | DeleteEntryStorageOperation | DdbDeleteEntry | entity, dataLoaders, storageModelProvider |
| restoreFromBin | RestoreFromBinStorageOperation | DdbRestoreFromBin | entity, dataLoaders, storageModelProvider |
| deleteRevision | DeleteEntryRevisionStorageOperation | DdbDeleteEntryRevision | entity, dataLoaders, storageModelProvider |
| deleteMultipleEntries | DeleteMultipleEntriesStorageOperation | DdbDeleteMultipleEntries | entity, dataLoaders, storageModelProvider |
| get | GetEntryStorageOperation | DdbGetEntry | ListEntriesStorageOperation (delegates to list with limit:1) |
| list | ListEntriesStorageOperation | DdbListEntries | entity, storageModelProvider, storageTransformRegistry |
| publish | PublishEntryStorageOperation | DdbPublishEntry | entity, dataLoaders, storageModelProvider |
| unpublish | UnpublishEntryStorageOperation | DdbUnpublishEntry | entity, dataLoaders, storageModelProvider |
| getByIds | GetEntriesByIdsStorageOperation | DdbGetEntriesByIds | dataLoaders, storageModelProvider |
| getLatestByIds | GetLatestEntriesByIdsStorageOperation | DdbGetLatestEntriesByIds | dataLoaders, storageModelProvider |
| getPublishedByIds | GetPublishedEntriesByIdsStorageOperation | DdbGetPublishedEntriesByIds | dataLoaders, storageModelProvider |
| getRevisions | GetRevisionsStorageOperation | DdbGetRevisions | dataLoaders, storageModelProvider |
| getRevisionById | GetRevisionByIdStorageOperation | DdbGetRevisionById | dataLoaders, storageModelProvider |
| getLatestRevisionByEntryId | GetLatestRevisionByEntryIdStorageOperation | DdbGetLatestRevisionByEntryId | dataLoaders, storageModelProvider |
| getPublishedRevisionByEntryId | GetPublishedRevisionByEntryIdStorageOperation | DdbGetPublishedRevisionByEntryId | dataLoaders, storageModelProvider |
| getPreviousRevision | GetPreviousRevisionStorageOperation | DdbGetPreviousRevision | entity, storageModelProvider |
| getUniqueFieldValues | GetUniqueFieldValuesStorageOperation | DdbGetUniqueFieldValues | ListEntriesStorageOperation (delegates to list, aggregates field values) |

Note: `storageModelProvider` wraps `CmsStorageModelProvider`. `convertToStorageEntry` / `convertFromStorageEntry` are pure utility functions imported directly, not injected.

### Feature with Typed Completeness Check

```typescript
// DdbEntryStorageOpsFeature.ts
import type { Implementation, Constructor } from "@webiny/di";

interface DdbEntryOpsMap {
    create: Implementation<Constructor>;
    createRevisionFrom: Implementation<Constructor>;
    update: Implementation<Constructor>;
    // ... all 22 keys
}

const OPS: DdbEntryOpsMap = {
    create: DdbCreateEntry,
    createRevisionFrom: DdbCreateEntryRevisionFrom,
    update: DdbUpdateEntry,
    // ... all 22
};

export const DdbEntryStorageOpsFeature = createFeature({
    name: "cms.ddb.entryStorageOps",
    register: container => {
        // DataLoaders — per-request factory ensures fresh cache each request.
        // DdbEntryStorageOpsFeature.register() is called at app scope (by HeadlessCmsDdbFeature),
        // but registerFactory defers construction until first resolve (per-request context).
        container.registerFactory(CmsDdbDataLoaders, () => {
            const entity = container.resolve(CmsDdbEntryEntity);
            return new DataLoadersHandler({ entity });
        });

        for (const impl of Object.values(OPS)) {
            container.register(impl);
        }
    }
});
```

Missing a key in `OPS` = TypeScript compile error. Adding a new abstraction without a DDB impl = compile error.

### HeadlessCmsFeature Changes

Remove entry registrar logic. The adapter feature (via `HeadlessCmsDdbFeature`) registers all entry ops directly. `HeadlessCmsFeature` no longer touches entry storage ops.

```typescript
// Before:
const entryRegistrar = container.resolve(CmsEntryStorageOpsRegistrar);
entryRegistrar.register(container);

// After:
// (nothing — adapter feature already registered all 22 entry ops)
```

### Deleted Code

- `DdbCmsEntryStorageOpsRegistrar.ts`
- `registerCmsEntryStorageOperations.ts` (after all adapters migrate)
- `CmsEntryStorageOpsRegistrar.ts` abstraction (after all adapters migrate)
- `operations/entry/index.ts` monolithic factory (after all 22 methods extracted)

Since other adapters still use the registrar, `CmsEntryStorageOpsRegistrar` and `registerCmsEntryStorageOperations` stay until all adapters are migrated. For this PR, only DDB's registrar is deleted.

### Cross-Op Dependencies

Two methods delegate to `list` internally:
- `get` — calls `list` with `limit: 1`
- `getUniqueFieldValues` — calls `list` with high limit, aggregates results

Both `DdbGetEntry` and `DdbGetUniqueFieldValues` depend on `ListEntriesStorageOperation` abstraction. This creates cross-op dependencies — acceptable since they're read-only delegations.

## Migration Strategy

Incremental, one method at a time:

1. Create `CmsDdbDataLoaders` abstraction
2. Create `DdbEntryStorageOpsFeature` skeleton with typed map (all 22 keys pointing to placeholder)
3. For each method:
   a. Extract logic from monolith into `Ddb<Op>.ts`
   b. Add to feature map
   c. Remove from monolith
4. Delete monolith, registrar, old factory
5. Update `HeadlessCmsDdbFeature` to use `DdbEntryStorageOpsFeature`
6. Update `HeadlessCmsFeature` — remove registrar call for DDB path

Build and test after each method extraction to catch issues early.

## Testing

- Run `yarn test packages/api-headless-cms --shard=N/64` after each extracted method
- All 290 DDB tests must pass
- No new test files needed — existing tests cover all methods via GraphQL API
