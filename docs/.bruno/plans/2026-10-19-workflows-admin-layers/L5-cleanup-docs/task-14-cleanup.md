### Task 14: Delete the bundles, their fakes and the review bridges

R358 (cleanup), R342 (scope), R344 (the multi-registration exception: an app's implementation keeps its app name), R347 (`CmsReviewFeature` / `WbReviewFeature` register the app gateway under the shared token), R354 (feature shapes), R355 (every bundle test is ported before the bundle goes), R356 (the bridges this task removes), R362 (a per-app feature test asserts only its own registration), R364 (`WorkflowEditorServicesFeature` resolves `{ toasts }`); Q75; Review Focus 8, 9 and 10; `ai-context/code-style/no-backwards-compat.md` (delete old code outright, no shims or aliases). After Task 13 the old multi-method bundles have no consumer left: the settings and config bundles are delegating bridges nobody injects (Tasks 2 and 4 migrated their presenters), the review bundle and its per-app subclasses are registered but resolved only by their own tests, and the per-app review gateway tokens exist only because the old bundles depend on them and the bridge subclasses `CmsReviewAppGateway` / `WbReviewAppGateway` extend their classes. This task deletes all of it and folds each app back to one review gateway class bound to `ReviewAppGateway`.

- **Deleted** (`[AW]` = `packages/app-workflows/src`, `[CMS]` = `packages/app-headless-cms-workflows/src`, `[WB]` = `packages/app-website-builder-workflows/src`):
  - Settings bridge: `[AW]/settings/useCases/{abstractions.ts, IWorkflowSettingsUseCases.ts, WorkflowSettingsUseCases.ts}` and `[AW]/settings/testing/fakeWorkflowSettingsUseCases.ts` (`createFakeSettingsUseCases`).
  - Config bridge: `[AW]/editor/useCases/{abstractions.ts, IWorkflowConfigUseCases.ts, WorkflowConfigUseCases.ts}` and `[AW]/editor/testing/fakeWorkflowConfigUseCases.ts` (`createFakeConfigUseCases`).
  - Review bundle: `[AW]/review/useCases/{IReviewUseCases.ts, IReviewReadUseCases.ts, IReviewActionUseCases.ts, IReviewListUseCases.ts, IReviewCancelForDeleteUseCases.ts, ReviewUseCases.ts, ReviewUseCases.test.ts}` and `[AW]/review/testing/fakeReviewUseCases.ts` (`createFakeUseCases`). The per-operation folders beside them (`[AW]/review/useCases/<operation>/`, Tasks 7-9) stay.
  - CMS: `[CMS]/features/gateway/CmsReviewUseCases/` (whole folder), `[CMS]/features/gateway/CmsReviewAppGateway/` (whole folder, Task 7's bridge), `[CMS]/features/gateway/CmsReviewGateway/abstractions.ts` (the per-app token `Cms/Workflows/ReviewGateway`).
  - WB: `[WB]/features/gateway/WbReviewUseCases/`, `[WB]/features/gateway/WbReviewAppGateway/`, `[WB]/features/gateway/WbReviewGateway/abstractions.ts` (`WebsiteBuilder/Workflows/ReviewGateway`).
- **Rebound:** `CmsReviewGateway.ts` and `WbReviewGateway.ts` implement `ReviewAppGateway` (`import { ReviewAppGateway as GatewayAbstraction } from "@webiny/app-workflows/review/appGateway/abstractions.js"`, R344); the export keeps the app name. `CmsReviewFeature` / `WbReviewFeature` register that class once, singleton, beside the content adapter, the row provider and the two websocket handlers, and resolve `{ contentAdapter, rowProvider }`.
- **Services features:** `WorkflowSettingsServicesFeature` registers the settings repository feature and the two settings use-case features only (no bridge, no `resolve`, R354). `WorkflowEditorServicesFeature` registers the editor repository feature, the six editor use-case features and `WorkflowEditorToasts`, and resolves `{ toasts }` (R364).
- **Tests:** `CmsReviewGateway.test.ts` and `WbReviewGateway.test.ts` resolve the gateway through `ReviewAppGateway`; the per-app `features/gateway/feature.test.ts` are rewritten without the bundle's singleton, error and cache cases (ported to `ReviewGateway.test.ts` and `ReviewRepository.test.ts` by Tasks 7 and 8) and assert the app class itself under the shared token; `[CMS]/index.test.tsx` and `[WB]/index.test.tsx` assert the app gateway under `ReviewAppGateway` instead of the bundle (the `ReviewGateway` half of Review Focus 10 is already pinned there by Tasks 6-8 and stays); `[AWS]/feature.test.ts` and `[AWE]/feature.test.ts` are rewritten without the bridges; `[AW]/app.test.tsx` loses its bridge assertions; `[AW]/app.cleanup.test.tsx` gains the deleted paths, kept paths for the new layers and a scan of every `app-workflows` source file for the removed names.
- **No behaviour change** (R342): no GraphQL document, variable or envelope handling changes; the app gateways' method bodies are untouched.

**Files:**
- Delete: `packages/app-workflows/src/settings/useCases/abstractions.ts`
- Delete: `packages/app-workflows/src/settings/useCases/IWorkflowSettingsUseCases.ts`
- Delete: `packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCases.ts`
- Delete: `packages/app-workflows/src/settings/testing/fakeWorkflowSettingsUseCases.ts`
- Delete: `packages/app-workflows/src/editor/useCases/abstractions.ts`
- Delete: `packages/app-workflows/src/editor/useCases/IWorkflowConfigUseCases.ts`
- Delete: `packages/app-workflows/src/editor/useCases/WorkflowConfigUseCases.ts`
- Delete: `packages/app-workflows/src/editor/testing/fakeWorkflowConfigUseCases.ts`
- Delete: `packages/app-workflows/src/review/useCases/IReviewUseCases.ts`
- Delete: `packages/app-workflows/src/review/useCases/IReviewReadUseCases.ts`
- Delete: `packages/app-workflows/src/review/useCases/IReviewActionUseCases.ts`
- Delete: `packages/app-workflows/src/review/useCases/IReviewListUseCases.ts`
- Delete: `packages/app-workflows/src/review/useCases/IReviewCancelForDeleteUseCases.ts`
- Delete: `packages/app-workflows/src/review/useCases/ReviewUseCases.ts`
- Delete: `packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts`
- Delete: `packages/app-workflows/src/review/testing/fakeReviewUseCases.ts`
- Delete: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewUseCases/` (`abstractions.ts`, `CmsReviewUseCases.ts`)
- Delete: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewAppGateway/` (every file in it)
- Delete: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/abstractions.ts`
- Delete: `packages/app-website-builder-workflows/src/features/gateway/WbReviewUseCases/` (`abstractions.ts`, `WbReviewUseCases.ts`)
- Delete: `packages/app-website-builder-workflows/src/features/gateway/WbReviewAppGateway/` (every file in it)
- Delete: `packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/abstractions.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.test.ts`
- Modify (whole file): `packages/app-headless-cms-workflows/src/features/gateway/feature.ts`
- Modify (whole file): `packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/index.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.ts`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.test.ts`
- Modify (whole file): `packages/app-website-builder-workflows/src/features/gateway/feature.ts`
- Modify (whole file): `packages/app-website-builder-workflows/src/features/gateway/feature.test.ts`
- Modify: `packages/app-website-builder-workflows/src/index.test.tsx`
- Modify (whole file): `packages/app-workflows/src/settings/feature.ts`
- Modify: `packages/app-workflows/src/settings/feature.test.ts`
- Modify (whole file): `packages/app-workflows/src/editor/feature.ts`
- Modify (whole file): `packages/app-workflows/src/editor/feature.test.ts`
- Modify: `packages/app-workflows/src/app.test.tsx`
- Modify: `packages/app-workflows/src/app.cleanup.test.tsx`
- Modify: `packages/app-workflows/src/review/trash/ActiveReviewGuard/ActiveReviewGuard.test.ts` (Check 2: the local trash fakes are renamed `fakes`)

**Interfaces:**
- Consumes (contract names; every one is created by an earlier task of this plan, so Step 1 checks each exists before anything is written):
  - Task 1: `WorkflowSettingsRepository` (`[AW]/settings/repository/abstractions.ts`), `WorkflowSettingsRepositoryFeature` (`[AW]/settings/repository/feature.ts`), `WorkflowSettingsGateway` (`[AW]/settings/gateway/abstractions.ts`, token unchanged), `GetWorkflowSettingsUseCase` / `GetWorkflowSettingsFeature` (`[AW]/settings/useCases/getWorkflowSettings/{abstractions,feature}.ts`), `UpdateWorkflowSettingsUseCase` / `UpdateWorkflowSettingsFeature` (`[AW]/settings/useCases/updateWorkflowSettings/`).
  - Task 3: `WorkflowConfigGateway` (`[AW]/config/gateway/abstractions.ts`), `WorkflowConfigServicesFeature` (`[AW]/config/feature.ts`), `ListWorkflowUsersUseCase` and the six other config use cases (`[AW]/config/useCases/<operation>/`).
  - Task 5: `WorkflowEditorGateway` (`[AW]/editor/gateway/abstractions.ts`, the routing gateway), `WorkflowEditorRepository` / `WorkflowEditorRepositoryFeature` (`[AW]/editor/repository/`), the six editor use cases and their features (`ListWorkflowModelsUseCase` / `ListWorkflowModelsFeature`, `GetWorkflowUseCase` / `GetWorkflowFeature`, `StoreWorkflowUseCase` / `StoreWorkflowFeature`, `DeleteWorkflowUseCase` / `DeleteWorkflowFeature`, `InspectRoutingUseCase` / `InspectRoutingFeature`, `FolderExistsUseCase` / `FolderExistsFeature`, in `[AW]/editor/useCases/<operation>/`), `WorkflowEditorAppGateway` (`[AW]/editor/appGateway/abstractions.ts`).
  - Task 7: `ReviewAppGateway` (`[AW]/review/appGateway/abstractions.ts`; `ReviewAppGateway.Interface` has `readonly app: WorkflowAppKind` and `canHandle(namespace: string): boolean` beside the 17 envelope methods, `listWorkflows()` without arguments and `getTargetReview(target: ReviewTarget)` as today), `ReviewGateway` (`[AW]/review/gateway/abstractions.ts` and `ReviewGateway.ts`), CMS and WB gateway classes with `app` and `canHandle`, the bridges `CmsReviewAppGateway` / `WbReviewAppGateway` (removed here).
  - Task 8: `ReviewRepository` / `ReviewRepositoryFeature` (`[AW]/review/repository/`), `ReviewRepository.test.ts` (the R350 cache cases), the seven read use cases; Task 9: the ten write use cases; Task 10: `StoreWorkflowUseCase` / `DeleteWorkflowUseCase` depend on `[WorkflowEditorRepository, ReviewRepository]`; Task 12: `CmsReviewFeature` / `WbReviewFeature` resolve `{ contentAdapter, rowProvider }`; Task 11: `CmsReviewRowProvider` / `WbReviewRowProvider` depend only on their content adapter; Task 13: no trash file imports a bundle.
  - Existing at HEAD (verified with codegraph and grep): `CmsReviewGateway` (`[CMS]/features/gateway/CmsReviewGateway/CmsReviewGateway.ts`, deps `[MainGraphQLClient]`), `WbReviewGateway` (`[WB]/.../WbReviewGateway/WbReviewGateway.ts`), `CmsReviewContentAdapter` and `CmsReviewRowProvider` abstractions (`[CMS]/features/gateway/CmsReviewContentAdapter/abstractions.ts`, `CmsReviewRowProvider/abstractions.ts`) and their WB mirrors, `CmsReviewNotificationHandler`, `CmsReviewChangeMessageHandler` and the WB mirrors, `ListCache` (`@webiny/app-admin/features/listCache/index.js`), `ModelsCache` (`@webiny/app-headless-cms/features/model/abstractions.js`), `Container.resolveAll` (`@webiny/di` 2.0.0, returns every registration in order, `[]` for none; `node_modules/@webiny/di/dist/index.js:132`), `WorkflowEditorToasts` (`[AW]/editor/toasts/abstractions.ts`, `WorkflowEditorToasts.ts`).
- Produces: R358. Nothing for later code tasks; Task 15 documents the result.

**Test runner note:** admin packages, `yarn test <path>` only, one command at a time; `.tsx` tests import `React`. None of the three packages has a `__tests__/**/*.test.ts`, so the type check of their co-located tests is the package build (8a R243).

- [ ] **Step 1: Check the leftovers and the ports, then write the failing tests**

Run every command from the repository root. First prove the earlier tasks are in (the new layers exist):

```bash
ls -d packages/app-workflows/src/gateway packages/app-workflows/src/config/repository packages/app-workflows/src/settings/repository packages/app-workflows/src/editor/repository packages/app-workflows/src/editor/appGateway packages/app-workflows/src/review/appGateway packages/app-workflows/src/review/repository packages/app-workflows/src/review/gateway/ReviewGateway.ts
ls packages/app-workflows/src/settings/useCases/*/*UseCase.test.ts | wc -l
ls packages/app-workflows/src/config/useCases/*/*UseCase.test.ts | wc -l
ls packages/app-workflows/src/editor/useCases/*/*UseCase.test.ts | wc -l
ls packages/app-workflows/src/review/useCases/*/*UseCase.test.ts | wc -l
grep -rnE "export const (ReviewAppGateway|ReviewGateway|ReviewRepository|ReviewRepositoryFeature|WorkflowEditorAppGateway|WorkflowEditorGateway|WorkflowEditorRepository|WorkflowEditorRepositoryFeature|WorkflowSettingsRepository|WorkflowSettingsRepositoryFeature|WorkflowConfigServicesFeature|ListWorkflowModelsFeature|GetWorkflowFeature|StoreWorkflowFeature|DeleteWorkflowFeature|InspectRoutingFeature|FolderExistsFeature|GetWorkflowSettingsFeature|UpdateWorkflowSettingsFeature)\b" packages/app-workflows/src --include='*.ts' | grep -v "\.test\." | cut -c1-150
```

Expected: the eight paths; the counts `2`, `7`, `6` and `17`; at least one `export const` line for each of the 19 names of the last grep (the tokens in their `abstractions.ts`; `ReviewGateway`, `ReviewRepository`, `WorkflowEditorGateway`, `WorkflowEditorRepository` and `WorkflowSettingsRepository` a second time for their implementation file; the `*RepositoryFeature` names in `repository/feature.ts`; the use-case features in `useCases/<operation>/feature.ts`). A missing path, a lower count or a missing name means an earlier task is not done or used another name: stop and report (a name the executor of that task changed is used here under its as-built name, listed under "Contract notes" of the report).

Then the contract's two checks, before any edit (`--include` quoted so zsh does not expand it):

```bash
grep -rnE "IReviewUseCases|IReviewReadUseCases|IReviewActionUseCases|IReviewListUseCases|IReviewCancelForDeleteUseCases|\bReviewUseCases\b|CmsReviewUseCases|WbReviewUseCases|IWorkflowConfigUseCases|WorkflowConfigUseCases|IWorkflowSettingsUseCases|WorkflowSettingsUseCases|IWorkflowEditorUseCases|WorkflowEditorUseCases|CmsWorkflowEditorUseCases|WbWorkflowEditorUseCases|createFakeUseCases|createFakeEditorUseCases|createFakeConfigUseCases|createFakeSettingsUseCases|CmsReviewAppGateway|WbReviewAppGateway|WorkflowEditorAppKind|editor/useCases/toOperationError|review/gateway/IReviewGateway" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src --exclude-dir=dist --exclude-dir=node_modules | cut -d: -f1 | sort -u
grep -rnE "useCases[?]?:|\.useCases\b|useCases=\{|reviewUseCases" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src --exclude-dir=dist --exclude-dir=node_modules | cut -d: -f1 | sort -u
grep -rlE "CmsReviewUseCases|WbReviewUseCases|IReviewUseCases|app-workflows/review/useCases/ReviewUseCases|CmsReviewGateway/abstractions|WbReviewGateway/abstractions" packages --include='*.ts' --include='*.tsx' --exclude-dir=dist --exclude-dir=node_modules | grep -v "^packages/app-workflows/src/\|^packages/app-headless-cms-workflows/src/\|^packages/app-website-builder-workflows/src/"
```

Expected:

- **Check 1** prints only files this task deletes or modifies:
  - `[AW]`: `settings/useCases/abstractions.ts`, `settings/useCases/IWorkflowSettingsUseCases.ts`, `settings/useCases/WorkflowSettingsUseCases.ts`, `settings/testing/fakeWorkflowSettingsUseCases.ts`, `settings/feature.ts`, `settings/feature.test.ts` (Task 1 kept a bridge case there); `editor/useCases/abstractions.ts`, `editor/useCases/IWorkflowConfigUseCases.ts`, `editor/useCases/WorkflowConfigUseCases.ts`, `editor/testing/fakeWorkflowConfigUseCases.ts`, `editor/feature.ts`, `editor/feature.test.ts`; `review/useCases/I*UseCases.ts` (five), `review/useCases/ReviewUseCases.ts`, `review/useCases/ReviewUseCases.test.ts`, `review/testing/fakeReviewUseCases.ts`; `app.test.tsx`.
  - `[CMS]`: `features/gateway/CmsReviewUseCases/*`, `features/gateway/CmsReviewAppGateway/*`, `features/gateway/feature.ts`, `features/gateway/feature.test.ts`, `index.test.tsx`.
  - `[WB]`: the mirrors, and `features/gateway/feature.test.ts` (it imports the CMS bundle for the A83 case).
- **Check 2** prints `review/useCases/ReviewUseCases.test.ts` (its `run: (useCases: ReviewUseCases) => ...` and `let useCases: ReviewUseCases` lines), which this task deletes, and `review/trash/ActiveReviewGuard/ActiveReviewGuard.test.ts`: Task 13 kept its local trash fakes under the name `useCases` (`function setup(confirmation: Confirmation.Interface, useCases: TrashUseCaseFakes)` and the two `let useCases: TrashUseCaseFakes;`). They hold two fakes, not one use case, so rename the local in that file to `fakes` (it has no other `fakes` and no `useCases` object key): `perl -pi -e 's/\buseCases\b/fakes/g' packages/app-workflows/src/review/trash/ActiveReviewGuard/ActiveReviewGuard.test.ts`, list the file in the commit body under "Comments reworded", and run its test with the Step 4 commands. Nothing else.
- The third command (users outside the three packages) prints nothing.

If Check 1 prints another file, decide by what the hit is:

1. **A comment or a test title** in a kept file that names an old class (an executor wrote "the old `ReviewUseCases.getBoundWorkflow` semantics", for example): reword it in this task to name the new owner (`ReviewRepository.listWorkflows`, `GetBoundWorkflowUseCase`, ...), with no old name left, and list the file in the commit body under "Comments reworded".
2. **An import or a use** of a deleted module in a kept file: a consumer was not migrated by Tasks 1-13. Stop and report it (Review Focus 9); this task does not migrate consumers.

If Check 2 prints a file outside these two: a variable or type annotation named `useCases` in new code (`let useCases: ...`) is renamed in this task to the singular use case it holds (`let useCase: GetReviewUseCase.Interface`), listed under "Comments reworded"; a real `useCases` init field, prop, binding or session field is a missed migration: stop and report (Review Focus 8).

Check that every case of the test files this task deletes, or rewrites without some of their cases, was ported (R355). Print the titles and the evidence of the ports:

```bash
grep -nE "^\s*(it|it\.each)\(" packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts | cut -c1-140
grep -cE "^\s*(it|it\.each)\(" packages/app-workflows/src/review/repository/ReviewRepository.test.ts packages/app-workflows/src/review/gateway/ReviewGateway.test.ts
grep -nE "hasMoreItems: false|invalidateWorkflows|\"cms\"|\"wb\"" packages/app-workflows/src/review/repository/ReviewRepository.test.ts | head -20
grep -nE "The request failed\.|GraphQLOperationError|toBeNull|No workflows app" packages/app-workflows/src/review/gateway/ReviewGateway.test.ts | head -20
grep -lE "invalidateWorkflows" packages/app-workflows/src/editor/useCases/storeWorkflow/StoreWorkflowUseCase.test.ts packages/app-workflows/src/editor/useCases/deleteWorkflow/DeleteWorkflowUseCase.test.ts
grep -nE "^\s*(it|it\.each)\(" packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts packages/app-website-builder-workflows/src/features/gateway/feature.test.ts | cut -c1-160
```

Map every printed title of `ReviewUseCases.test.ts` (39 cases at plan time, the HEAD of d31d2bcd08) to its new home; the port is complete when each group has its evidence:

| Old group (`ReviewUseCases.test.ts`) | Ported to (task) | Evidence |
|---|---|---|
| `getBoundWorkflow`: mapped workflow, one load for several namespaces and calls, `null` cached, concurrent callers share one request, an envelope error or a transport failure is not cached | `ReviewRepository.test.ts` and `getBoundWorkflow/GetBoundWorkflowUseCase.test.ts` (Task 8) | the repository test has dedupe, failure-retry and per-app cases; the use-case test asserts the namespace filter and `null` |
| `does not share a cache between two instances`, `does not touch the cache of another instance (R237)`, `per-app subclasses (one container, two apps)` (two cases) | replaced by the per-app cache of R350 (Task 8: CMS and WB cached separately, invalidating one app keeps the other) | `"cms"` and `"wb"` cases in `ReviewRepository.test.ts`; the subclass-metadata case has no subject left (no shared class, D184) |
| `invalidateWorkflows (R277)`: drop, null after reload, cache again, nothing cached, in-flight drop, newer list kept when a dropped load fails | `ReviewRepository.test.ts` (Task 8) and the store and delete use-case tests (Task 10) | `invalidateWorkflows` in the repository test and in both editor use-case tests |
| `reads`, `listReviews`, `actions`, `cancelForDelete`, `getStepRun`, `listBlockingReviews`: parameters passed and mapping | the 17 review use-case tests (Tasks 8, 9) and `ReviewGateway.test.ts` (exact parameters, Task 7) | 17 `*UseCase.test.ts` files (count above) |
| `listReviews` meta default | `ReviewRepository.test.ts` (Task 8) | `hasMoreItems: false` |
| `error mapping (R204)` (three `it.each` plus the action case), `getReview` / `listBlockingReviews` "neither data nor error", `getStepRun` and `getTargetReview` null | `ReviewGateway.test.ts` (Task 7) | `GraphQLOperationError`, `The request failed.`, `toBeNull` |

The CMS and WB `features/gateway/feature.test.ts` cases this task drops are: "runs the shared use cases over the ... gateway" (kept in substance below as the envelope case), "turns an envelope error into a GraphQLOperationError in the shared use cases" (ported to `ReviewGateway.test.ts`), "caches the workflow list per instance", "invalidates the ... workflow cache" and WB's "keeps both apps' tokens in one container with separate instances and caches (A83)" (ported to `ReviewRepository.test.ts`; the coexistence half is kept below over the shared token), WB's "registers no CMS token" (replaced below by the shared-token cases), "registers every token as a singleton" (replaced by the singleton case below), Task 12's "resolves the content adapter and the row provider, and no use case (R349, R354)" (it resolves the per-app token; replaced by the R354 case below), Task 7's "registers only its own bridge under the shared ReviewAppGateway token, as a singleton (R356, R362)" (its `app`, `canHandle`, length-one and singleton assertions are in the "binds ... itself", "claims ..." and singleton cases below; the request it sends is pinned by the envelope case below and by `CmsReviewGateway.test.ts` / `WbReviewGateway.test.ts`), and any case that resolves `CmsReviewAppGateway`, `WbReviewAppGateway`, `CmsReviewUseCases`, `WbReviewUseCases` or a per-app gateway token. Any other case in those two files (one Task 7 or 12 added that does not touch a deleted name) is carried into the rewritten file below verbatim; list it in the commit body.

If a group has no evidence, stop and report it: the bundle test is not deleted before its behaviour is pinned elsewhere (R355).

Now write the tests.

**1a. `packages/app-workflows/src/app.cleanup.test.tsx`.**

Append to `DELETED_PATHS`, after its current last entry (at HEAD d31d2bcd08 that is `"domain/permissionsSchema.ts"`; Tasks 1-13 add no entry, R358 gives the list to this task), the R358 paths, then the paths Tasks 1, 3, 5, 6 and 7 deleted or moved away (Task 6's contract note leaves its four deleted paths to this task; the moved files keep their history at their new homes):

```ts
// before (the end of DELETED_PATHS at HEAD d31d2bcd08)
    "features/permissions",
    "domain/permissionsSchema.ts"
];
// after
    "features/permissions",
    "domain/permissionsSchema.ts",
    "settings/useCases/abstractions.ts",
    "settings/useCases/IWorkflowSettingsUseCases.ts",
    "settings/useCases/WorkflowSettingsUseCases.ts",
    "settings/testing/fakeWorkflowSettingsUseCases.ts",
    "editor/useCases/abstractions.ts",
    "editor/useCases/IWorkflowConfigUseCases.ts",
    "editor/useCases/WorkflowConfigUseCases.ts",
    "editor/testing/fakeWorkflowConfigUseCases.ts",
    "review/useCases/IReviewUseCases.ts",
    "review/useCases/IReviewReadUseCases.ts",
    "review/useCases/IReviewActionUseCases.ts",
    "review/useCases/IReviewListUseCases.ts",
    "review/useCases/IReviewCancelForDeleteUseCases.ts",
    "review/useCases/ReviewUseCases.ts",
    "review/useCases/ReviewUseCases.test.ts",
    "review/testing/fakeReviewUseCases.ts",
    "editor/useCases/IWorkflowEditorUseCases.ts",
    "editor/useCases/WorkflowEditorUseCases.ts",
    "editor/useCases/WorkflowEditorUseCases.test.ts",
    "editor/testing/fakeWorkflowEditorUseCases.ts",
    "settings/useCases/WorkflowSettingsUseCases.test.ts",
    "editor/useCases/WorkflowConfigUseCases.test.ts",
    "editor/useCases/toOperationError.ts",
    "editor/useCases/toOperationError.test.ts",
    "editor/gateway/IWorkflowConfigGateway.ts",
    "editor/gateway/WorkflowConfigGateway.ts",
    "editor/gateway/WorkflowConfigGateway.test.ts",
    "editor/gateway/IWorkflowEditorGateway.ts",
    "review/gateway/IReviewGateway.ts"
];
```

(`editor/gateway/abstractions.ts` is not listed: Task 3 moved the config token away and Task 5 created the routing gateway's token in that file.)

Append to `KEPT_PATHS`, after its current last entry (`"types.ts"`: Tasks 1, 3 and 5 inserted `"gateway"` before `"settings"`, `"config"` before `"editor"` and `"domain/WorkflowAppKind.ts"` after `"domain/permissions"`, so the end of the array is unchanged), the layers that replaced the bundles; skip any entry already listed:

```ts
// before (the end of KEPT_PATHS at HEAD d31d2bcd08)
    "review",
    "types.ts"
];
// after
    "review",
    "types.ts",
    "settings/repository",
    "config/repository",
    "editor/repository",
    "editor/appGateway",
    "review/appGateway",
    "review/repository",
    "review/gateway/ReviewGateway.ts"
];
```

Add the removed-name pattern and the file lister after `REMOVED_PERMISSION_API_PATTERN` (the constant Task 17 of 9c added; it is unchanged by this plan):

```ts
// before
const REMOVED_PERMISSION_API_PATTERN =
    /WorkflowsPermissionsFeature|HasWorkflowsEditorPermission|IHasWorkflowsSecurityPermissionProps|WORKFLOWS_PERMISSIONS_SCHEMA|permissionsSchema|features\/permissions/;
// after
const REMOVED_PERMISSION_API_PATTERN =
    /WorkflowsPermissionsFeature|HasWorkflowsEditorPermission|IHasWorkflowsSecurityPermissionProps|WORKFLOWS_PERMISSIONS_SCHEMA|permissionsSchema|features\/permissions/;

/*
 * The names the admin layers refactor removed (R358): the use-case bundles, their interfaces and
 * fakes, the per-app bundle tokens, the review bridges, the old app kind and the old file paths.
 * This file is the only one allowed to spell them.
 */
const REMOVED_BUNDLE_PATTERN =
    /IReviewUseCases|IReviewReadUseCases|IReviewActionUseCases|IReviewListUseCases|IReviewCancelForDeleteUseCases|\bReviewUseCases\b|CmsReviewUseCases|WbReviewUseCases|IWorkflowConfigUseCases|WorkflowConfigUseCases|IWorkflowSettingsUseCases|WorkflowSettingsUseCases|IWorkflowEditorUseCases|WorkflowEditorUseCases|CmsWorkflowEditorUseCases|WbWorkflowEditorUseCases|createFakeUseCases|createFakeEditorUseCases|createFakeConfigUseCases|createFakeSettingsUseCases|CmsReviewAppGateway|WbReviewAppGateway|WorkflowEditorAppKind|editor\/useCases\/toOperationError|review\/gateway\/IReviewGateway/;

const SOURCE_FILE_PATTERN = /\.tsx?$/;

const THIS_FILE = "app.cleanup.test.tsx";

// Every `.ts` and `.tsx` file under `src`, relative to it, except this test.
const listSourceFiles = (): string[] => {
    const entries = fs.readdirSync(srcDir, { recursive: true, encoding: "utf-8" });
    return entries.filter(entry => SOURCE_FILE_PATTERN.test(entry) && entry !== THIS_FILE);
};
```

Add the scan test after the `it.each(KEPT_PATHS)` case. At HEAD the kept-path case reads as below; if an earlier task changed its title, insert the new case after it all the same:

```ts
// before
    it.each(KEPT_PATHS)("%s is kept", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(true);
    });
// after
    it.each(KEPT_PATHS)("%s is kept", relativePath => {
        expect(fs.existsSync(path.join(srcDir, relativePath))).toBe(true);
    });

    it("no source file names a removed use-case bundle, fake or bridge (R358)", () => {
        const offenders = listSourceFiles().filter(relativePath => {
            const filePath = path.join(srcDir, relativePath);
            const source = fs.readFileSync(filePath, "utf-8");
            return REMOVED_BUNDLE_PATTERN.test(source);
        });

        expect(offenders).toEqual([]);
    });
```

`fs.readdirSync` with `recursive: true` and an `encoding` returns relative `string` paths (Node 20+, the repository runs Node 24, `.nvmrc`).

**1b. `packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts`** (whole file; it replaces the bundle cases, R362: only its own registration under the shared token):

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ModelsCache } from "@webiny/app-headless-cms/features/model/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ReviewAppGateway } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter/abstractions.js";
import { CmsReviewRowProvider } from "./CmsReviewRowProvider/abstractions.js";
import { CmsReviewGateway } from "./CmsReviewGateway/CmsReviewGateway.js";
import { CmsReviewFeature } from "./feature.js";

describe("CmsReviewFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        const modelsCache = new ListCache<CmsModel>("modelId");
        container.registerInstance(ModelsCache, modelsCache);
        CmsReviewFeature.register(container);
    });

    it("resolves the content adapter and the row provider and nothing else (R354)", () => {
        const resolved = CmsReviewFeature.resolve(container);
        const keys = Object.keys(resolved).sort();

        expect(keys).toEqual(["contentAdapter", "rowProvider"]);
        expect(resolved.contentAdapter).toBe(container.resolve(CmsReviewContentAdapter));
        expect(resolved.rowProvider).toBe(container.resolve(CmsReviewRowProvider));
    });

    it("binds CmsReviewGateway itself to the shared review app token, once (R347, R358)", () => {
        const gateways = container.resolveAll(ReviewAppGateway);

        expect(gateways).toHaveLength(1);
        expect(Object.getPrototypeOf(gateways[0])).toBe(CmsReviewGateway.prototype);
        expect(gateways[0].app).toBe("cms");
    });

    it("registers the gateway and the adapter as singletons", () => {
        const [firstGateway] = container.resolveAll(ReviewAppGateway);
        const [secondGateway] = container.resolveAll(ReviewAppGateway);
        const firstAdapter = container.resolve(CmsReviewContentAdapter);
        const secondAdapter = container.resolve(CmsReviewContentAdapter);

        expect(firstGateway).toBe(secondGateway);
        expect(firstAdapter).toBe(secondAdapter);
    });

    it("claims the CMS namespaces only", () => {
        const [gateway] = container.resolveAll(ReviewAppGateway);

        expect(gateway.canHandle("cms.article")).toBe(true);
        expect(gateway.canHandle("wb.page")).toBe(false);
    });

    it("sends the CMS document and resolves with the envelope (R204)", async () => {
        client.execute.mockResolvedValue({
            cms: { getCmsEntryTargetReview: { data: null, error: null } }
        });
        const [gateway] = container.resolveAll(ReviewAppGateway);

        const envelope = await gateway.getTargetReview({
            namespace: "cms.article",
            targetRevisionId: "entry-1#0001"
        });

        expect(envelope).toEqual({ data: null, error: null });
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({
            modelId: "article",
            revisionId: "entry-1#0001"
        });
    });
});
```

**1c. `packages/app-website-builder-workflows/src/features/gateway/feature.test.ts`** (whole file; the A83 coexistence case now registers both app classes under the shared token; the WB package depends on the CMS package, so it may import the CMS gateway class, R362):

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { ReviewAppGateway } from "@webiny/app-workflows/review/appGateway/abstractions.js";
import { CmsReviewGateway } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewGateway/CmsReviewGateway.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter/abstractions.js";
import { WbReviewRowProvider } from "./WbReviewRowProvider/abstractions.js";
import { WbReviewGateway } from "./WbReviewGateway/WbReviewGateway.js";
import { WbReviewFeature } from "./feature.js";

describe("WbReviewFeature", () => {
    const client = { execute: vi.fn() };
    let container: Container;

    beforeEach(() => {
        client.execute.mockReset();

        container = new Container();
        container.registerInstance(MainGraphQLClient, client);
        WbReviewFeature.register(container);
    });

    it("resolves the content adapter and the row provider and nothing else (R354)", () => {
        const resolved = WbReviewFeature.resolve(container);
        const keys = Object.keys(resolved).sort();

        expect(keys).toEqual(["contentAdapter", "rowProvider"]);
        expect(resolved.contentAdapter).toBe(container.resolve(WbReviewContentAdapter));
        expect(resolved.rowProvider).toBe(container.resolve(WbReviewRowProvider));
    });

    it("binds WbReviewGateway itself to the shared review app token, once (R347, R358)", () => {
        const gateways = container.resolveAll(ReviewAppGateway);

        expect(gateways).toHaveLength(1);
        expect(Object.getPrototypeOf(gateways[0])).toBe(WbReviewGateway.prototype);
        expect(gateways[0].app).toBe("wb");
    });

    it("registers the gateway and the adapter as singletons", () => {
        const [firstGateway] = container.resolveAll(ReviewAppGateway);
        const [secondGateway] = container.resolveAll(ReviewAppGateway);
        const firstAdapter = container.resolve(WbReviewContentAdapter);
        const secondAdapter = container.resolve(WbReviewContentAdapter);

        expect(firstGateway).toBe(secondGateway);
        expect(firstAdapter).toBe(secondAdapter);
    });

    it("claims the page namespace only", () => {
        const [gateway] = container.resolveAll(ReviewAppGateway);

        expect(gateway.canHandle("wb.page")).toBe(true);
        expect(gateway.canHandle("cms.article")).toBe(false);
    });

    it("keeps both apps' gateways under the shared token in one container (A83, A114)", () => {
        container.register(CmsReviewGateway).inSingletonScope();

        const gateways = container.resolveAll(ReviewAppGateway);
        const apps = gateways.map(gateway => gateway.app);

        expect(apps).toEqual(["wb", "cms"]);
        expect(gateways[0]).not.toBe(gateways[1]);
    });

    it("sends the WB document and resolves with the envelope (R204)", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: { getWebsiteBuilderPageTargetReview: { data: null, error: null } }
        });
        const [gateway] = container.resolveAll(ReviewAppGateway);

        const envelope = await gateway.getTargetReview({
            namespace: "wb.page",
            targetRevisionId: "page-1#0001"
        });

        expect(envelope).toEqual({ data: null, error: null });
        expect(client.execute).toHaveBeenCalledTimes(1);
        expect(client.execute.mock.calls[0][0].variables).toEqual({ revisionId: "page-1#0001" });
    });
});
```

**1d. The two app gateway tests** (R344: the abstraction alias stays `GatewayAbstraction`, so the file body is unchanged).

`packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.test.ts`:

```ts
// before
import { CmsReviewGateway as GatewayAbstraction } from "./abstractions.js";
// after
import { ReviewAppGateway as GatewayAbstraction } from "@webiny/app-workflows/review/appGateway/abstractions.js";
```

`packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.test.ts`:

```ts
// before
import { WbReviewGateway as GatewayAbstraction } from "./abstractions.js";
// after
import { ReviewAppGateway as GatewayAbstraction } from "@webiny/app-workflows/review/appGateway/abstractions.js";
```

Both tests register the class on a fresh container (`container.register(CmsReviewGateway)`) and `container.resolve(GatewayAbstraction)`; with one registration under the shared token, `resolve` returns it.

**1e. `packages/app-headless-cms-workflows/src/index.test.tsx`.**

Task 7 already imports `ReviewAppGateway` here and added the case "registers the CMS review app gateway under the shared token only with the flag on (R356)", which asserts the flag-on and flag-off registrations under the shared token. This task deletes the two bundle cases and the bundle import, and tightens Task 7's case to the app class itself (Review Focus 10's prototype check), so the file does not assert the same registration twice.

The bundle import (line 22 at HEAD d31d2bcd08):

```tsx
// before
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
// after
import { CmsReviewGateway } from "~/features/gateway/CmsReviewGateway/CmsReviewGateway.js";
```

Delete the two bundle cases (as at HEAD d31d2bcd08; no task of this plan changes them):

```tsx
// delete
    it("registers the CMS review feature with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const useCases = container.resolve(CmsReviewUseCases);

        expect(useCases).toBeDefined();
    });

    it("registers nothing with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const resolve = () => {
            return container.resolve(CmsReviewUseCases);
        };

        expect(resolve).toThrow("No registration found");
    });

```

Task 7's case (as Task 7 wrote it):

```tsx
// before
    it("registers the CMS review app gateway under the shared token only with the flag on (R356)", () => {
// after
    it("registers CmsReviewGateway itself under the shared token only with the flag on (R358)", () => {
```

```tsx
// before
        const registered = enabled.resolveAll(ReviewAppGateway);
        expect(registered.map(appGateway => appGateway.app)).toEqual(["cms"]);
        expect(disabled.resolveAll(ReviewAppGateway)).toEqual([]);
// after
        const registered = enabled.resolveAll(ReviewAppGateway);
        expect(registered.map(appGateway => appGateway.app)).toEqual(["cms"]);
        expect(Object.getPrototypeOf(registered[0])).toBe(CmsReviewGateway.prototype);
        expect(disabled.resolveAll(ReviewAppGateway)).toEqual([]);
```

**1f. `packages/app-website-builder-workflows/src/index.test.tsx`** (the mirror).

```tsx
// before
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases/abstractions.js";
// after
import { WbReviewGateway } from "~/features/gateway/WbReviewGateway/WbReviewGateway.js";
```

Delete the two bundle cases (as at HEAD d31d2bcd08):

```tsx
// delete
    it("registers the WB review feature with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(container.resolve(WbReviewUseCases)).toBeDefined();
    });

    it("registers nothing with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        expect(() => container.resolve(WbReviewUseCases)).toThrow("No registration found");
    });

```

Task 7's case:

```tsx
// before
    it("registers the WB review app gateway under the shared token only with the flag on (R356)", () => {
// after
    it("registers WbReviewGateway itself under the shared token only with the flag on (R358)", () => {
```

```tsx
// before
        const registered = enabled.resolveAll(ReviewAppGateway);
        expect(registered.map(appGateway => appGateway.app)).toEqual(["wb"]);
        expect(disabled.resolveAll(ReviewAppGateway)).toEqual([]);
// after
        const registered = enabled.resolveAll(ReviewAppGateway);
        expect(registered.map(appGateway => appGateway.app)).toEqual(["wb"]);
        expect(Object.getPrototypeOf(registered[0])).toBe(WbReviewGateway.prototype);
        expect(disabled.resolveAll(ReviewAppGateway)).toEqual([]);
```

The `ReviewGateway` half of "assert `ReviewAppGateway` and `ReviewGateway` instead of the bundles" is the Review Focus 10 routing tests Tasks 7 and 8 already put in both index files (resolve the routing gateway after the render, `cms.article` to CMS, `wb.page` to WB, and the three-root test in the WB file); confirm them with `grep -n "resolve(ReviewGatewayAbstraction)" packages/app-headless-cms-workflows/src/index.test.tsx packages/app-website-builder-workflows/src/index.test.tsx`, which must print at least one line for the CMS file and two for the WB file. They are not repeated here.

**1g. `packages/app-workflows/src/editor/feature.test.ts`** (whole file, R364). Before writing it, list the current file's `it` titles (`grep -n "it(" packages/app-workflows/src/editor/feature.test.ts`): every case that names neither `WorkflowConfigUseCases` nor `configUseCases` and is not covered by the four below is carried over verbatim (list it in the commit body).

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { WorkflowConfigGateway } from "~/config/gateway/abstractions.js";
import { ReviewRepositoryFeature } from "~/review/repository/feature.js";
import { WorkflowEditorServicesFeature } from "./feature.js";
import { WorkflowEditorGateway } from "./gateway/abstractions.js";
import { WorkflowEditorRepository } from "./repository/abstractions.js";
import { ListWorkflowModelsUseCase } from "./useCases/listWorkflowModels/abstractions.js";
import { GetWorkflowUseCase } from "./useCases/getWorkflow/abstractions.js";
import { StoreWorkflowUseCase } from "./useCases/storeWorkflow/abstractions.js";
import { DeleteWorkflowUseCase } from "./useCases/deleteWorkflow/abstractions.js";
import { InspectRoutingUseCase } from "./useCases/inspectRouting/abstractions.js";
import { FolderExistsUseCase } from "./useCases/folderExists/abstractions.js";
import { WorkflowEditorToasts } from "./toasts/abstractions.js";

const createContainer = (): Container => {
    const container = new Container();
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn(),
        getNotifications: vi.fn(),
        remove: vi.fn()
    });
    // The store and delete use cases clear the review workflow list (R350), so they need the review repository.
    ReviewRepositoryFeature.register(container);
    WorkflowEditorServicesFeature.register(container);
    return container;
};

describe("WorkflowEditorServicesFeature", () => {
    it("registers the routing gateway, the repository and the toasts as singletons", () => {
        const container = createContainer();

        expect(container.resolve(WorkflowEditorGateway)).toBe(
            container.resolve(WorkflowEditorGateway)
        );
        expect(container.resolve(WorkflowEditorRepository)).toBe(
            container.resolve(WorkflowEditorRepository)
        );
        expect(container.resolve(WorkflowEditorToasts)).toBe(
            container.resolve(WorkflowEditorToasts)
        );
    });

    it("registers the six editor use cases transient", () => {
        const container = createContainer();

        expect(container.resolve(ListWorkflowModelsUseCase)).not.toBe(
            container.resolve(ListWorkflowModelsUseCase)
        );
        expect(container.resolve(GetWorkflowUseCase)).not.toBe(
            container.resolve(GetWorkflowUseCase)
        );
        expect(container.resolve(StoreWorkflowUseCase)).not.toBe(
            container.resolve(StoreWorkflowUseCase)
        );
        expect(container.resolve(DeleteWorkflowUseCase)).not.toBe(
            container.resolve(DeleteWorkflowUseCase)
        );
        expect(container.resolve(InspectRoutingUseCase)).not.toBe(
            container.resolve(InspectRoutingUseCase)
        );
        expect(container.resolve(FolderExistsUseCase)).not.toBe(
            container.resolve(FolderExistsUseCase)
        );
    });

    it("resolves only the toasts (R364)", () => {
        const container = createContainer();

        const services = WorkflowEditorServicesFeature.resolve(container);
        const keys = Object.keys(services);

        expect(keys).toEqual(["toasts"]);
        expect(services.toasts).toBe(container.resolve(WorkflowEditorToasts));
    });

    it("registers no configuration service: those are WorkflowConfigServicesFeature's (D187)", () => {
        const container = createContainer();

        expect(() => container.resolve(WorkflowConfigGateway)).toThrow("No registration found");
    });
});
```

**1h. `packages/app-workflows/src/settings/feature.test.ts`** (as Task 1 rewrote it: its cases already assert the gateway and repository singletons, the transient use cases, the per-operation features and the `includeExpired` request; only the bridge goes).

```ts
// delete
import { WorkflowSettingsUseCases } from "./useCases/abstractions.js";
```

```ts
// delete
    it("keeps the settings use-case bridge as a singleton until the cleanup (R356)", () => {
        const container = createContainer();

        expect(container.resolve(WorkflowSettingsUseCases)).toBeDefined();
        expect(container.resolve(WorkflowSettingsUseCases)).toBe(
            container.resolve(WorkflowSettingsUseCases)
        );
    });

```

Then `grep -n "WorkflowSettingsUseCases" packages/app-workflows/src/settings/feature.test.ts` prints nothing.

**1i. `packages/app-workflows/src/app.test.tsx`** (the bridges' assertions go; the new tokens' assertions of Tasks 1, 3, 5, 8 and 9 stay).

Delete the two bridge imports (lines 25 and 27 at HEAD; Tasks 1 and 3 add their imports after them, so delete them wherever they are now):

```tsx
// delete
import { WorkflowConfigUseCases } from "~/editor/useCases/abstractions.js";
// delete
import { WorkflowSettingsUseCases } from "~/settings/useCases/abstractions.js";
```

In `describe("WorkflowsAdminApp workflow editor services", ...)` delete the three bridge statements (as at HEAD; no earlier task changes this block, and each case keeps its `WorkflowEditorToasts` assertion):

```tsx
// delete (first case)
        expect(container.resolve(WorkflowConfigUseCases)).toBeDefined();
// delete (second case)
        expect(container.resolve(WorkflowConfigUseCases)).toBe(
            container.resolve(WorkflowConfigUseCases)
        );
// delete (third case)
        expect(() => container.resolve(WorkflowConfigUseCases)).toThrow();
```

In `describe("WorkflowsAdminApp workflow settings services", ...)` (as Task 1 left it: the bridge case, its gateway and repository case, its transient use-case case and the flag-off case) delete the bridge case and the bridge line of the flag-off case; Task 1's other assertions stay:

```tsx
// delete
    it("registers the settings use cases as a singleton when advancedPublishingWorkflow is on", () => {
        const container = mount(true);

        const first = container.resolve(WorkflowSettingsUseCases);
        expect(first).toBeDefined();
        expect(first).toBe(container.resolve(WorkflowSettingsUseCases));
    });

```

```tsx
// before
        expect(() => container.resolve(WorkflowSettingsUseCases)).toThrow();
        expect(() => container.resolve(WorkflowSettingsGateway)).toThrow();
// after
        expect(() => container.resolve(WorkflowSettingsGateway)).toThrow();
```

Then `grep -n "WorkflowConfigUseCases\|WorkflowSettingsUseCases" packages/app-workflows/src/app.test.tsx` prints nothing.

- [ ] **Step 2: Run the tests and expect failure**

One command at a time:

```bash
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/feature.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/feature.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
```

Expected:

- `app.cleanup.test.tsx`: FAIL, exactly the 16 new R358 `... is deleted` cases (`expected true to be false`; the 13 paths of Tasks 1, 3, 5, 6 and 7 already pass) and `no source file names a removed use-case bundle, fake or bridge (R358)` (the offenders are the 16 files of the new `DELETED_PATHS` entries plus `editor/feature.ts` and `settings/feature.ts`, which still register the bridges; the two feature tests and `app.test.tsx` no longer name them after Step 1); every `is kept` case passes.
- `editor/feature.test.ts`: FAIL, `resolves only the toasts (R364)` (the feature still resolves `configUseCases`; resolving the bridge throws `No registration found` for a config use case, because this container registers no config feature); the other three pass.
- CMS `feature.test.ts`: FAIL, `binds CmsReviewGateway itself to the shared review app token, once` (the one registration is the bridge subclass, so the prototype differs); the others pass.
- `CmsReviewGateway.test.ts`: FAIL, every case, in `beforeEach` (`No registration found for Workflows/ReviewAppGateway`: the class is still bound to the per-app token).
- CMS `index.test.tsx`: FAIL, `registers CmsReviewGateway itself under the shared token only with the flag on (R358)` (the one registration is the bridge subclass, so the prototype differs); every other case passes.
- WB `feature.test.ts`: FAIL, `binds WbReviewGateway itself ...` and `keeps both apps' gateways under the shared token ...` (`["wb"]`: the CMS class is still bound to its per-app token); the others pass.
- `WbReviewGateway.test.ts`: FAIL, every case, as the CMS one.
- WB `index.test.tsx`: FAIL, `registers WbReviewGateway itself under the shared token only with the flag on (R358)` only, as the CMS one.
- `settings/feature.test.ts` and `app.test.tsx`: PASS (they only lost bridge assertions; the bridges are still registered and not asserted).

A different failure set means the tree is not what Step 1 showed: stop and report.

- [ ] **Step 3: Delete the bundles and rebind the app gateways**

**3a. Delete** (from the repository root; `git rm -r` removes the folders with every file in them):

```bash
git rm -q packages/app-workflows/src/settings/useCases/abstractions.ts packages/app-workflows/src/settings/useCases/IWorkflowSettingsUseCases.ts packages/app-workflows/src/settings/useCases/WorkflowSettingsUseCases.ts packages/app-workflows/src/settings/testing/fakeWorkflowSettingsUseCases.ts
git rm -q packages/app-workflows/src/editor/useCases/abstractions.ts packages/app-workflows/src/editor/useCases/IWorkflowConfigUseCases.ts packages/app-workflows/src/editor/useCases/WorkflowConfigUseCases.ts packages/app-workflows/src/editor/testing/fakeWorkflowConfigUseCases.ts
git rm -q packages/app-workflows/src/review/useCases/IReviewUseCases.ts packages/app-workflows/src/review/useCases/IReviewReadUseCases.ts packages/app-workflows/src/review/useCases/IReviewActionUseCases.ts packages/app-workflows/src/review/useCases/IReviewListUseCases.ts packages/app-workflows/src/review/useCases/IReviewCancelForDeleteUseCases.ts packages/app-workflows/src/review/useCases/ReviewUseCases.ts packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts packages/app-workflows/src/review/testing/fakeReviewUseCases.ts
git rm -rq packages/app-headless-cms-workflows/src/features/gateway/CmsReviewUseCases packages/app-headless-cms-workflows/src/features/gateway/CmsReviewAppGateway packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/abstractions.ts
git rm -rq packages/app-website-builder-workflows/src/features/gateway/WbReviewUseCases packages/app-website-builder-workflows/src/features/gateway/WbReviewAppGateway packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/abstractions.ts
ls packages/app-workflows/src/settings/useCases packages/app-workflows/src/editor/useCases packages/app-workflows/src/review/useCases
```

Expected: the last command lists only folders: `getWorkflowSettings`, `updateWorkflowSettings`; the six editor operation folders; the 17 review operation folders. A file still listed there is one the plan did not foresee: stop and report.

**3b. `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.ts`** (R344: the export keeps its app name, the abstraction alias stays `GatewayAbstraction`, so `implements GatewayAbstraction.Interface` and `GatewayAbstraction.createImplementation` are unchanged):

```ts
// before
import { CmsReviewGateway as GatewayAbstraction } from "./abstractions.js";
// after
import { ReviewAppGateway as GatewayAbstraction } from "@webiny/app-workflows/review/appGateway/abstractions.js";
```

If Task 7 left a comment on the class that names the per-app token or the bridge, replace it with:

```ts
/*
 * The CMS review gateway, one of the `ReviewAppGateway` registrations (R347): it sends the CMS
 * documents and resolves with the `{ data, error }` envelope (R204); the routing `ReviewGateway`
 * of `app-workflows` picks it for `cms.<modelId>` namespaces and for the app `cms`.
 */
```

**3c. `packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.ts`:**

```ts
// before
import { WbReviewGateway as GatewayAbstraction } from "./abstractions.js";
// after
import { ReviewAppGateway as GatewayAbstraction } from "@webiny/app-workflows/review/appGateway/abstractions.js";
```

(The comment, if one names the per-app token or the bridge: the same text with "Website Builder", "WB documents", `wb.page` and `wb`.)

**3d. `packages/app-headless-cms-workflows/src/features/gateway/feature.ts`** (whole file; R347, R354):

```ts
import { createFeature } from "@webiny/feature/admin";
import { CmsReviewRowProvider as RowProviderAbstraction } from "./CmsReviewRowProvider/abstractions.js";
import { CmsReviewRowProvider } from "./CmsReviewRowProvider/CmsReviewRowProvider.js";
import { CmsReviewNotificationHandler } from "./CmsReviewNotificationHandler.js";
import { CmsReviewChangeMessageHandler } from "./CmsReviewChangeMessageHandler.js";
import { CmsReviewContentAdapter as AdapterAbstraction } from "./CmsReviewContentAdapter/abstractions.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter/CmsReviewContentAdapter.js";
import { CmsReviewGateway } from "./CmsReviewGateway/CmsReviewGateway.js";

/*
 * The CMS review registrations: the review gateway under the shared `ReviewAppGateway` token
 * (R347), the content adapter, the Content Reviews row provider and the two websocket handlers.
 */
export const CmsReviewFeature = createFeature({
    name: "CmsWorkflows/Review",
    register(container) {
        container.register(CmsReviewGateway).inSingletonScope();
        container.register(CmsReviewContentAdapter).inSingletonScope();
        container.register(CmsReviewRowProvider).inSingletonScope();
        container.register(CmsReviewNotificationHandler);
        container.register(CmsReviewChangeMessageHandler);
    },
    resolve(container) {
        return {
            contentAdapter: container.resolve(AdapterAbstraction),
            rowProvider: container.resolve(RowProviderAbstraction)
        };
    }
});
```

Before writing it, compare with the current file: apart from the bundle (`CmsReviewUseCases` import and registration) and the bridge (`CmsReviewAppGateway` import and registration), every line of the current file is in the new one. A registration an earlier task added that is not in the new content is kept (add it after the handlers) and listed under "Contract notes" of the report.

**3e. `packages/app-website-builder-workflows/src/features/gateway/feature.ts`** (whole file, same rule):

```ts
import { createFeature } from "@webiny/feature/admin";
import { WbReviewContentAdapter as AdapterAbstraction } from "./WbReviewContentAdapter/abstractions.js";
import { WbReviewRowProvider as RowProviderAbstraction } from "./WbReviewRowProvider/abstractions.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter/WbReviewContentAdapter.js";
import { WbReviewGateway } from "./WbReviewGateway/WbReviewGateway.js";
import { WbReviewChangeMessageHandler } from "./WbReviewChangeMessageHandler.js";
import { WbReviewNotificationHandler } from "./WbReviewNotificationHandler.js";
import { WbReviewRowProvider } from "./WbReviewRowProvider/WbReviewRowProvider.js";

/*
 * The Website Builder review registrations: the review gateway under the shared
 * `ReviewAppGateway` token (R347), the content adapter, the Content Reviews row provider and the
 * two websocket handlers.
 */
export const WbReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Review",
    register(container) {
        container.register(WbReviewGateway).inSingletonScope();
        container.register(WbReviewContentAdapter).inSingletonScope();
        container.register(WbReviewRowProvider).inSingletonScope();
        container.register(WbReviewNotificationHandler);
        container.register(WbReviewChangeMessageHandler);
    },
    resolve(container) {
        return {
            contentAdapter: container.resolve(AdapterAbstraction),
            rowProvider: container.resolve(RowProviderAbstraction)
        };
    }
});
```

**3f. `packages/app-workflows/src/settings/feature.ts`** (whole file; R354: the repository feature and the two use-case features, no `resolve`). Same comparison rule: only the bridge lines (every line naming `WorkflowSettingsUseCases`) disappear.

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowSettingsRepositoryFeature } from "./repository/feature.js";
import { GetWorkflowSettingsFeature } from "./useCases/getWorkflowSettings/feature.js";
import { UpdateWorkflowSettingsFeature } from "./useCases/updateWorkflowSettings/feature.js";

/*
 * The app-neutral settings services, registered once by `WorkflowsAdminApp` inside the feature
 * flag gate (R211, R317): the settings repository with its gateway (singletons) and the two
 * settings use cases (transient). User names and the user search use `ListWorkflowUsersUseCase`
 * of the configuration area.
 */
export const WorkflowSettingsServicesFeature = createFeature({
    name: "Workflows/WorkflowSettingsServices",
    register(container) {
        WorkflowSettingsRepositoryFeature.register(container);
        GetWorkflowSettingsFeature.register(container);
        UpdateWorkflowSettingsFeature.register(container);
    }
});
```

**3g. `packages/app-workflows/src/editor/feature.ts`** (whole file; R354, R364). Same comparison rule: only the bridge lines (the two `WorkflowConfigUseCases` imports, its registration and `configUseCases` in `resolve`) disappear.

```ts
import { createFeature } from "@webiny/feature/admin";
import { WorkflowEditorToasts as ToastsAbstraction } from "./toasts/abstractions.js";
import { WorkflowEditorToasts } from "./toasts/WorkflowEditorToasts.js";
import { WorkflowEditorRepositoryFeature } from "./repository/feature.js";
import { ListWorkflowModelsFeature } from "./useCases/listWorkflowModels/feature.js";
import { GetWorkflowFeature } from "./useCases/getWorkflow/feature.js";
import { StoreWorkflowFeature } from "./useCases/storeWorkflow/feature.js";
import { DeleteWorkflowFeature } from "./useCases/deleteWorkflow/feature.js";
import { InspectRoutingFeature } from "./useCases/inspectRouting/feature.js";
import { FolderExistsFeature } from "./useCases/folderExists/feature.js";

/*
 * The app-neutral editor services, registered once by `WorkflowsAdminApp` inside the feature flag
 * gate (R211): the editor repository with the routing editor gateway (singletons), the six editor
 * use cases (transient) and the editor toasts (singleton). The configuration lookups are
 * `WorkflowConfigServicesFeature`; each app registers its editor gateway under
 * `WorkflowEditorAppGateway` (R347).
 */
export const WorkflowEditorServicesFeature = createFeature({
    name: "Workflows/WorkflowEditorServices",
    register(container) {
        WorkflowEditorRepositoryFeature.register(container);
        ListWorkflowModelsFeature.register(container);
        GetWorkflowFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
        InspectRoutingFeature.register(container);
        FolderExistsFeature.register(container);
        container.register(WorkflowEditorToasts).inSingletonScope();
    },
    resolve(container) {
        return {
            toasts: container.resolve(ToastsAbstraction)
        };
    }
});
```

Check that no source file reads the dropped `configUseCases`: `grep -rn "WorkflowEditorServicesFeature\|configUseCases" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src | grep -v "\.test\."` prints only the `app.tsx` import and registration and the `editor/feature.ts` export (true at HEAD d31d2bcd08 apart from the `configUseCases` line this step removes). A `useFeature(WorkflowEditorServicesFeature)` that reads `configUseCases` is a missed Task 4 migration: stop and report (R364).

- [ ] **Step 4: Run the tests and expect them to pass**

One command at a time, the same ten files as Step 2:

```bash
yarn test packages/app-workflows/src/app.cleanup.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/editor/feature.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/settings/feature.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGateway/CmsReviewGateway.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewGateway/WbReviewGateway.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewGuard/ActiveReviewGuard.test.ts 2>&1 | tail -30
```

Expected: every file PASS. If the scan case of `app.cleanup.test.tsx` lists an offender, it is a file Step 1's Check 1 should have shown: apply the Step 1 rule (reword a comment; stop on a real use).

- [ ] **Step 5: The contract's checks, the covering tests and the builds**

The contract's Check 1 and Check 2 after the edit (Check 1 excludes `app.cleanup.test.tsx`, which spells the names in its guard pattern and its deleted-path list):

```bash
grep -rnE "IReviewUseCases|IReviewReadUseCases|IReviewActionUseCases|IReviewListUseCases|IReviewCancelForDeleteUseCases|\bReviewUseCases\b|CmsReviewUseCases|WbReviewUseCases|IWorkflowConfigUseCases|WorkflowConfigUseCases|IWorkflowSettingsUseCases|WorkflowSettingsUseCases|IWorkflowEditorUseCases|WorkflowEditorUseCases|CmsWorkflowEditorUseCases|WbWorkflowEditorUseCases|createFakeUseCases|createFakeEditorUseCases|createFakeConfigUseCases|createFakeSettingsUseCases|CmsReviewAppGateway|WbReviewAppGateway|WorkflowEditorAppKind|editor/useCases/toOperationError|review/gateway/IReviewGateway" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src --exclude-dir=dist --exclude-dir=node_modules | grep -v "^packages/app-workflows/src/app.cleanup.test.tsx:"
grep -rnE "useCases[?]?:|\.useCases\b|useCases=\{|reviewUseCases" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src --exclude-dir=dist --exclude-dir=node_modules
grep -rn "Cms/Workflows/ReviewGateway\|WebsiteBuilder/Workflows/ReviewGateway\|Cms/Workflows/ReviewUseCases\|WebsiteBuilder/Workflows/ReviewUseCases\|Workflows/WorkflowConfigUseCases\|Workflows/WorkflowSettingsUseCases" packages --include='*.ts' --include='*.tsx' --exclude-dir=dist --exclude-dir=node_modules
```

Expected: all three print nothing (the third proves the old token strings are gone everywhere).

The tests covering the changed code (each file on its own; they exercise the routing, the repositories and the app registrations this task rewired):

```bash
yarn test packages/app-workflows/src/review/gateway/ReviewGateway.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/repository/ReviewRepository.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/config/feature.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.editor.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorGateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -30
```

Expected: every file PASS. (`review/feature.test.ts` and `config/feature.test.ts` exist after Tasks 3 and 8; if one of these paths does not exist, run `ls` on its folder and run the feature test that is there.)

The builds type-check the co-located tests of each package (R243); build in dependency order:

```bash
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: three clean builds. A type error that names a deleted module is a missed importer (Step 1's Check 1 rule); a type error in `resolveAll(ReviewAppGateway)` typing (`gateway.app`, `gateway.canHandle`) means Task 7 declared the interface differently: read `packages/app-workflows/src/review/appGateway/abstractions.ts` and use its names.

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git status --short
```

`git status --short` lists only the deleted and modified files of this task (the **Files** list; `D` for the deleted ones) and no `docs/.reports`, `.superpowers`, `docs/.bruno/workflows/design/` or `.gitleaks.toml` entry. `yarn adio` must report no unused dependency: the CMS and WB packages still import `@webiny/app-workflows`, and the WB package still imports `@webiny/app-headless-cms-workflows` (its feature test). If any step of the chain fails and you fix something, rerun the chain from the first line.

Then commit (the third `-m` lists the comments reworded and the cases carried over in Step 1, one line each, or `none`):

```bash
git commit -m "refactor(app-workflows): delete the use-case bundles, their fakes and the review bridges" -m "Deletes WorkflowSettingsUseCases, WorkflowConfigUseCases and ReviewUseCases with their interfaces, tokens, test and aggregate fakes. In app-headless-cms-workflows and app-website-builder-workflows, deletes CmsReviewUseCases and WbReviewUseCases, the per-app review gateway tokens and the CmsReviewAppGateway and WbReviewAppGateway bridges, and binds CmsReviewGateway and WbReviewGateway directly to ReviewAppGateway. WorkflowSettingsServicesFeature registers only the repository and use-case features, and WorkflowEditorServicesFeature resolves only the toasts. The cleanup test pins the deleted paths and fails on any removed name left in app-workflows." -m "Comments reworded and cases carried over: <one line each, or none>." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

**Contract notes:**
1. Check 1 "after it, none" cannot hold for `app.cleanup.test.tsx`: R358 asks it to list the deleted paths, and `review/useCases/ReviewUseCases.ts` matches `\bReviewUseCases\b`. Step 5 excludes that one file; its guard pattern is the same list, so the test enforces Check 1 for `app-workflows` on every run, not only at execution time. The CMS and WB packages have no cleanup test, so for them Check 1 stays a grep (Step 5) plus the builds.
2. Check 2 (runtime passing) is not turned into a test: its pattern also matches a plain type annotation such as `let useCases: X`, which is not runtime passing, so a permanent test would flag harmless code. It is run as a grep in Steps 1 and 5.
3. The contract lists `[CMS]/index.test.tsx` and `[WB]/index.test.tsx` as asserting "`ReviewAppGateway` and `ReviewGateway` instead of the bundles". The `ReviewGateway` routing assertions already exist there from Tasks 6-8 (Review Focus 10, R362), so this task deletes the two bundle cases per file, tightens Task 7's existing `ReviewAppGateway` flag case to the app class itself (prototype check) instead of adding a second registration case, and checks the routing tests are present (Step 1e/1f grep). A second routing or registration test would duplicate them.
4. The contract's file list for this task does not name `[AWS]/feature.ts` or `[AWS]/feature.test.ts`, but R356 has `WorkflowSettingsServicesFeature` register the settings bridge until Task 14, and R358 deletes the bridge, so both change here (the same as `[AWE]/feature.ts` for the config bridge). `CmsReviewFeature` / `WbReviewFeature` (`features/gateway/feature.ts`) and the two gateway classes change because R358 says the task "binds `CmsReviewGateway` / `WbReviewGateway` directly to `ReviewAppGateway`".
5. Several files this task rewrites are changed first by Tasks 1-13, which were planned in parallel: `[AWS]/feature.ts` and its test (Task 1), `[AWE]/feature.ts` and its test (Tasks 3, 5), `[CMS|WB]/features/gateway/feature.ts` and their tests (Tasks 7, 12), the index tests (Tasks 6-8), `app.test.tsx` (Tasks 1, 3, 5, 8, 9) and `app.cleanup.test.tsx` (Tasks 1, 3, 5). Their "before" hunks are written against HEAD d31d2bcd08 and the contract's description of those tasks; the whole-file replacements carry a comparison rule (only the bridge or bundle lines disappear, anything else an earlier task added is kept and reported). Step 1's first block checks every name this task imports from Tasks 1-9.
6. `[AWE]/feature.test.ts` registers `ReviewRepositoryFeature` because `StoreWorkflowUseCase` and `DeleteWorkflowUseCase` depend on `ReviewRepository` from Task 10 (R350); without it the transient-use-case case could not resolve them. From this task on the test no longer registers `WorkflowConfigServicesFeature` (R364 needed it only while the config bridge was in the editor feature) and asserts that the editor feature registers no configuration service (D187).
7. The WB feature test keeps the A83 "both apps in one container" case in its new form (both app classes under `ReviewAppGateway`, registration order `wb`, `cms`, A114); the cache half of A83 lives in `ReviewRepository.test.ts` (Task 8), whose per-app cases Step 1 checks before the old case is dropped.

**Review fixes (sub-phase review):**
1. 1a: `DELETED_PATHS` also pins the 13 paths Tasks 1, 3, 5, 6 and 7 deleted or moved away (Task 6's four editor-bundle files, which its contract note leaves to this task; the two deleted bundle tests of Tasks 1 and 3; the moved `toOperationError` pair, config gateway trio, `IWorkflowEditorGateway.ts` and `IReviewGateway.ts`); `editor/gateway/abstractions.ts` is left out because Task 5 recreates it. The `KEPT_PATHS` note now says where Tasks 1, 3 and 5 inserted their entries (the array's end is unchanged). Step 2's expected failures say the 13 extra entries already pass.
2. 1b/1c: the dropped-case list names Task 7's "registers only its own bridge ..." case, Task 12's "resolves the content adapter and the row provider, and no use case" case and HEAD's "registers every token as a singleton", which resolve the per-app tokens or describe the bridge, so they are replaced, not carried over verbatim.
3. 1e/1f: Task 7 already imports `ReviewAppGateway` and already asserts the flag-on/off registration under the shared token, so the task now deletes the two bundle cases and tightens Task 7's case (retitled R358, prototype check) instead of adding two near-duplicate cases; the routing-test grep matches Task 7's `resolve(ReviewGatewayAbstraction)`; Step 2's expected failures and contract note 3 follow.
4. 1h: `settings/feature.test.ts` is edited by two deletions against Task 1's version (the bridge import and the bridge case) instead of a whole-file rewrite, which would have dropped Task 1's per-operation feature case; the Files entry is now "Modify".
5. 1i: the settings `describe` of `app.test.tsx` is edited against Task 1's version (delete the bridge case and the bridge line of the flag-off case) instead of being replaced, which would have dropped Task 1's gateway and transient-use-case assertions; the import step is gone (Task 1 already added them).
6. Step 1 Check 1: `settings/feature.test.ts` is a definite hit (Task 1 kept a bridge case), not "possibly".
