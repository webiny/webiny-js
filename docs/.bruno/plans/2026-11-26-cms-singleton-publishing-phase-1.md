# CMS Singleton Publishing (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Singleton CMS models tagged `$publishing:true` get publish, unpublish and revisions; every singleton is edited in the regular entry editor without the list.

**Architecture:** Thin singleton use cases resolve the singleton `entryId`, run the singleton checks, and delegate to the generic entry use cases. The singular GraphQL SDL is split into shared types, read/preview `get<S>` and a manage block whose signatures match the regular manage SDL, so the admin editor gateways work unchanged. The admin gets a `SingletonEditorView` built from the regular editor body.

**Tech Stack:** TypeScript, `@webiny/di` features/abstractions, `@webiny/feature/api` `Result`, GraphQL SDL strings, React + MobX presenters, Vitest.

**Spec:** `docs/.bruno/specs/2026-11-26-cms-singleton-publishing-design.md` (read it first; this plan does not repeat its rules).

## Global Constraints

- Phase 1 only. Phase 2 (scheduling) is out of scope; do not hide the scheduler UI.
- No storage key changes. DDB/DDB-ES key formats are frozen.
- One abstraction, implementation or feature per file. No `Impl`/`Implementation` suffix on exported names or file names.
- No inline object types; extract named interfaces.
- No helper functions or private methods that wrap use case calls; inject the use case and handle `Result` inline.
- Exact error messages (from the spec):
  - `"Model does not support publishing."`
  - `"Model does not support revisions."`
  - `"A revision id is required."`
  - `"Singleton entry cannot be deleted."`
  - `"The first revision of a singleton entry cannot be deleted."`
  - `"The published revision cannot be deleted. Unpublish it first."`
- Tag values: `"$publishing:true"`, `"$publishing:false"`.
- Tests are run by file path, one test command at a time. `api-headless-cms` tests run on every storage: `yarn test <path>`, `yarn test:os <path>`, `WEBINY_STORAGE=sql yarn test <path>`, `WEBINY_STORAGE=pg,sql yarn test <path>`.
- Commits: Conventional Commits. Before each commit run the repo pre-commit chain from `CLAUDE.md` (`yarn format:fix`, `yarn lint:fix`, `yarn adio`, `node scripts/generateTsConfigsInPackages.js`).

## Review Focus

- An admin URL whose `?id=` is a revision of another entry: the editor shows the `EntryNotFoundError` message, not a blank form. Test in Task 7.
- An untagged singleton whose `#0001` is still locked from an earlier tagged period: Save in the admin works and no publish actions show. Test in Task 7.
- A tagged singleton whose `#0001` is published: deleting `#0001` fails with the first-revision message, not the published one. Test in Task 4.
- `getSettingsRevisions` called with a revision id (what the admin sends): returns the list. Test in Task 4.
- A singleton model with no fields: no API, and the admin shows "This model has no fields." without a request. Tests in Tasks 4 and 7.

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
- Modify: `packages/api-headless-cms-workflows/src/utils/isBindableModel.ts:4`
- Test: `packages/api-headless-cms/__tests__/domain/singletonModel.test.ts`

**Interfaces:**
- Produces:
  - `CMS_MODEL_PUBLISHING_ENABLED_TAG = "$publishing:true"`, `CMS_MODEL_PUBLISHING_DISABLED_TAG = "$publishing:false"` in `constants.ts`
  - `isSingletonModel(model: Pick<CmsModel, "tags">): boolean`
  - `isPublishingEnabled(model: Pick<CmsModel, "tags">): boolean`
  - `createSingletonEntryId(model: Pick<CmsModel, "modelId">): string` (returns `createCacheKey(model.modelId)`, the value `GetSingletonEntryUseCase.ts:35` computes today)
  - all three exported from `@webiny/api-headless-cms/exports/api/cms/model.js`

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
- [ ] **Step 3: Implement the three helpers and constants.** Move `isSingletonModel` out of `entryOwnerAccess.ts` (import it there). Replace the private copy in `ListCmsEntryWorkflowModelsUseCase.ts:26` with the export. Replace the `"$publishing:false"` literal in `isBindableModel.ts:4` with `CMS_MODEL_PUBLISHING_DISABLED_TAG`; its logic stays.
- [ ] **Step 4: Run** the test file (all four storage commands are not needed for a pure unit test; `yarn test` is enough). Expected: PASS.
- [ ] **Step 5: Commit** `feat(api-headless-cms): add singleton and publishing model helpers`.

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

- [ ] **Step 1: Write the failing tests.** Use `useSingletonCategoryHandler` (Task 4 rewrites its queries; here use only its `getContext()`): invoke any query once, then resolve the generic use cases from `manager.getContext().container`. Seed entries with `CreateEntryUseCase` / `CreateEntryRevisionFromUseCase` resolved the same way. Tests:
  - `PublishEntryUseCase` on an untagged singleton revision fails with `"Model does not support publishing."`.
  - `DeleteEntryRevisionUseCase` on a tagged singleton: `#0001` fails with the first-revision message; the published `#0002` fails with the published message; an unpublished `#0003` succeeds.
  - `DeleteEntryRevisionUseCase` on an untagged singleton `#0002` fails with `"Model does not support publishing."`.
  - `DeleteEntryUseCase` on a singleton fails with `"Singleton entry cannot be deleted."`.
  - `UpdateEntryUseCase` on an untagged singleton whose `#0001` is locked succeeds; on a tagged singleton it fails with `EntryLockedError`.
  - A user with own-entries permission publishes a tagged singleton revision created by another identity (use the handler's `identity`/`permissions` params).
- [ ] **Step 2: Run** `yarn test packages/api-headless-cms/__tests__/contentAPI/singletonGenericGuards.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement the guards** with `EntryValidationError(message)` and the owner-check exemption (`isSingletonModel(model)` skips only the entry-level `canAccessEntry({ model, entry, ... })` call; model-level checks stay). Delete checks run `#0001` before published.
- [ ] **Step 4: Run** the test file with all four storage commands. Expected: PASS on each.
- [ ] **Step 5: Commit** `feat(api-headless-cms): guard generic entry use cases for singleton models`.

### Task 3: Singleton use cases

**Files:**
- Create one folder per use case under `packages/api-headless-cms/src/features/contentEntry/`, each with `abstractions.ts`, `<Name>UseCase.ts`, `feature.ts`, `index.ts` (follow `GetSingletonEntry/`):
  `GetLatestSingletonEntry`, `GetPublishedSingletonEntry`, `GetSingletonEntryRevision`, `ListSingletonEntryRevisions`, `UpdateSingletonEntryRevisionDescription`, `CreateSingletonEntryRevisionFrom`, `PublishSingletonEntry`, `UnpublishSingletonEntry`, `DeleteSingletonEntryRevision`
- Modify: `features/contentEntry/UpdateSingletonEntry/*` (takes `revision`)
- Create: `features/contentEntry/shared/SingletonRevisionCheck.ts` (an injectable service, not a wrapper of use cases: pure checks returning `Result<string, Error>` with the parsed entry id)
- Delete: `features/contentEntry/GetSingletonEntry/`
- Modify: `features/contentEntry/ContentEntriesFeature.ts:27-28,55,76` (register new features)
- Test: `packages/api-headless-cms/__tests__/contentEntry/singletonUseCases.test.ts`

**Interfaces:**
- Consumes: Task 1 helpers; Task 2 guards; generic use cases `GetLatestRevisionByEntryId.execute(model, { id })`, `GetPublishedRevisionByEntryId.execute(model, entryId)`, `GetRevisionById`, `GetRevisionsByEntryId`, `CreateEntry`, `UpdateEntry`, `UpdateRevisionDescription`, `CreateEntryRevisionFrom`, `PublishEntry`, `UnpublishEntry`, `DeleteEntryRevision`.
- Produces (each `execute` returns `Promise<Result<…, UseCase.Error>>`):
  - `GetLatestSingletonEntryUseCase.execute(model)` → `CmsEntry`
  - `GetPublishedSingletonEntryUseCase.execute(model)` → `CmsEntry` (empty-values entry when tagged and nothing published)
  - `GetSingletonEntryRevisionUseCase.execute(model, revision)` → `CmsEntry`
  - `ListSingletonEntryRevisionsUseCase.execute(model, id)` → `CmsEntry[]`
  - `UpdateSingletonEntryUseCase.execute(model, revision, data, options?)` → `CmsEntry`
  - `UpdateSingletonEntryRevisionDescriptionUseCase.execute(model, revision, revisionDescription)` → `CmsEntry`
  - `CreateSingletonEntryRevisionFromUseCase.execute(model, revision, data?, options?)` → `CmsEntry`
  - `PublishSingletonEntryUseCase.execute(model, revision)` / `UnpublishSingletonEntryUseCase.execute(model, revision)` → `CmsEntry`
  - `DeleteSingletonEntryRevisionUseCase.execute(model, revision, options?)` → `boolean`
  - `SingletonRevisionCheck.check(model, value, operation): Result<string, EntryNotFoundError | EntryValidationError>` implementing steps 1-4 of the spec's "Order of checks"; `operation` is a string union of the manage operation names.

- [ ] **Step 1: Write the failing tests**, one `describe` per use case, resolving each from the container. Assertions from the spec, including: untagged `GetLatest` with a leftover `#0002` returns `#0001`; tagged `GetPublished` with nothing published returns `values` equal to the empty values and `id === "<entryId>#0001"`; `ListSingletonEntryRevisions` accepts `entryId` and `"<entryId>#0002"`, and returns only `#0001` for an untagged model with a leftover `#0002`; foreign revision → `EntryNotFoundError`; untagged `update(#0002)` → `"Model does not support revisions."`; untagged `publish(#0002)` → `"Model does not support publishing."`; `delete(entryId)` → `"Singleton entry cannot be deleted."`; `update(entryId)` → `"A revision id is required."`.
- [ ] **Step 2: Run** `yarn test packages/api-headless-cms/__tests__/contentEntry/singletonUseCases.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the use cases and `SingletonRevisionCheck`. Find-or-create in the two get use cases uses `CreateEntry` with `{ skipValidation: true }`, as `GetSingletonEntryUseCase.ts:45-54` does today.
- [ ] **Step 4: Run** the test file with all four storage commands. Expected: PASS on each.
- [ ] **Step 5: Commit** `feat(api-headless-cms): add singleton entry use cases`.

### Task 4: Singular GraphQL SDL and resolvers

**Files:**
- Modify: `packages/api-headless-cms/src/graphql/schema/createSingularSDL.ts`
- Modify: `packages/api-headless-cms/src/graphql/schema/createSingularResolvers.ts`
- Modify: `packages/api-headless-cms/src/graphql/schema/schemaPlugins.ts:52`
- Create: one resolver file per manage field under `graphql/schema/resolvers/singular/` (follow `resolveGet.ts`); replace `resolveGet.ts`/`resolveUpdate.ts`
- Modify: `packages/api-headless-cms/__tests__/testHelpers/useSingletonCategoryHandler.ts` (new operations; preview path)
- Modify: `packages/api-headless-cms/__tests__/contentAPI/singletonContentEntry.test.ts`
- Create: `packages/api-headless-cms/__tests__/contentAPI/singletonPublishing.test.ts`

**Interfaces:**
- Consumes: Task 3 use cases (see the spec's resolver table).
- Produces: GraphQL operations exactly as the spec's Manage API block, read/preview `get<S>`; handler helpers `getCategory()`, `getCategoryLatest()`, `getCategoryRevision(revision)`, `getCategoryRevisions(id)`, `updateCategory(revision, data)`, `createCategoryFrom(revision)`, `publishCategory(revision)`, `unpublishCategory(revision)`, `deleteCategory(revision)`, `updateCategoryRevisionDescription(revision, text)`.

- [ ] **Step 1: Write the failing tests.**
  - `singletonContentEntry.test.ts` (untagged): `getCategoryLatest` creates and returns `#0001`; `updateCategory(#0001)` updates; read and preview `getCategory` return the updated `#0001`; manage `getCategory` without arguments is a GraphQL validation error (`Cannot query field "getCategory"` on `Query`).
  - `singletonPublishing.test.ts` (tagged `["singleEntry", "$publishing:true"]`): read returns empty values before publish; after `publishCategory(#0001)` read returns the published values; after `createCategoryFrom(#0001)` + `updateCategory(#0002)`, preview returns `#0002` values and read still returns `#0001` values; `updateCategory(#0001)` while published fails with `EntryLockedError`'s code; `getCategoryRevisions` with `"<entryId>#0002"` returns two revisions; deleting published `#0001` fails with the first-revision message.
  - Read and preview introspection: the `<S>` type has no `meta`; `Mutation` has no singleton fields.
  - A singleton model with no fields produces no `get<S>` on any endpoint.
- [ ] **Step 2: Run** both test files with `yarn test`. Expected: FAIL.
- [ ] **Step 3: Implement** the SDL split and resolvers per the spec's "Schema generation" section. `schemaPlugins.ts:52` passes `type` (`read` or `preview`) through for use-case choice; field resolvers keep `endpointType: "read"` for preview.
- [ ] **Step 4: Run** both test files with all four storage commands. Expected: PASS on each.
- [ ] **Step 5: Commit** `feat(api-headless-cms): singleton publishing GraphQL operations`.

### Task 5: Admin publishing helpers

**Files:**
- Modify: `packages/app-headless-cms-common/src/constants.ts` (add both tag constants)
- Create: `packages/app-headless-cms-common/src/isPublishingEnabled.ts` (export from the package index)
- Modify: `packages/app-headless-cms/src/admin/hooks/useIsModelPublishable.ts:7`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/actions/SaveContentButton.tsx:24`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/actions/CreateNewRevisionButton.tsx:28`
- Test: `packages/app-headless-cms-common/src/isPublishingEnabled.test.ts`

**Interfaces:**
- Produces: `isPublishingEnabled(model: Pick<CmsModel, "tags">): boolean` in `@webiny/app-headless-cms-common`, same rule as Task 1.

- [ ] **Step 1: Write the failing test** with the same four assertions as Task 1.
- [ ] **Step 2: Run** `yarn test packages/app-headless-cms-common/src/isPublishingEnabled.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** and switch the three call sites to `isPublishingEnabled(model)`.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit** `feat(app-headless-cms): share the publishing-enabled rule`.

### Task 6: Admin singleton editor gateways

**Files:**
- Create: `packages/app-headless-cms/src/features/contentEntry/singletonEditor/` with, per operation, `abstractions.ts`, gateway, use case and `feature.ts`:
  - `GetLatestSingletonEntryGateway` / `GetLatestSingletonEntryUseCase` → `get<S>Latest`
  - `GetSingletonEntryRevisionGateway` → `get<S>Revision(revision)`, registered as the `GetEntryGateway` implementation for singleton models
- Delete: `packages/app-headless-cms/src/features/contentEntry/singletonEntry/`
- Test: `packages/app-headless-cms/src/features/contentEntry/singletonEditor/singletonEditorGateways.test.ts`

**Interfaces:**
- Consumes: Task 4 operations.
- Produces: `GetLatestSingletonEntryUseCase.execute(model): Promise<Result<CmsContentEntry, CmsEntryError>>`; a `GetEntryGateway` implementation with the same interface as `features/contentEntry/getEntry/abstractions.ts:29`.

- [ ] **Step 1: Write the failing tests** with a mocked GraphQL client (follow `entryValueGateways.test.ts`): the latest gateway sends `get<S>Latest` with no variables; the revision gateway sends `get<S>Revision` with `{ revision }`; both map `error` to a failed `Result`.
- [ ] **Step 2: Run** the test file with `yarn test`. Expected: FAIL.
- [ ] **Step 3: Implement**, and wire the singleton `GetEntryGateway` through DI so the editor resolves it when the model is a singleton.
- [ ] **Step 4: Run** the test. Expected: PASS.
- [ ] **Step 5: Commit** `feat(app-headless-cms): singleton editor gateways`.

### Task 7: SingletonEditorView and guards

**Files:**
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/ContentEntryFormView.tsx` (extract the editor body)
- Create: `packages/app-headless-cms/src/presentation/contentEntries/views/ContentEntryEditorBody.tsx` (props: `entryId: string | null`, `modelName: string`, `onBack?: () => void`)
- Create: `packages/app-headless-cms/src/presentation/contentEntries/views/SingletonEditorView.tsx`
- Create: `packages/app-headless-cms/src/admin/components/IsNotSingletonModel.tsx`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/ModelLoader.tsx:23`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/RevisionListItem.tsx:256`
- Modify: `packages/app-headless-cms/src/ContentEntriesModule.tsx:183` (wrap `DeleteEntryMenuItem`)
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/views/ContentEntriesView.tsx:9,45`
- Delete: `SingleEntryView.tsx`, `SingleEntryLayout.tsx`, `SingleEntryFormContent.tsx` (if only used there), `presentation/contentEntries/singleEntry/`
- Delete: `packages/app-record-locking/src/presentation/entryLocking/SingleEntryPresenterDecorator.ts`, `SingleEntryContentDecorator.tsx`; update `feature.ts:13` and any `SingleEntryContentDecorator` registration
- Modify: `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.ts` (early return when `!isReviewableModel(model)`)
- Test: `packages/app-headless-cms/src/presentation/contentEntries/views/SingletonEditorView.test.tsx`
- Test: `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.test.ts` (extend)

**Interfaces:**
- Consumes: Task 5 `isPublishingEnabled`, Task 6 gateways/use case, Task 1 rules via the API.
- Produces: `SingletonEditorView({ model }: SingletonEditorViewProps)`; `IsNotSingletonModel({ children })`.

- [ ] **Step 1: Write the failing tests** (`SingletonEditorView.test.tsx`, React Testing Library with mocked use cases):
  - without `?id=`, loads via `GetLatestSingletonEntryUseCase` and replaces the route with the returned revision id;
  - with `?id=<foreign revision>`, shows the `EntryNotFoundError` message;
  - untagged model: Save button shows, publish actions and "New revision" do not; Save on a locked `#0001` calls update (no locked-state block in the UI);
  - tagged model: publish actions show; the delete-entry menu item does not; delete on `#0001` and on the published revision is disabled in the revisions list;
  - no back button, no list, no "New entry";
  - a model with no fields shows "This model has no fields." and calls no use case.
  - Workflows decorator test: for a singleton model the decorator calls the inner use case directly, without `ActiveReviewGuard`.
- [ ] **Step 2: Run** each test file with `yarn test <path>`. Expected: FAIL.
- [ ] **Step 3: Implement.** `ContentEntryFormView` becomes the list adapter around `ContentEntryEditorBody`, reading `entryId`, folder id and model name from the list presenter as today. `SingletonEditorView` provides `ModelProvider` and `ContentEntryEditorWithConfig` like `ListView.tsx:26-28`. `ModelLoader` renders it for every singleton.
- [ ] **Step 4: Run** each test file. Expected: PASS. Then run `yarn test packages/app-headless-cms/src/presentation/contentEntries` once to catch broken imports from the deleted files.
- [ ] **Step 5: Commit** `feat(app-headless-cms): edit singletons in the regular entry editor`.

### Task 8: Verification

- [ ] **Step 1:** `yarn build -p @webiny/api-headless-cms -p @webiny/app-headless-cms -p @webiny/app-headless-cms-common -p @webiny/app-record-locking -p @webiny/api-headless-cms-workflows -p @webiny/app-headless-cms-workflows 2>&1 | tail -30`. Expected: no errors.
- [ ] **Step 2:** Run the pre-commit chain from `CLAUDE.md`. Expected: all steps pass; rerun from the top after any fix.
- [ ] **Step 3:** Grep for leftovers: `grep -rn "GetSingletonEntryUseCase\|SingleEntryPresenter\|\"\\$publishing:false\"" packages/*/src`. Expected: no hits outside the constants files.
- [ ] **Step 4: Commit** any fixes: `chore: singleton publishing phase 1 cleanup`.
