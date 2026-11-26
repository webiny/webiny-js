# CMS Singleton Publishing (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Singleton CMS models tagged `$publishing:true` get publish, unpublish and revisions; every singleton is edited in the regular entry editor without the list.

**Architecture:** Thin singleton use cases resolve the singleton `entryId`, run the singleton checks, and delegate to the generic entry use cases. The singular GraphQL SDL is split into shared types, read/preview `get<S>` and a manage block whose signatures match the regular manage SDL, so the admin editor gateways work unchanged. The admin gets a `SingletonEditorView` with its own presenter around the regular editor body.

**Tech Stack:** TypeScript, `@webiny/di` features/abstractions, `@webiny/feature/api` `Result`, GraphQL SDL strings, React + MobX presenters, Vitest.

**Spec:** `docs/.bruno/specs/2026-11-26-cms-singleton-publishing-design.md` (read it first; this plan does not repeat its rules).

## Global Constraints

- Phase 1 only. Phase 2 (scheduling) is out of scope; do not hide the scheduler UI.
- No storage key changes. DDB/DDB-ES key formats are frozen.
- Before coding, read every rule in `ai-context/code-style/` (required by `AGENTS.md`). Most relevant here: `one-class-per-file`, `one-public-function-per-file`, `one-component-per-file`, `presenter-owns-component-state`, `no-container-as-service-locator`, `no-backwards-compat`, `no-multiline-ternaries`, `no-nested-call-arguments`, `no-inline-class-in-create-implementation`.
- No `Impl`/`Implementation` suffix on exported names or file names. No inline object types. No helper functions or private methods that wrap use case calls. Barrels export only what external consumers need.
- Exact error messages (from the spec):
  - `"Model does not support publishing."`
  - `"Model does not support revisions."`
  - `"A revision id is required."`
  - `"Singleton entry cannot be deleted."`
  - `"The first revision of a singleton entry cannot be deleted."`
  - `"The published revision cannot be deleted. Unpublish it first."`
- Tag values: `"$publishing:true"`, `"$publishing:false"`.
- Tests run by file path, one test command at a time, never a whole package. `api-headless-cms` test files run on every storage, in this order: `yarn test <path>`, `yarn test:es <path>`, `yarn test:os <path>`, `yarn test:sql <path>`, `WEBINY_STORAGE=pg,sql yarn test <path>`. Other packages: `yarn test <path>`.
- Commit chain, run before every commit step (rerun from the top after any fix): `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `git add .`. Commits use Conventional Commits.

## Review Focus

- An admin URL whose `id` is a revision of another entry: the editor shows the `EntryNotFoundError` message, not a blank form. Test in Task 8.
- An untagged singleton whose `#0001` is still locked from an earlier tagged period: Save works and no publish actions show. Tests in Tasks 2 and 8.
- A tagged singleton whose `#0001` is published: deleting `#0001` fails with the first-revision message. Test in Task 4.
- `getSettingsRevisions` called with a revision id (what the admin sends): returns the list. Test in Task 4.
- A singleton model with no fields: no API, and the admin shows "This model has no fields." without a request. Tests in Tasks 4 and 8.

---

### Task 1: Singleton helpers and tag constants (API)

**Files:**
- Modify: `packages/api-headless-cms/src/constants.ts`
- Create: `packages/api-headless-cms/src/domain/contentModel/isSingletonModel.ts`
- Create: `packages/api-headless-cms/src/domain/contentModel/isPublishingEnabled.ts`
- Create: `packages/api-headless-cms/src/domain/contentModel/createSingletonEntryId.ts`
- Modify: `packages/api-headless-cms/src/exports/api/cms/model.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/shared/entryOwnerAccess.ts:15-17`
- Modify: `packages/api-headless-cms-workflows/src/features/wrappers/ListCmsEntryWorkflowModels/ListCmsEntryWorkflowModelsUseCase.ts:26`
- Modify: `packages/api-headless-cms-workflows/src/utils/isBindableModel.ts:4` and its importers `features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.ts:5,56`, `...OnBeforeUpdate.ts:5,56` and `__tests__/utils/isBindableModel.test.ts:2,10`
- Test: `packages/api-headless-cms/__tests__/domain/singletonModel.test.ts`

**Interfaces:**
- Produces:
  - `CMS_MODEL_PUBLISHING_ENABLED_TAG = "$publishing:true"`, `CMS_MODEL_PUBLISHING_DISABLED_TAG = "$publishing:false"` in `constants.ts`
  - `isSingletonModel(model: Pick<CmsModel, "tags">): boolean`
  - `isPublishingEnabled(model: Pick<CmsModel, "tags">): boolean`
  - `createSingletonEntryId(model: Pick<CmsModel, "modelId">): string`, returns `createCacheKey(model.modelId)` (the value `GetSingletonEntryUseCase.ts:35` computes). Internal; not exported from the barrel.
  - `isSingletonModel`, `isPublishingEnabled`, `CMS_MODEL_PUBLISHING_ENABLED_TAG` and `CMS_MODEL_PUBLISHING_DISABLED_TAG` exported from `@webiny/api-headless-cms/exports/api/cms/model.js`; the workflows package imports them from there

- [ ] **Step 1: Write the failing test** `singletonModel.test.ts`:

```ts
it("isPublishingEnabled: regular model unless $publishing:false", () => {
    expect(isPublishingEnabled({ tags: ["type:model"] })).toBe(true);
    expect(isPublishingEnabled({ tags: ["$publishing:false"] })).toBe(false);
});
it("isPublishingEnabled: singleton only with $publishing:true", () => {
    expect(isPublishingEnabled({ tags: ["singleEntry"] })).toBe(false);
    expect(isPublishingEnabled({ tags: ["singleEntry", "$publishing:true"] })).toBe(true);
});
it("createSingletonEntryId is stable per modelId", () => {
    expect(createSingletonEntryId({ modelId: "settings" })).toBe(createCacheKey("settings"));
});
```

- [ ] **Step 2: Run** `yarn test packages/api-headless-cms/__tests__/domain/singletonModel.test.ts`. Expected: FAIL, modules not found.
- [ ] **Step 3: Implement** the helpers and constants. Move `isSingletonModel` out of `entryOwnerAccess.ts` (import it there). Replace the private copy in `ListCmsEntryWorkflowModelsUseCase.ts:26` with the export. Remove `UNPUBLISHABLE_MODEL_TAG` from `isBindableModel.ts` and use `CMS_MODEL_PUBLISHING_DISABLED_TAG` there and in both handlers (no alias, per `no-backwards-compat`).
- [ ] **Step 4: Run** the new test, then `yarn test packages/api-headless-cms-workflows/__tests__/utils/isBindableModel.test.ts` and `yarn test packages/api-headless-cms-workflows/__tests__/wrappers/listWorkflowModels.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit chain, then commit** `feat(api-headless-cms): add singleton and publishing model helpers`.

### Task 2: Generic use case guards for singletons

**Files:**
- Modify: `packages/api-headless-cms/src/features/contentEntry/PublishEntry/PublishEntryUseCase.ts:46`
- Modify: `packages/api-headless-cms/src/features/contentEntry/UnpublishEntry/UnpublishEntryUseCase.ts:54`
- Modify: `packages/api-headless-cms/src/features/contentEntry/CreateEntryRevisionFrom/CreateEntryRevisionFromUseCase.ts:54,75`
- Modify: `packages/api-headless-cms/src/features/contentEntry/DeleteEntryRevision/DeleteEntryRevisionUseCase.ts:64`
- Modify: `packages/api-headless-cms/src/features/contentEntry/DeleteEntry/DeleteEntryUseCase.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/DeleteMultipleEntries/DeleteMultipleEntriesUseCase.ts`
- Modify: `packages/api-headless-cms/src/features/contentEntry/UpdateEntry/UpdateEntryUseCase.ts:47`
- Test: `packages/api-headless-cms/__tests__/contentAPI/singletonGenericGuards.test.ts`

**Interfaces:**
- Consumes: `isSingletonModel`, `isPublishingEnabled` (Task 1).
- Produces: generic use cases that enforce the spec's "generic use cases also guard singletons" list and the untagged `#0001` lock skip.

- [ ] **Step 1: Write the failing tests.** Build two model plugins with `createPluginFromCmsModel` from `getCmsModel("categorySingleton")` (as `singletonContentEntry.test.ts:7-10`): untagged `tags: [CMS_MODEL_SINGLETON_TAG]` and tagged `tags: [CMS_MODEL_SINGLETON_TAG, CMS_MODEL_PUBLISHING_ENABLED_TAG]`, each in its own `describe` with its own `useSingletonCategoryHandler({ path: "manage/en-US", plugins })`. In each test call `manager.introspect()` once, then take `const container = manager.getContext().container`, get the model with `container.resolve(GetModelUseCase).execute("categorySingleton")` (`features/contentModel/GetModel/abstractions.ts:12-13`), and seed entries with `CreateEntryUseCase` (id from `createSingletonEntryId`) and `CreateEntryRevisionFromUseCase`. Tests:
  - `PublishEntryUseCase`, `UnpublishEntryUseCase`, `CreateEntryRevisionFromUseCase` on an untagged singleton revision fail with `"Model does not support publishing."`.
  - `DeleteEntryRevisionUseCase`, tagged: `#0001` fails with the first-revision message (also when `#0001` is published); the published `#0002` fails with the published message; an unpublished `#0003` succeeds.
  - `DeleteEntryRevisionUseCase`, untagged `#0002`: fails with `"Model does not support publishing."`.
  - `DeleteEntryUseCase` and `DeleteMultipleEntriesUseCase` on a singleton fail with `"Singleton entry cannot be deleted."`.
  - `UpdateEntryUseCase`: untagged singleton with a locked `#0001` succeeds; untagged with a locked leftover `#0002` fails with `EntryLockedError`; tagged with a locked revision fails with `EntryLockedError`.
  - A user with own-entries permission (handler `identity`/`permissions` params; see `__tests__/contentAPI/security/contentEntries/ownEntries.test.ts`) publishes, unpublishes, creates a revision from, and deletes a revision of a tagged singleton created by another identity.
  - Events: a `PublishEntry` on a tagged singleton fires `EntryAfterPublishEventHandler` (`features/contentEntry/PublishEntry/index.ts`). Write this test with `useHandler` and a container plugin that registers the handler, as `__tests__/lifecycleHooks/onBeforeEntryPublish.test.ts:12-20` does.
- [ ] **Step 2: Run** `yarn test packages/api-headless-cms/__tests__/contentAPI/singletonGenericGuards.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Guards return `EntryValidationError(message)`. Owner-check exemption: when `isSingletonModel(model)`, skip only the entry-level `canAccessEntry({ model, entry, ... })` call; model-level checks stay. Delete checks run `#0001` before published. Lock skip condition in `UpdateEntryUseCase.ts:47`: `isSingletonModel(model) && !isPublishingEnabled(model) && parseIdentifier(id).version === 1`.
- [ ] **Step 4: Run** the test file with all five storage commands. Expected: PASS on each.
- [ ] **Step 5: Commit chain, then commit** `feat(api-headless-cms): guard generic entry use cases for singleton models`.

### Task 3: Singleton use cases

**Files:**
- Create one folder per use case under `packages/api-headless-cms/src/features/contentEntry/`, each with `abstractions.ts`, `<Name>UseCase.ts`, `feature.ts`, `index.ts` (follow `GetSingletonEntry/`):
  `GetLatestSingletonEntry`, `GetPublishedSingletonEntry`, `GetSingletonEntryRevision`, `ListSingletonEntryRevisions`, `UpdateSingletonEntryRevisionDescription`, `CreateSingletonEntryRevisionFrom`, `PublishSingletonEntry`, `UnpublishSingletonEntry`, `DeleteSingletonEntryRevision`
- Modify: `features/contentEntry/UpdateSingletonEntry/*` (takes `revision`)
- Create: `features/contentEntry/shared/checkSingletonRevision.ts` (one public pure function)
- Modify: `features/contentEntry/ContentEntriesFeature.ts` (register the new features)
- Test: `packages/api-headless-cms/__tests__/contentEntry/singletonUseCases.test.ts`

`GetSingletonEntry/` stays until Task 4 removes its last users.

**Interfaces:**
- Consumes: Task 1 helpers; Task 2 guards; generic `GetLatestRevisionByEntryId.execute(model, { id })`, `GetPublishedRevisionByEntryId.execute(model, entryId)`, `GetRevisionById`, `GetRevisionsByEntryId`, `CreateEntry`, `UpdateEntry`, `UpdateRevisionDescription`, `CreateEntryRevisionFrom`, `PublishEntry`, `UnpublishEntry`, `DeleteEntryRevision`.
- Produces (each `execute` returns `Promise<Result<…, UseCase.Error>>`):
  - `GetLatestSingletonEntryUseCase.execute(model)` → `CmsEntry`
  - `GetPublishedSingletonEntryUseCase.execute(model)` → `CmsEntry`
  - `GetSingletonEntryRevisionUseCase.execute(model, revision)` → `CmsEntry`
  - `ListSingletonEntryRevisionsUseCase.execute(model, id)` → `CmsEntry[]`
  - `UpdateSingletonEntryUseCase.execute(model, revision, data, options?)` → `CmsEntry`
  - `UpdateSingletonEntryRevisionDescriptionUseCase.execute(model, revision, revisionDescription)` → `CmsEntry`
  - `CreateSingletonEntryRevisionFromUseCase.execute(model, revision, data?, options?)` → `CmsEntry`
  - `PublishSingletonEntryUseCase.execute(model, revision)`, `UnpublishSingletonEntryUseCase.execute(model, revision)` → `CmsEntry`
  - `DeleteSingletonEntryRevisionUseCase.execute(model, revision)` → `void` (same as `DeleteEntryRevision/abstractions.ts:14`; the resolver returns `true` on success)
  - `checkSingletonRevision(params: CheckSingletonRevisionParams): Result<string, EntryNotFoundError | EntryValidationError>` with `CheckSingletonRevisionParams { model: CmsModel; value: string; operation: SingletonOperation }`, implementing steps 1-4 of the spec's "Order of checks"; returns the parsed entry id. Steps per operation:

| Operation | 1 belongs | 2 revision id required | 3 untagged: publishing | 4 untagged: only `#0001` |
|---|---|---|---|---|
| `getRevision`, `update`, `updateRevisionDescription` | yes | yes ("A revision id is required.") | no | yes |
| `createFrom`, `publish`, `unpublish` | yes | yes ("A revision id is required.") | yes | yes |
| `delete` | yes | yes ("Singleton entry cannot be deleted.") | yes | yes |
| `listRevisions` | yes | no | no | no (the use case filters instead) |

`SingletonOperation` union:

```ts
type SingletonOperation =
    | "getRevision"
    | "listRevisions"
    | "update"
    | "updateRevisionDescription"
    | "createFrom"
    | "publish"
    | "unpublish"
    | "delete";
```

- [ ] **Step 1: Write the failing tests**, one `describe` per use case, same setup as Task 2. Assertions from the spec, including: untagged `GetLatest` with a leftover `#0002` returns `#0001`; tagged `GetPublished` with nothing published returns `id === "<entryId>#0001"` and every field in `values` empty; `ListSingletonEntryRevisions` accepts `entryId` and `"<entryId>#0002"`, and returns only `#0001` for an untagged model with a leftover `#0002`; foreign revision → `EntryNotFoundError`; untagged `update(#0002)` → `"Model does not support revisions."`; untagged `publish(#0002)` → `"Model does not support publishing."`; `delete(entryId)` → `"Singleton entry cannot be deleted."`; `update(entryId)` → `"A revision id is required."`.
- [ ] **Step 2: Run** `yarn test packages/api-headless-cms/__tests__/contentEntry/singletonUseCases.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Find-or-create in the two get use cases uses `CreateEntry` with `{ skipValidation: true }`, as `GetSingletonEntryUseCase.ts:45-54` does. `GetPublishedSingletonEntryUseCase`, tagged with nothing published: returns the `#0001` entry from `GetRevisionById` with `values` replaced by `{}` (field values resolve to `null` in GraphQL, as for a new entry today).
- [ ] **Step 4: Run** the test file with all five storage commands. Expected: PASS on each.
- [ ] **Step 5: Commit chain, then commit** `feat(api-headless-cms): add singleton entry use cases`.

### Task 4: Singular GraphQL SDL, resolvers and public exports

**Files:**
- Modify: `packages/api-headless-cms/src/graphql/schema/createSingularSDL.ts`
- Modify: `packages/api-headless-cms/src/graphql/schema/createSingularResolvers.ts`
- Modify: `packages/api-headless-cms/src/graphql/schema/schemaPlugins.ts:52`
- Create: one resolver file per field under `graphql/schema/resolvers/singular/` (follow `resolveGet.ts`); remove `resolveGet.ts`/`resolveUpdate.ts`
- Delete: `features/contentEntry/GetSingletonEntry/` and its registration in `ContentEntriesFeature.ts`
- Modify: `packages/api-headless-cms/src/exports/api/cms/entry.ts:110-111,151-152` (export `GetLatestSingletonEntryUseCase`, `GetPublishedSingletonEntryUseCase`, `UpdateSingletonEntryUseCase`; remove `GetSingletonEntryUseCase`)
- Modify: `packages/webiny/src/api/cms/entry.ts:77,96` (same change)
- Modify: `packages/api-headless-cms/__tests__/testHelpers/useSingletonCategoryHandler.ts`
- Modify: `packages/api-headless-cms/__tests__/contentAPI/singletonContentEntry.test.ts`
- Create: `packages/api-headless-cms/__tests__/contentAPI/singletonPublishing.test.ts`
- Modify: `ai-context/core-features-reference.md` (singleton publishing entry)
- Modify: `packages/webiny/API_ABSTRACTIONS_REGISTRY.md:214,229` (registry rows for the changed exports)

**Interfaces:**
- Consumes: Task 3 use cases (the spec's resolver table).
- Produces: the GraphQL operations in the spec's Manage API block and read/preview `get<S>`; handler helpers `getCategory()`, `getCategoryLatest()`, `getCategoryRevision(revision)`, `getCategoryRevisions(id)`, `updateCategory(revision, data)`, `updateCategoryRevisionDescription(revision, text)`, `createCategoryFrom(revision)`, `publishCategory(revision)`, `unpublishCategory(revision)`, `deleteCategory(revision)`.

- [ ] **Step 1: Write the failing tests.**
  - `singletonContentEntry.test.ts` (untagged): `getCategoryLatest` creates and returns `#0001`; `updateCategory(#0001)` updates; read and preview `getCategory` return the updated `#0001`; manage `getCategory` without arguments fails GraphQL validation with `Cannot query field "getCategory" on type "Query"`.
  - `singletonPublishing.test.ts` (tagged):
    - read returns empty values before publish; after `publishCategory(#0001)` read returns the published values;
    - after `createCategoryFrom(#0001)` and `updateCategory(#0002)`, preview returns `#0002` values and read still returns `#0001` values;
    - `updateCategory(#0001)` while published fails with the `EntryLockedError` code;
    - `getCategoryRevisions("<entryId>#0002")` returns two revisions;
    - deleting published `#0001` fails with the first-revision message;
    - tag lifecycle: publish `#0001` tagged; switch to an untagged plugin; `updateCategory(#0001)` works and read returns the new values; switch back to tagged; read returns the same values;
    - untagged with a leftover `#0002`: preview `getCategory` and `getCategoryLatest` return `#0001`.
  - Read and preview introspection: the `<S>` type has no `meta`; `Mutation` has no singleton fields.
  - A singleton model with no fields has no `get<S>` on any endpoint. (Layout cells are not stored in `model.fields`, see `BaseModelBuilder.ts:149-153`, so a layout-only model counts as having no fields.)
  - Preview `getCategory` creates the entry when it does not exist.
  - Existing `#0001` with no migration: create `#0001` with `CreateEntryUseCase` (as the old code did), then add the tag; manage `getCategoryLatest` returns it and `publishCategory(#0001)` works.
- [ ] **Step 2: Run** both test files with `yarn test`. Expected: FAIL.
- [ ] **Step 3: Implement** the SDL split and resolvers per the spec's "Schema generation" section. `schemaPlugins.ts:52` passes `type` (`read` or `preview`) through for the use-case choice; field resolvers keep `endpointType: "read"` for preview. Use one no-fields predicate, `model.fields.length === 0`, in both `createSingularSDL.ts` (replacing the `inputFields.length === 0` check at :30, not adding to it) and `createSingularResolvers.ts:26`; for fields that render no input or value type, the SDL already falls back to `_empty: String` (`createSingularSDL.ts:63,102`), and `createFieldResolvers.ts:39-41` skips fields without a plugin. Remove `GetSingletonEntry/`, update both export files, and add the singleton publishing entry to `ai-context/core-features-reference.md`.
- [ ] **Step 4: Run** both test files with all five storage commands. Expected: PASS on each.
- [ ] **Step 5: Commit chain, then commit** `feat(api-headless-cms): singleton publishing GraphQL operations`.

### Task 5: Admin model helpers

**Files:**
- Modify: `packages/app-headless-cms-common/src/constants.ts` (add both tag constants)
- Create: `packages/app-headless-cms-common/src/isSingletonModel.ts`, `packages/app-headless-cms-common/src/isPublishingEnabled.ts` (export from `src/index.ts`)
- Modify: `packages/app-headless-cms/src/admin/hooks/useIsModelPublishable.ts:7`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/actions/SaveContentButton.tsx:24`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/actions/CreateNewRevisionButton.tsx:28`
- Modify: `packages/app-headless-cms-workflows/src/presentation/contentReviews/toContentTypes.ts:5` (drop its local `UNPUBLISHABLE_MODEL_TAG`, import `CMS_MODEL_PUBLISHING_DISABLED_TAG` from `@webiny/app-headless-cms-common`)
- Test: `packages/app-headless-cms-common/src/isPublishingEnabled.test.ts`

**Interfaces:**
- Produces: `isSingletonModel(model: Pick<CmsModel, "tags">): boolean` and `isPublishingEnabled(model: Pick<CmsModel, "tags">): boolean` in `@webiny/app-headless-cms-common`, same rules as Task 1.

- [ ] **Step 1: Write the failing test** with the Task 1 assertions plus `isSingletonModel({ tags: ["singleEntry"] }) === true`.
- [ ] **Step 2: Run** `yarn test packages/app-headless-cms-common/src/isPublishingEnabled.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** and switch the three call sites to `isPublishingEnabled(model)`.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit chain, then commit** `feat(app-headless-cms): share the singleton and publishing-enabled rules`.

### Task 6: Admin singleton editor gateways

**Files:**
- Create: `packages/app-headless-cms/src/features/contentEntry/singletonEditor/getLatest/` with `abstractions.ts` (use case abstraction), `gatewayAbstractions.ts` (gateway abstraction), `GetLatestSingletonEntryGateway.ts`, `GetLatestSingletonEntryUseCase.ts`, `feature.ts` (`GetLatestSingletonEntryFeature`)
- Create: `packages/app-headless-cms/src/features/contentEntry/singletonEditor/getRevision/` with `GetEntryGatewaySingletonDecorator.ts`, `feature.ts` (`GetSingletonEntryRevisionFeature`)
- Create: `packages/app-headless-cms/src/features/contentEntry/singletonEditor/feature.ts` (`SingletonEditorFeature`, registers both features)
- Modify: `packages/app-headless-cms/src/features/contentEntry/feature.ts:15,46` (register `SingletonEditorFeature` instead of `SingletonEntryFeature`)
- Delete: `packages/app-headless-cms/src/features/contentEntry/singletonEntry/`
- Modify: `packages/app-headless-cms/src/features/contentEntry/entryValueGateways.test.ts` (drop the `singletonEntry` imports and cases)
- Test: `packages/app-headless-cms/src/features/contentEntry/singletonEditor/singletonEditorGateways.test.ts`

**Interfaces:**
- Consumes: Task 4 operations; Task 5 `isSingletonModel`.
- Produces:
  - `GetLatestSingletonEntryUseCase.execute(model: CmsModel): Promise<Result<CmsContentEntry, CmsEntryError>>`
  - `GetEntryGatewaySingletonDecorator`, same interface as `features/contentEntry/getEntry/abstractions.ts:29`: for `isSingletonModel(model)` it sends `get<S>Revision(revision)`, otherwise it delegates to the decorated gateway. Same contract as `GetEntryGateway.ts:53-55`: returns the entry and throws `Error` when the response has `error`.
  - `SingletonEditorFeature` registers the gateway, the use case and the decorator (`container.registerDecorator`, as `features/contentEntry/referenceTitles/feature.ts:13-14`).

- [ ] **Step 1: Write the failing tests** with a mocked GraphQL client (follow `entryValueGateways.test.ts`): the latest gateway sends `get<S>Latest` with no variables and maps `error` to a failed `Result`; the decorator sends `get<S>Revision` with `{ revision }` for a singleton model, throws on `error`, and calls the decorated gateway for a regular model; a container with `SingletonEditorFeature` registered resolves `GetEntryGateway` to the decorator.
- [ ] **Step 2: Run** the test file with `yarn test`. Expected: FAIL.
- [ ] **Step 3: Implement** and switch the registration in `features/contentEntry/feature.ts`. Saving needs no singleton gateway: the editor saves through `UpdateEntryUseCase` → `UpdateEntryGateway` (`features/contentEntry/updateEntry/UpdateEntryGateway.ts:20-21`), which already sends `update<S>(revision, data, options)`, the Task 4 signature. The deleted `UpdateSingletonEntryGateway` sent the removed `update<S>(data)` shape.
- [ ] **Step 4: Run** the new test and `yarn test packages/app-headless-cms/src/features/contentEntry/entryValueGateways.test.ts`. Expected: PASS.
- [ ] **Step 5: Commit chain, then commit** `feat(app-headless-cms): singleton editor gateways`.

### Task 7: SingletonEditorPresenter

**Files:**
- Create: `packages/app-headless-cms/src/presentation/contentEntries/singletonEditor/abstractions.ts`, `SingletonEditorPresenter.ts`, `feature.ts` (`SingletonEditorPresenterFeature`)
- Test: `packages/app-headless-cms/src/presentation/contentEntries/singletonEditor/SingletonEditorPresenter.test.ts`

**Interfaces:**
- Consumes: Task 6 `GetLatestSingletonEntryUseCase`; the app router (`packages/app/src/features/router/abstractions.ts`, `replaceRoute(route, params)` at :68,113); `Routes.ContentEntries.List` (`app-headless-cms/src/routes.ts:18-29`, already has optional `id`).
- Produces: `ISingletonEditorPresenter` with `vm: ISingletonEditorVm { entryId: string | null; loading: boolean; error: string | null; hasFields: boolean }`, `init(model: CmsModel, routeEntryId: string | undefined): Promise<void>`, `dispose(): void`.

- [ ] **Step 1: Write the failing tests:**
  - model with no fields: `vm.hasFields === false`, no use case call;
  - `routeEntryId` given: `vm.entryId === routeEntryId`, no use case call;
  - no `routeEntryId`: calls `GetLatestSingletonEntryUseCase`, then `replaceRoute(Routes.ContentEntries.List, { modelId, id: entry.id })`, `vm.entryId === entry.id`;
  - `GetLatestSingletonEntryUseCase` fails: `vm.error` holds the error message.
  - `init` again with a new `routeEntryId` (revision switch through the route): `vm.entryId` updates.
- [ ] **Step 2: Run** `yarn test packages/app-headless-cms/src/presentation/contentEntries/singletonEditor/SingletonEditorPresenter.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `hasFields` is `model.fields.length > 0`, checked first in `init`.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit chain, then commit** `feat(app-headless-cms): singleton editor presenter`.

### Task 8: SingletonEditorView and removal of the old singleton UI

**Files:**
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/ContentEntryFormView.tsx` (extract the editor body)
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/form/ContentEntryFormPresenter.ts:316-334` and its abstractions (load error state)
- Test: `packages/app-headless-cms/src/presentation/contentEntries/form/ContentEntryFormPresenter.test.ts` (create, or extend if present)
- Create: `packages/app-headless-cms/src/presentation/contentEntries/views/ContentEntryEditorBody.tsx` (props `ContentEntryEditorBodyProps { entryId: string | null; modelName: string; onBack?: () => void }`)
- Create: `packages/app-headless-cms/src/presentation/contentEntries/views/SingletonEditorView.tsx`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/ModelLoader.tsx:23`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/ContentEntriesView.tsx:9,45` (register `SingletonEditorPresenterFeature` instead of `SingleEntryPresenterFeature`)
- Delete: `SingleEntryView.tsx`, `SingleEntryLayout.tsx`, `SingleEntryFormContent.tsx`, `presentation/contentEntries/singleEntry/`
- Delete: `packages/app-record-locking/src/presentation/entryLocking/SingleEntryPresenterDecorator.ts` (registration at `entryLocking/feature.ts:6,13`) and `SingleEntryContentDecorator.tsx` (registration at `packages/app-record-locking/src/RecordLockingModule.tsx:12,113`)
- Test: `packages/app-headless-cms/src/presentation/contentEntries/views/SingletonEditorView.test.tsx`

**Interfaces:**
- Consumes: Task 7 presenter; Task 5 `isPublishingEnabled` (through `useIsModelPublishable`).
- Produces: `SingletonEditorView({ model }: SingletonEditorViewProps)`; `ContentEntryEditorBody`.

- [ ] **Step 1: Write the failing tests** (React Testing Library, presenter and editor use cases mocked):
  - renders `ContentEntryEditorBody` with `vm.entryId`, no back button, no list, no "New entry";
  - `vm.error` set: shows the error message;
  - route `id` is a foreign revision: the editor body shows the form presenter's `vm.loadError` (the `EntryNotFoundError` message thrown by the Task 6 decorator);
  - presenter test: `loadRevision` with a gateway that throws sets `vm.loadError` to the error message and clears `loading`; a later successful `loadRevision` clears `vm.loadError`;
  - route `id` changes: the view calls `presenter.init` with the new id and the editor body loads that revision;
  - `vm.hasFields === false`: shows "This model has no fields.";
  - untagged model: Save shows; publish actions and "New revision" do not; Save on a locked `#0001` calls update.
- [ ] **Step 2: Run** `yarn test packages/app-headless-cms/src/presentation/contentEntries/views/SingletonEditorView.test.tsx`. Expected: FAIL.
- [ ] **Step 3: Implement.** `ContentEntryFormPresenter.loadRevision` has `try/finally` and no `catch` today (`:316-334`), so a failed load is an unhandled rejection. Add `loadError: string | null` to the view model, set it in a `catch`, clear it on the next load, and render it in `ContentEntryEditorBody` in place of the form. This also fixes the regular editor. `ContentEntryFormView` becomes the list adapter around `ContentEntryEditorBody`, reading `entryId`, folder id and model name from the list presenter as today. `SingletonEditorView` provides `ModelProvider` and `ContentEntryEditorWithConfig` like `ListView.tsx:26-28`, and calls `presenter.init(model, route.params.id)` on mount and whenever `route.params.id` changes. `ModelLoader` renders it for every singleton. Remove the old singleton UI and both record-locking singleton decorators.
- [ ] **Step 4: Run** the new test, then the existing record-locking tests one file at a time (`RecordLockingPresenter.test.ts`, `LogOutUseCaseLockingDecorator.test.ts` in `packages/app-record-locking/src/presentation/entryLocking/`). Expected: PASS.
- [ ] **Step 5: Commit chain, then commit** `feat(app-headless-cms): edit singletons in the regular entry editor`.

### Task 9: Singleton guards in the editor and workflows

**Files:**
- Create: `packages/app-headless-cms/src/admin/components/IsNotSingletonModel.tsx`
- Modify: `packages/app-headless-cms/src/ContentEntriesModule.tsx:183` (wrap `DeleteEntryMenuItem`)
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/RevisionListItem.tsx:256`
- Modify: `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.ts` (early return when `!isReviewableModel(model)`)
- Test: `packages/app-headless-cms/src/presentation/contentEntries/views/SingletonEditorView.test.tsx` (extend)
- Test: `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.test.ts` (extend)

**Interfaces:**
- Consumes: Task 8 view; Task 5 `isSingletonModel`.
- Produces: `IsNotSingletonModel({ children }: IsNotSingletonModelProps)`.

- [ ] **Step 1: Write the failing tests:**
  - tagged model: publish actions show; the delete-entry menu item does not; delete on `#0001` and on the published revision is disabled in the revisions list; delete on another unpublished revision is enabled;
  - workflows decorator: for a singleton model it calls the inner use case directly, without `ActiveReviewGuard`.
- [ ] **Step 2: Run** each test file with `yarn test <path>`. Expected: FAIL.
- [ ] **Step 3: Implement** `IsNotSingletonModel` in the style of `admin/components/IsModelPublishable.tsx`, the `canDelete` singleton check, and the decorator early return.
- [ ] **Step 4: Run** each test file. Expected: PASS.
- [ ] **Step 5: Commit chain, then commit** `feat(app-headless-cms): singleton guards in the entry editor`.

### Task 10: Verification

- [ ] **Step 1:** Build each changed package, one call each: `yarn build -p <pkg> --safe-replace 2>&1 | tail -30` for `@webiny/api-headless-cms`, `@webiny/api-headless-cms-workflows`, `@webiny/app-headless-cms-common`, `@webiny/app-headless-cms`, `@webiny/app-record-locking`, `@webiny/app-headless-cms-workflows`. `packages/webiny` has no build script; check its re-exports with `yarn tsc -b packages/webiny/tsconfig.build.json 2>&1 | tail -20` (build mode, because the root `tsconfig.build.json:15` sets `composite`). Expected: no errors.
- [ ] **Step 2:** Grep for leftovers: `grep -rn "GetSingletonEntryUseCase\|SingleEntryPresenter\|UNPUBLISHABLE_MODEL_TAG" packages/*/src packages/*/__tests__` (expected: no hits), and check that the literal `"$publishing:false"` no longer appears in `useIsModelPublishable.ts`, `SaveContentButton.tsx`, `CreateNewRevisionButton.tsx`, `isBindableModel.ts` or `toContentTypes.ts`. Model definitions in other packages (languages, webhooks, tenant-manager, background-tasks) keep their tags.
- [ ] **Step 3:** Draft the breaking-change lines for the PR description from the spec's "Breaking changes (release notes)" section, plus: `GetSingletonEntryUseCase` removed from the public exports (use `GetLatestSingletonEntryUseCase` / `GetPublishedSingletonEntryUseCase`); `UpdateSingletonEntryUseCase.execute` takes `revision`. Note in the PR description that the user docs (`docs.webiny.com`: singleton publishing, "publish right after adding the tag") are a follow-up after merge.
- [ ] **Step 4: Commit chain, then commit** any fixes: `chore: singleton publishing phase 1 cleanup`.
