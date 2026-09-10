# Simple content entries — spec

**Status:** proposed
**Date:** 2026-09-10
**Design:** `docs/.bruno/2026-09-10-simple-content-entries-design.md`
**Scope:** base code. Five operations, no publishing, no revisions, no GraphQL.

## 0. Conventions this spec follows

From `webiny-api-architect` (the MCP skill AGENTS.md routes backend work to) and
`ai-context/code-style/`:

- Feature directory is a **business capability in camelCase**; files inside are named for
  **technical responsibility**.
- **One abstraction per file**, in an `abstractions/` subfolder with an `index.ts` barrel.
- **One class per file** (`one-class-per-file.md`) — so one error per file, one event per file.
- **One exported function per file** (`one-public-function-per-file.md`).
- Naming: `{Action}{Entity}UseCase`, `{Action}{Entity}Repository`, `{Entity}{Problem}Error`.
- Abstraction tokens namespaced `"Cms/SimpleEntry/<Name>"`, matching the
  `"Cms/Entry/<FactoryName>"` convention AGENTS.md documents for factories.
- Every abstraction exports a namespace with `Interface`, plus `Input`/`Params`, `Error` and
  `Return` where they apply.
- Errors extend `BaseError` with `override readonly code = "..." as const`.
- Use cases return `Result<T, E>` and **never throw** for expected failures; **never return `null`** —
  absence is a domain `NotFoundError`.
- Use cases transient, repositories and factories singleton.
- Implementation classes declared separately with an `implements` clause, never inline in
  `createImplementation` (`no-inline-class-in-create-implementation.md`).
- `.js` extensions on every relative import; `~` for package-internal absolute imports; one named
  import per line; comments end with a period.

**Precedent.** `packages/app-audit-logs/src/features/listAuditLogs/` already has this exact shape —
camelCase feature dir, `abstractions/` holding one file per abstraction plus a barrel, and the
implementations at the feature root. `abstractions/` as a folder appears in 80 places under
`packages/`.

**Three deliberate divergences from `contentEntry/`,** which predates these rules: slice directories
are camelCase (`createSimpleEntry/`, not `CreateEntry/`); abstractions are one per file rather than a
combined `abstractions.ts`; errors are one class per file rather than a shared `errors.ts`.
Implementation results keep **named** exports, as the rest of `packages/api-headless-cms` does — the
skill's `default` export applies to `extensions/`.

## 1. Directory layout

```
packages/api-headless-cms/src/features/simpleContentEntries/
├── SimpleContentEntriesFeature.ts
├── constants.ts
├── types.ts
├── domain/
│   ├── assertSimpleModel.ts
│   ├── assertRegularModel.ts
│   └── errors/
│       ├── ModelNotSimpleError.ts
│       ├── ModelIsSimpleError.ts
│       ├── SimpleEntryNotFoundError.ts
│       ├── SimpleEntryValidationError.ts
│       ├── SimpleEntryPersistenceError.ts
│       ├── SimpleEntryNotAuthorizedError.ts
│       └── index.ts
├── entryDataFactories/
│   ├── SimpleEntryDataFactoriesFeature.ts
│   ├── createSimpleEntryData/
│   │   ├── abstractions/
│   │   │   ├── CreateSimpleEntryDataFactory.ts
│   │   │   └── index.ts
│   │   ├── CreateSimpleEntryDataFactory.ts
│   │   ├── feature.ts
│   │   └── index.ts
│   └── updateSimpleEntryData/            (same five files)
├── createSimpleEntry/
│   ├── abstractions/
│   │   ├── CreateSimpleEntryUseCase.ts
│   │   ├── CreateSimpleEntryRepository.ts
│   │   └── index.ts
│   ├── CreateSimpleEntryUseCase.ts
│   ├── CreateSimpleEntryRepository.ts
│   ├── feature.ts
│   └── index.ts
├── updateSimpleEntry/                    (same six files)
├── getSimpleEntry/
├── listSimpleEntries/
└── deleteSimpleEntry/
```

**No domain events.** Use cases check `AccessControl` but publish nothing, so there is no `events/`
folder and no `EventPublisher` dependency. Six files per slice.

## 2. Types

**`types.ts`**

```ts
export interface ISimpleCmsEntry<TValues extends CmsEntryValues = CmsEntryValues> {
    /** `<entryId>#0001`. `parseIdentifier` in the storage key builders requires this form. */
    id: string;
    entryId: string;
    tenant: string;
    modelId: string;
    createdOn: string;
    createdBy: CmsIdentity;
    values: TValues;
    /** Pinned. The storage operations read these; they are never anything else. */
    version: 1;
    status: "draft";
    locked: false;
    expiresAt: null;
}
```

Literal types on the pinned four, so a stray write is a compile error rather than a runtime surprise.

One named interface per shape — no inline object types:

```ts
export interface ICreateSimpleEntryInput<TValues> { id?: string; values: TValues; }
export interface IUpdateSimpleEntryInput<TValues> { values: TValues; }
export interface ISimpleEntryWhere { id?: string; entryId?: string; }
export interface IGetSimpleEntryParams { where: ISimpleEntryWhere; }
export interface IListSimpleEntriesParams { where?: ISimpleEntryWhere; sort?: string[]; limit?: number; after?: string | null; }
export interface IListSimpleEntriesMeta { cursor: string | null; hasMoreItems: boolean; totalCount: number; }
export interface IListSimpleEntriesResult<TValues> { items: ISimpleCmsEntry<TValues>[]; meta: IListSimpleEntriesMeta; }
```

**`constants.ts`**

```ts
export const SIMPLE_MODEL_TAG = "cms:simple";
export const SIMPLE_ENTRY_VERSION = 1 as const;
export const SIMPLE_ENTRY_STATUS = "draft" as const;
export const SIMPLE_ENTRY_LOCKED = false as const;
export const SIMPLE_ENTRY_EXPIRES_AT = null;
```

## 3. Errors

One class per file under `domain/errors/`, each extending `BaseError`:

| Class | Code |
| --- | --- |
| `ModelNotSimpleError` | `Cms/SimpleEntry/ModelNotSimple` |
| `ModelIsSimpleError` | `Cms/SimpleEntry/ModelIsSimple` |
| `SimpleEntryNotFoundError` | `Cms/SimpleEntry/NotFound` |
| `SimpleEntryValidationError` | `Cms/SimpleEntry/Validation` |
| `SimpleEntryPersistenceError` | `Cms/SimpleEntry/Persist` |
| `SimpleEntryNotAuthorizedError` | `Cms/SimpleEntry/NotAuthorized` |

```ts
// domain/errors/SimpleEntryNotFoundError.ts
export class SimpleEntryNotFoundError extends BaseError {
    override readonly code = "Cms/SimpleEntry/NotFound" as const;

    constructor(id: string) {
        super({ message: `Simple entry with id "${id}" was not found!` });
    }
}
```

Errors carrying data declare the shape as a generic: `BaseError<{ error: Error }>`.

## 4. Abstractions

Two per slice — use case and repository — one file each. Shape, using create as the example:

```ts
// createSimpleEntry/abstractions/CreateSimpleEntryUseCase.ts
export interface ICreateSimpleEntryUseCase {
    execute<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        input: ICreateSimpleEntryInput<T>
    ): Promise<Result<ISimpleCmsEntry<T>, CreateSimpleEntryError>>;
}

export interface ICreateSimpleEntryUseCaseErrors {
    notAuthorized: SimpleEntryNotAuthorizedError;
    validation: SimpleEntryValidationError;
    modelNotSimple: ModelNotSimpleError;
    repository: CreateSimpleEntryRepositoryError;
}

type CreateSimpleEntryError = ICreateSimpleEntryUseCaseErrors[keyof ICreateSimpleEntryUseCaseErrors];

export const CreateSimpleEntryUseCase = createAbstraction<ICreateSimpleEntryUseCase>(
    "Cms/SimpleEntry/CreateSimpleEntryUseCase"
);

export namespace CreateSimpleEntryUseCase {
    export type Interface = ICreateSimpleEntryUseCase;
    export type Input<T extends CmsEntryValues = CmsEntryValues> = ICreateSimpleEntryInput<T>;
    export type Error = CreateSimpleEntryError;
    export type Return<T extends CmsEntryValues = CmsEntryValues> = Promise<
        Result<ISimpleCmsEntry<T>, CreateSimpleEntryError>
    >;
}
```

Use-case error unions are a superset of their repository's.

## 5. Slice behaviour

**createSimpleEntry** — use case checks `accessControl.canAccessEntry({ model, rwd: "w" })`, calls
`CreateSimpleEntryDataFactory`, re-checks with the built entry, delegates to the repository.
Repository calls `assertSimpleModel(model)`, then `CreateEntryStorageOperation`.

**updateSimpleEntry** — resolves the existing entry through `GetSimpleEntryUseCase` and returns
`SimpleEntryNotFoundError` if absent, runs `UpdateSimpleEntryDataFactory` to merge values, calls
`UpdateEntryStorageOperation`. `createdOn`, `createdBy`, `entryId` and the pinned four are carried
from the original; there is no `savedOn`/`modifiedOn` to touch.

**getSimpleEntry** — resolves by id. Returns `Result<ISimpleCmsEntry, SimpleEntryNotFoundError>`,
never `null`. Prefers `GetLatestRevisionByEntryIdStorageOperation` when the caller holds an entry id,
since it is data-loader backed; `GetEntryStorageOperation` is also correct because reads are answered
by the search backend.

**listSimpleEntries** — calls `ListEntriesStorageOperation`, returns items plus
`IListSimpleEntriesMeta`. Filtering, sorting and pagination are the search backend's job.

**deleteSimpleEntry** — resolves the entry, then calls `DeleteEntryStorageOperation`, which purges
the entry's whole partition. Hard delete; no bin.

## 6. Data factories

**`CreateSimpleEntryDataFactory`** — token `"Cms/SimpleEntry/CreateSimpleEntryDataFactory"`,
singleton, injected rather than imported (AGENTS.md, Entry Data Factory Pattern). Dependencies:
`CmsContext`, `IdentityContext`, `TenantContext`. Steps, mirroring `CreateEntryDataFactory` without
the publishing branches:

1. `cleanInputValues(model, input.values)`.
2. `validateModelEntryDataOrThrow` — reached by DI, not by importing `~/crud/`.
3. `referenceFieldsMapping`.
4. `entryId = input.id ?? mdbid()`, validated against the pattern `CreateEntryDataFactory` uses;
   `id = createIdentifier({ id: entryId, version: SIMPLE_ENTRY_VERSION })`.
5. Assemble `ISimpleCmsEntry` with `createdOn`, `createdBy` and the four pinned constants.

No `AccessControl` dependency: status is always draft, so the publish/unpublish permission branches
that make `CreateEntryDataFactory` need it do not exist.

**`UpdateSimpleEntryDataFactory`** — takes the original entry plus the input, re-runs validation and
reference mapping over the new values, returns a new `ISimpleCmsEntry` preserving identity and the
pinned fields.

## 7. Guards

Two functions, one per file, in `domain/` — they differ in who calls them, so
`one-public-function-per-file.md` applies rather than its narrow exception:

```ts
// domain/assertSimpleModel.ts  — throws ModelNotSimpleError.
// domain/assertRegularModel.ts — throws ModelIsSimpleError.
```

Both live in the **repositories**, the last layer before a storage operation stores the data. That
covers every caller, including anything resolving a use case straight from the container.

**Inbound** — `assertSimpleModel(model)` as the first statement of the five simple repositories.

**Outbound** — `assertRegularModel(model)` as the first statement of the twelve mutating regular
repositories: `CreateEntryRepository`, `CreateEntryRevisionFromRepository`, `UpdateEntryRepository`,
`PublishEntryRepository`, `UnpublishEntryRepository`, `RepublishEntryRepository`,
`DeleteEntryRepository`, `MoveEntryToBinRepository`, `DeleteEntryRevisionRepository`,
`DeleteMultipleEntriesRepository`, `MoveEntryRepository`, `RestoreEntryFromBinRepository`.

The ten `Get*`/`List*` repositories are unchanged, so a simple entry stays readable through the
regular read paths. `UpdateRevisionDescription` and `UpdateSingletonEntry` own no repository and are
covered through the twelve.

Both throw rather than returning a `Result`: the repositories already wrap thrown errors into their
own persistence `Result`, and a repository reached with the wrong kind of model is a programming
error, not an expected failure.

## 8. Registration

**`feature.ts`** per slice — `createFeature({ name, register })`, use case transient, repository
`.inSingletonScope()`.

**`SimpleContentEntriesFeature.ts`** — registers `SimpleEntryDataFactoriesFeature` first, then the
five slices, queries before commands, as `ContentEntriesFeature` does. Called from
`HeadlessCmsFeature.ts` alongside `ContentEntriesFeature`.

**`index.ts`** — `export { }` of abstractions only. Never `export *`, never `feature.ts`, never an
implementation.

## 9. CRUD surface

**`src/crud/simpleContentEntry.crud.ts`** — resolves use cases and unwraps `Result` into
throw-or-return, mirroring `contentEntry.crud.ts`:

```ts
simpleCreateEntry(model, input)
simpleUpdateEntry(model, id, input)
simpleGetEntry(model, params)
simpleListEntries(model, params)
simpleDeleteEntry(model, id)
```

**No GraphQL.** No SDL generator, no resolvers, no schema snapshot tests.

## 10. Tests

- **Data factories** — the produced shape has exactly the eleven fields, all four pinned fields hold
  their constants, no meta field leaks in. This is the test that protects the design.
- **Slices** — stubbed repository; authorization failure and not-found on update, get and delete.
  Assert `Result` failures, never thrown errors.
- **Guards** — `assertSimpleModel` and `assertRegularModel` in isolation, then via repositories.
- **Integration** — create → get → list → update → delete, asserting two items per entry with
  `SK` of `REV#0001` and `L`, and that neither item's `data` carries a dropped meta field.
- **Wiring** — assert the five use cases resolve from the composition root, not only from a
  test-local container. Per AGENTS.md, two transports have shipped unwired with green unit tests.
- **Storage flag** — storage-backed suites silently skip without one and still exit 0. Run with
  `WEBINY_STORAGE=sql yarn test packages/api-headless-cms`, and `yarn test:os` for the
  search-backed configuration.

## 11. Out of scope

Admin UI, GraphQL, migrating existing entries, converting a model between regular and simple,
activity-log semantics, and any change inside an `api-headless-cms-*` storage operations package.
