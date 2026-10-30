# Workflows Phase 2: Target Adapters, App Wrappers and CMS Hooks

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Status note (after phase 3):** GraphQL for every wrapper, `getTargetReview` per app, the review lists, the redaction of assignment details, the D100 validation, the request title, the CMS editor model list and the WB error mapping (A26) landed in phase 3 (`docs/.bruno/plans/2026-10-13-workflows-phase-3/`); the "Not in this phase" items marked (3) are done there. The phase-3 hand-off is complete except `listUsers` (phase 4) and the notification transports (phase 7). Done in phase 7 (R181-R200).

**Goal:** Make the phase 1a engine usable by the two apps. Each app (Headless CMS, Website Builder) gets its target adapter (load, `system.workflow` sync, read access for another user, publish, move, trash and delete rules) and its wrapper use cases, which read the identity, check the `workflows` permission and target access, then call the internal api-workflows use cases (D132, D133). One set of CMS entry handlers covers CMS entries and Website Builder pages: `system.workflow = null` on a new revision (D59) and the save block on bound models (D62, D80, D134). Trashing or deleting content with a review in progress is refused; the app's cancel-for-delete wrapper is the confirm path (D134). Models bound to a workflow cannot be deleted, neither directly nor through the "fully delete model" task (D41, D64, D134). No GraphQL (phase 3).

**Architecture:** Four layers, built bottom up.

1. **Platform and engine additions** (`packages/api-core`, `packages/api-workflows`, 2.1). First, two labelled api-core commits (D134 point 6): permissions cached per identity object and tenant, so `IdentityContext.withIdentity` evaluates the other user's permissions, plus `withAuthorization`, so a check for another user is real even inside `withoutAuthorization` (R49, R69); the test harness grants other identities only what a test lists (R70). Then the engine: `actor` on the workflow store and delete input and events (1a R26, 1b R39); every blocking review on the delete-blocked error (D115, R57); `GetTargetReview`, `ListTargetReviews`, `GetBoundWorkflow`, `DeleteTargetReviews` and `CancelTargetReviews` use cases for the adapters and wrappers; a cancel reason on the cancelled event (R85); the `ReviewTargetReadAccess` port (`canUserRead(userId, target)`) next to `ReviewTargetLoader` and `ReviewTargetSync` (R50, R71); `CandidateReadAccess`, a fail-closed boolean read check run as another admin user of the tenant (R67, R68); shared adapter errors; the shared wrapper building blocks (R78).
2. **CMS adapter and hooks** (`packages/api-headless-cms-workflows`, 2.2): CMS target reading and read, write and delete access with the app's real logic (group and model read, `AccessControl.canAccessEntry` with the entry, folder-level permissions, R47, R72), the `cms.*` adapter (loader, sync, read access for another user), the single CMS entry handlers, the publish and move rules, the trash and delete rules with the review cleanup, and the guards on `DeleteModelUseCase` and the "fully delete model" task.
3. **CMS wrappers** (2.3): twelve wrapper use cases. Eleven are `CurrentReviewViewer` → permission and target checks → engine use case; `CancelCmsEntryReviewsForDelete` needs delete access instead of a `workflows` permission (D134, R74).
4. **Website Builder adapter and wrappers** (`packages/api-website-builder-workflows`, 2.4): the `wb.page` adapter on the Website Builder page events, its namespace registration for the single CMS handlers, and twelve WB wrapper use cases.

**Tech Stack:** TypeScript, `@webiny/feature` DI (`createFeature`, `createAbstraction`, `createImplementation`, `createDecorator`), `@webiny/di`, `IdentityContext` / `AuthorizationContext` / `AuthenticationContext` / `TenantContext` from `@webiny/api-core`, CMS use cases and events from `@webiny/api-headless-cms`, `DeleteModelOperations` from `@webiny/api-headless-cms-tasks`, `FolderLevelPermissions` from `@webiny/api-aco`, `WbPermissions` and page events from `@webiny/api-website-builder`, `BaseError` / `Result` from `@webiny/feature/api`, vitest, `@webiny/api-headless-cms-testing` (`createCmsTestHandler`).

**Spec:** `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` sections 4.5, 5.1 (engine vs wrapper columns), 5.3, 8, 9.2, 9.3, 11 (only the target-read predicate idea, used here for the delete-blocked listing). Decisions: `docs/.bruno/workflows/decisions.md` D41, D52, D59, D61, D62, D64, D77, D79, D80, D84, D115, D121, D131, D132, D133, D134. Roadmap: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` (phase 2 row and cross-phase rules). Earlier rules keep applying: `../2026-10-09-workflows-phase-1a/00-shared.md` (R1-R28, A1-A12) and `../2026-10-10-workflows-phase-1b/00-1b-permission-building-blocks.md` (R29-R44, A13-A19). This plan continues with R45-R87 and A20-A39.

## Global Constraints

- No helper functions or private methods that wrap a dependency call (use case, service, reader, logger); call the dependency inline in the owning class with the Result pattern. Shared logic that needs dependencies becomes a DI service named `...Service`.
- DI conventions: one abstraction or implementation per file; implementation file named after its class (no `implementation.ts`); export name matches the abstraction; types via namespace (`X.Interface`); no inline object types (extract named interfaces); minimal barrel exports (only what external consumers need).
- Before every commit, run from the repo root, in order: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, build the changed packages (`yarn build -p <package> 2>&1 | tail -30`), `git add .`. If any step changes something or fails and you fix it, rerun the chain from the start.
- `yarn format:fix` rewrites `.gitleaks.toml`. Restore it with `git checkout -- .gitleaks.toml` before the final `git add .`; never commit it.
- Commit messages use Conventional Commits and end with exactly these two lines:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
  ```
- Never push, never amend.
- Test commands (from repo root): `yarn test <path>` (default storage), `yarn test:ddb <path>`, `yarn test:os <path>`, `yarn test:sql <path>`. Cap output with `2>&1 | tail -50`. Run every storage the package's `ci.config.json` lists:
  - `packages/api-workflows`: `["ddb", "ddb-os,ddb"]` → `yarn test` and `yarn test:os`.
  - `packages/api-core`: `["ddb", "sql,ddb"]` → `yarn test` and `yarn test:sql` (Task 1 runs the full package, both storages).
  - `packages/api-headless-cms-workflows` (from Task 7) and `packages/api-website-builder-workflows` (from Task 15): `["ddb", "ddb-os,ddb"]` (R77) → `yarn test` and `yarn test:os`. Before those tasks the packages have no `ci.config.json`; run `yarn test:os` on them anyway (workflows assume OpenSearch, D63).
  - OpenSearch is not available locally: run `yarn test:os` anyway, and if it cannot run, record "not run" in the task report and leave it to CI (A9).
- Type-check tests in every task that adds or changes test files: `yarn check:test:types -p <folder> --report cli 2>&1 | tail -40` (folder name, e.g. `api-workflows`).
- Use CodeGraph (`codegraph explore "<symbols>"`) before reading files to confirm symbols and import paths.
- New package dependencies are allowed only where this file's R65 lists them; `yarn adio` must pass after each.

## Review Focus

1. **A wrapper acts without target read access** (spec 5.1, D133 point 7). Every review action (start, take over, approve, reject, cancel, get review) needs read access to the target; request needs write access (D77). Pinned per app by the `it.each` tests "refuses <action> without read access to the target" (Task 14; "... to the page" in Task 18) and "refuses a request without write access" (Tasks 13, 18); the WB request refuses a user without page permissions before loading the page (Task 18, R75).
2. **Cancel by a non-requester without `reassign`** (D25, D54, 1b R41). Pinned by "refuses cancel by a non-requester without reassign" and "lets a reassigner with read access cancel" (Tasks 14, 18). A finished review must fail with the engine's `Workflows/Review/InvalidState`, not "not authorized", for the requester and a `reassign` holder alike (1b R41): "reports a state error, not a permission error, for a finished review".
3. **A CMS handler acts on the wrong app or recurses on the workflows' own models** (D59, R51, R52). WB pages are CMS entries, and the workflow, review and assignment models are private CMS models whose entries also fire CMS entry events. Pinned by Task 7 "resolves the review namespace of public models only", Task 9 "does not block saving workflows and reviews", Task 10 "ignores private models such as Website Builder pages" and Task 16 "blocks updates to a page under review through the CMS save block".
4. **Publish without an approved review on a bound model** (D79, D121). Fail closed on lookup errors; never trust `system.workflow` (writable through the update input). Only the publish action is guarded: creating content as published stays allowed (D134 point 2, R83). Pinned by Task 10: "blocks publishing without a review", "blocks publishing while the review is in progress or rejected", "publishes an approved revision and republishes it after unpublishing (D121)", "publishes normally on a model without a workflow", "blocks publishing when the workflow lookup fails", "creates entries and revisions as published on a bound model without a review"; and by Task 16 for pages: "blocks publishing without an approved review (D79)", "publishes an approved page and republishes it after unpublishing (D121)", "publishes normally without a pages workflow".
5. **Another user's read access computed with the caller's permissions, or not at all** (D61, D133, R48, R49, R67-R70). `withIdentity` used to return the outer identity's cached permissions, and inside `withoutAuthorization` every check passed. Pinned by Task 1 "loads the permissions of the identity set by withIdentity", "never shares permissions between two identity objects with the same id", "checks real permissions inside withoutAuthorization"; Task 6 "answers the check as the given admin user", "denies a user who is not an admin user of the current tenant", "checks the user's real permissions inside withoutAuthorization", "fails closed when the check throws"; Tasks 8 and 16 "answers read access for another user with that user's permissions", "answers with the user's permissions, not a less privileged caller's", "denies read access when reading the target throws"; Task 8 "denies another user with entry permission but without model read".
6. **A model read under another identity or without authorization** (A19). Adapters read the CMS model (and its group) as the current identity before `CandidateReadAccess` or `withoutAuthorization`. Review by reading `CmsEntryReviewTargetSync`, `CmsEntryReviewTargetReadAccess`, `WbPageReviewTargetSync`, `WbPageReviewTargetReadAccess`.
7. **Orphaned reviews and assignment records after a permanent delete** (spec 9.3, R56, R81). Pinned by Task 5 "deletes a target's reviews and their assignment records", Task 10b "deletes the reviews of a permanently deleted entry", "deletes the reviews of entries deleted in bulk", "refuses to delete a revision under review and deletes its reviews after cancel", "keeps the delete when the review cleanup fails", Task 16b "keeps the reviews of a trashed page and deletes them with the page".
8. **Delete-blocked listing leaks unreadable reviews or costs unbounded reads** (D115, R57, R76). Pinned by Task 6b "keeps the first five readable reviews in order", "checks at most 50 reviews", "counts a failed check as unreadable" and Task 12 / Task 17 "lists at most five readable blocking reviews and keeps the exact count" (locked and readable targets interleaved).
9. **Cross-app access** (D133 point 1, R46). A CMS wrapper must not read, act on or rebind a WB workflow or review, and the reverse. Pinned by "reports a Website Builder review as not found", "does not rebind a Website Builder workflow" (Tasks 12-14) and the WB mirrors (Tasks 17, 18).
10. **Trash and delete with a review in progress** (D134, R73, R74). Refused on bound models with `Workflows/Review/ActiveReviewOnTrash`; the cancel-for-delete wrapper needs delete access, no cancel right, and records the caller and the reason. Pinned by Task 10b "refuses to trash an entry with a review in progress", "refuses deleteMultiple when an entry has a review in progress", Task 16b "refuses to trash a page with a review in progress, and trashes it after cancel", Task 14b "lets a user who may trash the content cancel its review, then trash it", "refuses a user who cannot delete the content" and their Task 18b mirrors ("... the page ...").
11. **Bound-model guards** (D134 points 4 and 5, R84). Unbound models never look up reviews; the model delete and the "fully delete model" task are refused for bound models before anything is deleted. Pinned by Task 9 "updates entries of an unbound model even when the review lookup fails", "stops locking an approved revision once its workflow is deleted", Task 10b "trashes entries of an unbound model without looking up reviews", Task 11 "refuses to start the task for a bound model, before anything is deleted".

## Rulings

Binding for this plan. Where they refine the spec, the ruling wins for phase 2.

- R45. **Wrapper names.** CMS (`packages/api-headless-cms-workflows`): `StoreCmsEntryWorkflowUseCase`, `DeleteCmsEntryWorkflowUseCase`, `ListCmsEntryWorkflowsUseCase`, `GetCmsEntryWorkflowUseCase`, `RequestCmsEntryReviewUseCase`, `GetCmsEntryReviewUseCase`, `StartCmsEntryReviewStepUseCase`, `TakeOverCmsEntryReviewStepUseCase`, `ApproveCmsEntryReviewStepUseCase`, `RejectCmsEntryReviewStepUseCase`, `CancelCmsEntryReviewUseCase`, `CancelCmsEntryReviewsForDeleteUseCase`. Website Builder (`packages/api-website-builder-workflows`): `StoreWebsiteBuilderPageWorkflowUseCase`, `DeleteWebsiteBuilderPageWorkflowUseCase`, `ListWebsiteBuilderPageWorkflowsUseCase`, `GetWebsiteBuilderPageWorkflowUseCase`, `RequestWebsiteBuilderPageReviewUseCase`, `GetWebsiteBuilderPageReviewUseCase`, `StartWebsiteBuilderPageReviewStepUseCase`, `TakeOverWebsiteBuilderPageReviewStepUseCase`, `ApproveWebsiteBuilderPageReviewStepUseCase`, `RejectWebsiteBuilderPageReviewStepUseCase`, `CancelWebsiteBuilderPageReviewUseCase`, `CancelWebsiteBuilderPageReviewsForDeleteUseCase`. Phase 3 names its GraphQL operations after them (`storeWebsiteBuilderPageWorkflow`, `cancelCmsEntryReviewsForDelete`, ...).
- R46. **Each app owns its namespaces** (D133 point 1). CMS wrappers accept only `cms.<modelId>`, WB wrappers only `wb.page`. A workflow or review of the other app is reported as not found (`Workflows/Workflow/NotFound`, `Workflows/Review/NotFound`); a request (or cancel-for-delete) for another app's model fails with `Workflows/Review/TargetNotFound`; storing a workflow whose `models` are not the app's fails with `Workflows/Workflow/Validation`, and storing over the id of another app's workflow fails with `Workflows/Workflow/NotFound` (no rebinding across apps).
- R47. **Target access for the current user is the app's real logic.** CMS (`CmsEntryAccess`): group read (`AccessControl.canAccessGroup`), model read (`canAccessModel`), `canAccessEntry({ model, entry, rwd })` (model, group, entry and own permissions) AND folder-level permissions on the entry's folder (inline in `CmsEntryAccess`: `getFolderLevelPermissions` + `canAccessFolderContent` with the same `rwd`, skipped for the root folder or when FLP is not in use), mirroring `GetEntryByIdWithFlpDecorator`, `UpdateEntryWithFlpDecorator` and `DeleteEntryWithFlpDecorator` (R72). WB (`WbPageAccess`): read = `WbPermissions.canRead("page") && WbPermissions.canAccess("page", page)` (as `GetPageByIdUseCase`), write = read AND `WbPermissions.canEdit("page", page)` (as `UpdatePageUseCase`, R82), delete = read AND `WbPermissions.canDelete("page", page)` (as `TrashPageUseCase`), each AND the same FLP check (pages are CMS entries and the ACO CMS decorators apply to them). Read for every review action and get review; write for request (D77); delete for cancel-for-delete (D134). The model, its group, or the page model and the revision are read with `GetModelUseCase` / `GetGroupUseCase` / `PageModelProvider` and `GetRevisionByIdUseCase` as the current identity; a model or group the user cannot read makes the target unreadable; a trashed revision reads as missing.
- R48. **Another user's read access** (`canUserRead`, D61, D133 point 4a). The adapter reads the model, group and revision as the current identity, then evaluates its own current-user read check through `CandidateReadAccess.canUserRead(userId, check)` (R67). Nothing reads a model as the other user (A19).
- R49. **api-core caches permissions per identity.** `AuthorizationContext.loadPermissions(identity)` caches per identity object and tenant (R69) instead of one slot per request, so `withIdentity` returns the right permissions and cannot poison the outer identity's cache; a failed load is evicted; `clearPermissionsCache()` drops everything. `withAuthorization(cb)` (on `AuthorizationContext` and `IdentityContext`) re-enables authorization inside `withoutAuthorization`. The test harness gains per-identity permissions: `TestPermissionsHolder.byIdentity` (api-core-testing) and `CmsTestHandlerParams.permissionsByIdentity` (api-headless-cms-testing). Landed as two labelled commits at the start of 2.1 with the full api-core suite (DDB and SQL) and the neighbouring suites (D134 point 6).
- R50. **`ReviewTargetReadAccess` port** lives in `api-workflows/src/features/review/ReviewTargetReadAccess/` beside `ReviewTargetLoader` and `ReviewTargetSync`: `canHandle(model)` + `canUserRead({ userId, model, targetId, targetRevisionId })`. One implementation per namespace, last registered match wins, no match means no access (fail closed). Phase 4 (routing, reassign) consumes it; phase 2 only registers the implementations and tests them directly. The engine never calls it for the caller (the caller's checks are the wrappers'). Phase 4 consumes it (R111, R112, R119, R120) and adds `canUserReadInFolder` for the inspector (R121).
- R51. **One namespace resolver for the single CMS handlers.** `CmsEntryReviewNamespace` (in `api-headless-cms-workflows`, resolved `multiple`) maps a CMS model to its review namespace; the last registered non-null answer wins. The CMS package registers `CmsModelReviewNamespace` (non-private model → `cms.<modelId>`, private → `null`); the WB package registers `WbPageReviewNamespace` (`PAGE_MODEL_ID` → `wb.page`). The save block skips models with no namespace, which covers the workflows' own private models (no recursion when the engine saves reviews) and every other private model.
- R52. **Adapter handlers match their namespace explicitly** (D59, spec 9.2). The save block uses R51; the revision-create handler nulls `system.workflow` on every model's new revision (harmless where no review exists); the model delete guards act on `cms.<modelId>` by model id. The publish, move, trash and delete rules are adapter handlers: the CMS adapter listens to CMS entry events and acts only on non-private models (`cms.*`); the WB adapter listens to the WB page events (`PageBeforePublish`, `PageBeforeMove`, `PageBeforeTrash`, `PageBeforeDelete`, `PageAfterDelete`), because WB `MovePage` bypasses `MoveEntryUseCase` (it calls `MoveEntryRepository`), WB wraps CMS errors in its own (losing the code), and WB `DeletePage` is the permanent delete of a trashed page.
- R53. **Publish rule** (D79, D121). If a workflow is bound to the namespace (`GetBoundWorkflowUseCase`), publishing the revision needs its active review in state `approved` (`GetTargetReviewUseCase`); otherwise `Workflows/Review/PublishBlocked`. A failed lookup throws the lookup error (fail closed). `system.workflow` is never read: it is writable through the CMS and WB update inputs. Republishing an unpublished approved revision passes because approved reviews stay active (D23). Only the publish action is guarded (R83).
- R54. **Save block** (D62, D80, D134 point 5). On a model bound to a workflow (`GetBoundWorkflowUseCase` first; unbound models never look up reviews), an update of a revision with any active review (in progress, approved or rejected) fails with `Workflows/Review/TargetLocked` (`action: "update"`). Failed lookups throw (fail closed, A38). `UpdateEntrySystemUseCase` does not publish `EntryBeforeUpdate`, so the sync is exempt; the automation bypass context is phase 5. Done in phase 5 (R131-R158).
- R55. **Move rule** (D84). A move is entry-level (all revisions share `location`), so on a bound model it is blocked while any revision of the target has an `inProgress` review (`ListTargetReviewsUseCase`), with `Workflows/Review/TargetLocked` (`action: "move"`). Approved, rejected and cancelled reviews do not block.
- R56. **Permanent delete cleanup** (spec 9.3). CMS: `EntryAfterDelete` with `permanent: true` deletes every review of the entry; `EntryRevisionAfterDelete` deletes the reviews of that revision; `EntryAfterDeleteMultiple` deletes the reviews of each listed entry confirmed gone; moving to the trash keeps them (the entry can be restored; only finished reviews remain, R73). WB: `PageAfterDelete` (delete from the trash) deletes every review of the page. `DeleteTargetReviewsUseCase` deletes each review's assignment-log records first (paged by `reviewId`, R23), then the review. A failure is logged, not thrown (R81).
- R57. **D115 lands in phase 2** (the roadmap lists it under phase 3; the wrapper delete is built here, so its listing is too). The engine's `Workflows/Workflow/HasActiveReviews` carries `{ count, reviews }` with every in-progress review as a `WorkflowBlockingReview` (review id, model, target id, revision id, title, step position, step count, step name). The app's delete wrapper keeps the first 5 the caller can read (R47, R76) and returns the same error class with the exact count.
- R58. **`actor` on workflow input and events** (1a R26, 1b R39). `StoreWorkflowInput.actor` and `DeleteWorkflowInput.actor` are required `Actor`s; all six workflow events carry `actor` in their payload.
- R59. **Per-app workflow list.** WB lists `models_in: ["wb.page"]`. CMS cannot express "every `cms.*` model" with the CMS where-filters, so `ListCmsEntryWorkflowsUseCase` pages through the engine list (`limit: 100`) and keeps workflows whose every model is `cms.*`. Neither wrapper pages its own result in phase 2 (v1 binds one model per workflow, so the list is at most the model count); phase 3 adds paging if it needs it (A23). Phase 3 kept both workflow lists unpaged (R88).
- R60. **Workflow store and delete need `editor`** (`WorkflowsPermissions.canEdit()`, full access included); list and get need only an authenticated identity (D78). The store wrapper passes the loaded `savedOn` through (D131).
- R61. **Picks.** The wrapper does not re-validate picks: write access to the target (D77) is the only wrapper condition for `canPick` (spec 5.3), and the engine's `Review.request` already rejects malformed picks with `canPickReviewer` (1b R35). Pinned through the wrapper by "rejects a pick on a step without manual picks".
- R62. **Get review** returns `ReviewWithViewerFlags { review, flags }` with `flags = applyTargetAccess(getReviewViewerFlags(review, viewer), { canRead: true })`. Without read access it fails with `Workflows/NotAuthorized` instead of returning all-false flags (the review content itself needs read access). Redaction of per-user skip entries and `excludedReason` is phase 3, in the wrapper (said in its JSDoc). Skip-entry redaction done in phase 3 (R96); `excludedReason` redaction done in phase 4, in the per-app step-candidate wrappers (R120).
- R63. **Sync** (D52). Each adapter's `ReviewTargetSync` reads the model as the current identity, then runs `UpdateEntrySystemUseCase` inside `withoutAuthorization` (reviewers need only read access). Failures are returned as a failed `Result` (R16).
- R64. **Model delete guards** (D41, D64, D134 point 4). `DeleteModelBoundToWorkflowDecorator` on `DeleteModelUseCase` returns `Workflows/Model/BoundToWorkflow` (data: `modelId`, bound workflows `{ id, name }`) before the decorated chain runs, so `DeleteModelWithEntryCleanup` never deletes singleton entries of a bound model. `FullyDeleteModelBoundToWorkflowDecorator` on `DeleteModelOperations.fullyDeleteModel` (api-headless-cms-tasks) throws the same error before the background task is triggered, so no entry or folder is deleted. Both read the model as the caller first and leave a caller without model delete access to the CMS's own error; a failed workflow lookup blocks with `Workflows/Workflow/Persistence`. Both errors join `IDeleteModelUseCaseErrors` through module augmentation (precedent: `api-workflows/src/types.ts`).
- R65. **Dependencies.** `api-headless-cms-workflows`: `@webiny/api-aco` moves from `devDependencies` to `dependencies` (runtime `FolderLevelPermissions`); add `@webiny/api-headless-cms-tasks` to `dependencies` (the task guard, R64). `api-website-builder-workflows`: add `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows` (namespace registration, shared helpers) and `@webiny/api-aco` to `dependencies`, move `@webiny/api-headless-cms` from `devDependencies` to `dependencies`; add `@webiny/background-tasks`, `@webiny/languages`, `@webiny/di` to `devDependencies` (test harness). `api-headless-cms-testing` and `api-core-testing` need none.
- R66. **`TargetContext`** (spec 9.3). `folder` is `null` for the root folder or no location, otherwise `{ id, type }` with type `cms:<modelId>` or `wb:page`; `modelId` is the CMS model id (`article`, `wbyWbPage`); `title` is `getEntryTitle(model, entry)` for CMS and `properties.title` for pages; `author` is the revision's `createdBy` `{ id, displayName }`.
- R67. **`CandidateReadAccess` replaces a general "run as user".** `canUserRead(userId, check)` runs one boolean check as the admin user `userId` inside `IdentityContext.withIdentity` and `withAuthorization` (so it is a real check also inside `withoutAuthorization`, e.g. background tasks), and returns `false` if anything throws (fail closed). There is no general `run<T>`: nothing can write as another user through it. Tested inside `withoutAuthorization`.
- R68. **The candidate identity.** `CandidateReadAccess` first checks that the user is an admin user of the current tenant (one `GetUserUseCase` read, run without authorization as a membership lookup); otherwise it denies without running the check. No lookup in a parent tenant. A found user becomes `new AuthenticatedIdentity({ id, displayName, type: "admin", context: { canAccessTenant: true } })`; the authorizers then load the stored roles and teams (A20). Caveat: `GetUserUseCase` is a public extension point; a project decorator that adds a cross-tenant fallback (a user found in another tenant) would weaken this membership check, so such a decorator must keep the lookup scoped to the current tenant.
- R69. **Permission cache key.** Per identity object instance AND tenant id (`WeakMap<Identity, Map<tenantId, Promise>>`): two identities with the same id but a different context never share an entry, and a tenant switch loads again. `CandidateReadAccess` (singleton per request container) reuses one identity object per tenant and user, so each candidate's permissions load once per request.
- R70. **Test authorizer.** `TestAuthorizer` answers the request identity as before (its `permissions`, or an API-key request identity's embedded permissions); any other identity gets `byIdentity[id] ?? []`, except a real API-key identity, which it leaves to api-core's `ApiKeyAuthorizer` (`null`). So no test inherits the request user's permissions for another user by accident.
- R71. **Port name.** The new port is `ReviewTargetReadAccess` (selector `canHandle`, like the siblings' `canLoad` / `canSync`); 1b's `ReviewTargetAccess` flags type in `domain/review/types.ts` stays. Adapter files: `CmsEntryReviewTargetReadAccess`, `WbPageReviewTargetReadAccess`.
- R72. **CMS another-user read includes group and model read** (D61 "model read"): `CmsEntryAccess` checks `canAccessGroup` and `canAccessModel` before `canAccessEntry`, on the group and model read as the current identity. `canAccessEntry` alone ignores the model and group `rwd`.
- R73. **Trash and delete with a review in progress** (D134 points 1 and 3). On a bound model (R84), refused with `ReviewActiveOnTrashError` (`Workflows/Review/ActiveReviewOnTrash`, data `{ model, action: "trash" | "delete", reviews: WorkflowBlockingReview[] }`): CMS `EntryBeforeDelete` (`permanent: false` → trash, `true` → delete; any revision's in-progress review), `EntryRevisionBeforeDelete` (that revision's), `EntryBeforeDeleteMultiple` (every listed entry the caller may access, same check as the use case); WB `PageBeforeTrash` and `PageBeforeDelete`. Lookup failures refuse (fail closed). CMS bulk actions inherit the refusal per entry. The admin dialog flow is phase 8a (UI brief).
- R74. **Confirm path: the cancel-for-delete wrapper.** `CancelCmsEntryReviewsForDelete({ model, targetId, targetRevisionId?, action })` and `CancelWebsiteBuilderPageReviewsForDelete({ targetId, action })` read the identity, list the in-progress reviews, check delete access to the content (R47; no `workflows` permission, no cancel right) and cancel them through `CancelTargetReviewsUseCase` as the caller with reason "content trashed" / "content deleted"; the admin then repeats the trash or delete. Chosen over a `cancelActiveReview` flag on the trash operation because the flag would have to travel through the CMS and WB delete inputs, their GraphQL mutations, the `EntryBeforeDelete` payloads and the bulk-action tasks (all outside the workflows packages), while the wrapper follows D132 and covers trash, entry delete, revision delete and `deleteMultiple` alike. The two calls are not atomic (A35).
- R75. **WB request checks the page permission before loading** (no existence probe): `RequestWebsiteBuilderPageReview` calls `WbPageAccess.canWriteAnyPage()` (`WbPermissions.canEdit("page")`, as WB `UpdatePageUseCase` does first) before reading the page; without it, `Workflows/NotAuthorized` for missing and existing pages alike.
- R76. **D115 cost cap.** The delete wrappers check at most 50 blocking reviews for readability (`ReadableBlockingReviewsService.filter`); a failed or throwing read counts as unreadable; the count stays exact. Past the cap the list can hold fewer than 5 although more readable ones exist.
- R77. **CI storages.** `api-headless-cms-workflows` (Task 7) and `api-website-builder-workflows` (Task 15) get `ci.config.json` `{"$schema": "../../.github/workflows/ci.config.schema.json", "vitest": {"storageOps": ["ddb", "ddb-os,ddb"]}}` (same format as `api-workflows`); the WB preset falls back to the DDB preset (`packages/build-tools/testing/presets.js`).
- R78. **Shared wrapper building blocks** (D132). App-neutral pieces live in api-workflows (Task 6b): the DI service `ReadableBlockingReviewsService` (`filter(reviews, canRead)`, with `MAX_BLOCKING_REVIEWS`, `MAX_BLOCKING_REVIEW_CHECKS` and `BlockingReviewReadCheck`; injected into the delete wrappers, which pass an inline read check) and the pure domain helpers `belongsToApp` / `isAppWorkflow` (with the app's namespace predicate, used for store validation, no rebind, list and get), `getDeleteCancelReason`. Logic that needs api-aco or CMS events (the folder-level permission check, the in-progress review lookup) is not shared: each owning class (`CmsEntryAccess`, `WbPageAccess`, the trash and delete handlers) calls its dependencies inline. The per-app wrapper classes stay per app.
- R79. **API-key tests use a real key.** The wrapper tests create a stored key with `CreateApiKeyUseCase`, authenticate its token through api-core's `AuthenticationContext` → `ApiKeyAuthenticator`, and get its permissions from `ApiKeyAuthorizer` (following `api-core/__tests__/security/apiKeys.features.test.ts`). The "key cannot start a pool step" test acts on a review someone else requested (the engine checks "requester cannot review" before team membership).
- R80. **Actor on events is tested.** The store and delete wrapper tests record published events (`RecordingEventPublisher`) and assert `payload.actor` on all workflow events; the cancel-for-delete tests assert the cancelled fact's `actor` and `reason`.
- R81. **Cleanup after a permanent delete logs and continues.** The after-delete handlers log a failed review cleanup (`Logger.error`) instead of throwing: the content is already deleted, and a throw would make the use case report a failure and publish its error event for a delete that happened. The reviews then stay orphaned (A34).
- R82. **WB write and delete include read**: WB loads the page through `GetPageByIdUseCase` before updating or trashing it, so `canWrite` and `canDelete` require `canRead`.
- R83. **Create as published stays allowed** (D134 point 2). Create, create-from and new revision with `status: "published"` on a bound model need no review (data transfer from other systems). No handler guards `EntryBeforeCreate` / `EntryRevisionBeforeCreate` for status; a Task 10 test pins it.
- R84. **Bound model first.** Every rule that looks up reviews on content (save block, publish, move, trash, delete) first asks `GetBoundWorkflowUseCase` for the namespace and does nothing on an unbound model (D134 point 5 for the save block; the same rule for the others keeps unbound models working when the review lookup fails) (confirmed 2026-10-12). The after-delete cleanup runs on every public model and pages (it removes reviews left from a deleted workflow) and only logs failures.
- R85. **Cancel reason.** `CancelReviewInput.reason?`, `Review.cancel({ reason })` and `ReviewCancelledFact.reason: string | null` record why a review was cancelled (`null` for a normal cancel); `CancelTargetReviewsUseCase` cancels every in-progress review of a target or revision through `CancelReviewUseCase` (save, sync and event as a normal cancel).
- R86. **Cancel-for-delete wrappers check the entity-level permission first.** `CancelCmsEntryReviewsForDelete` calls `CmsEntryAccess.canDeleteAnyEntry(model)` (group and model read, `AccessControl.canAccessEntry({ model, rwd: "d" })`, as `DeleteEntryUseCase`) and `CancelWebsiteBuilderPageReviewsForDelete` calls `WbPageAccess.canDeleteAnyPage()` (`WbPermissions.canDelete("page", { createdBy: <current identity> })`) before reading the target or listing reviews, so the answer never reveals whether content has a review in progress (same as R75); item-level `canDelete` still follows on the first in-progress review.
- R87. **Wrapper error contract.** App wrappers return a failed Result for every dependency throw (target reader, access checks, folder permissions); a throw becomes the engine's persistence error type for that use case, never NotAuthorized and never a rejected promise. Engine use cases already return Results.

## Assumptions

Each is the most defensible option found; A24 and A38 change behaviour and were confirmed by the user (2026-10-12).

- A20. The candidate identity (R67, R68) is built like the platform's own background identities (`TaskControl`, `ExecuteScheduledActionUseCase`): `admin`, `canAccessTenant: true`, roles and teams loaded by id. It differs from a real login in three accepted ways: only stored admin users of the current tenant are evaluated (a user found here without roles in this tenant still gets `RolesTeamsAuthorizer`'s parent-tenant fallback, as at login); a custom identity provider's `canAccessTenant` rule is not re-run; roles and teams are the ones synced at the user's last login. API keys are never candidates.
- A21. The api-core change (R49) stays on this branch as two labelled commits at the start of 2.1 (D134 point 6). Without it, `withIdentity` silently reuses the outer identity's permissions and checks inside `withoutAuthorization` always pass, so no "can another user read this" answer can be correct; phase 5's `withIdentity(requester)` around task triggers (D87) has the same dependency.
- A22. "Permanently deleted" means: CMS `EntryAfterDelete` with `permanent: true` (all revisions), `EntryRevisionAfterDelete` (that revision) and `EntryAfterDeleteMultiple` (each entry confirmed gone); WB `PageAfterDelete` (delete from the trash). Trashing keeps the reviews. Trashing or deleting content with an in-progress review is refused (D134, R73), so a trashed target only has finished reviews, which stay readable through the engine and are deleted with the content.
- A23. Phase 2 workflow list wrappers return every workflow of the app without paging (R59).
- A24. The move rule blocks a move, and the trash and delete rules refuse, when any revision of the entry has an in-progress review (R55, R73); D84 speaks of "its review", but location is shared by all revisions. Deleting a single revision checks only that revision. (confirmed 2026-10-12)
- A25. WB page access is WB permissions plus FLP (R47); CMS `AccessControl` does not apply because the page model is private (`authorization: false`). Write and delete include read (R82); the request checks the page permission before loading (R75).
- A26. WB use cases do not catch errors thrown by their before-event handlers (`PublishPageUseCase`, `MovePageUseCase`, `TrashPageUseCase`, `DeletePageUseCase` publish the event outside a `try`), so a blocked WB publish, move, trash or delete rejects the use case's promise with the workflows error; WB tests assert `rejects.toMatchObject({ code })`. The CMS use cases turn the same throw into `Result.fail`. Phase 3 maps the rejections in the WB resolvers and the WB scheduler's publish action. Done in phase 3 (R103).
- A27. The only test that uses a synthesized `api-key` request identity (served by `TestAuthorizer`) is the CMS FLP unit test "does not apply folder-level permissions to API keys" (Task 7); every wrapper-level API-key test uses a real stored key (R79).
- A28. FLP behaviour in tests uses `FakeFolderLevelPermissions` (one copy per test package): FLP is on for `admin` identities only (as the real one), listed folders give the configured levels, unlisted folders give the current identity `owner`, and the decision itself is the real ACO `CanAccessFolderContent` (`viewer` may read but not write or delete). The ACO feature (and its CMS decorators) is not registered in either harness.
- A29. OpenSearch lag (R18) also applies to `GetTargetReviewUseCase`, `ListTargetReviewsUseCase`, `GetBoundWorkflowUseCase`, `DeleteTargetReviewsUseCase` and `CancelTargetReviewsUseCase`: a review or workflow written but not yet indexed can be missed by the save block, the move, trash and delete rules or the cleanup. Accepted like D27 and D15; every listed review is confirmed from primary storage.
- A30. The publish rule accepts any approved active review of the revision, even if it was requested under a workflow that has since been replaced: the approval covers the revision's content (D121's reasoning).
- A31. Deleting target reviews publishes no domain event (D65's audit actions do not include it). Cancelling them for a delete publishes the normal cancelled event with the reason (R85).
- A32. Test storage persists across `createCmsTestHandler` contexts within one test and is reset between tests (the pattern `api-website-builder/__tests__/pages.permissions.own.test.ts` relies on), so tests create data as an admin in one request context and act as a restricted user in another.
- A33. The default `createTestWcpLicense()` enables `advancedPublishingWorkflow` and AACL, so specific `cms.*` permissions are not filtered out by `filterOutCustomWbyAppsPermissions` (the 1b CMS tests already rely on it).
- A34. Orphaned reviews are possible and accepted: a failed cleanup after a permanent delete (R81), and a trash or delete racing a new request. They stay in storage, never lock anything (their target is gone) and are not listed by the app wrappers (their target cannot be read).
- A35. The confirm path is two calls (cancel-for-delete, then trash or delete) and not atomic: if the trash then fails, the review stays cancelled. The user confirmed losing it; a new review can be requested.
- A36. The engine's delete-blocked listing (`listInProgressByWorkflow`) is not capped in v1: a workflow with very many in-progress reviews returns all of them in the error; the wrappers bound their own reads (R76).
- A37. Under `test:os`, "deletes the model once its workflow is gone" (Task 11) depends on the workflow list reflecting the delete right away; if the index lags, report it rather than adding sleeps.
- A38. The bound-workflow lookup itself fails closed: when the workflow list cannot be read, updates, moves, trashes and deletes of every public model and of pages are refused. D134 point 5's "unbound models stay editable during a workflows outage" therefore holds when the review lookup fails, not when the workflow lookup fails. The alternative (an unbound answer on a failed workflow lookup) would let in-review content be edited during such an outage. (confirmed 2026-10-12)
- A39. Two permission-cache limits of the candidate check (R67, R68, 2.1 Task 1). (1) Grandchild tenants: `RolesTeamsAuthorizer`'s parent-tenant fallback looks one level up and only handles a parent that is the root. For a tenant whose parent is not the root, a root admin gets `[]` while the tenant is being installed. Not reachable in this tree (tenants are root children), accepted. (2) Permission cost per tenant: permissions are cached per identity object and tenant, so inside `withEachTenant` and `withTenant` loops the first check in each tenant visited costs one authorizer read for that tenant; code that loops over many tenants and checks permissions in each pays that once per tenant.

## Task order

1. **2.1** first: Task 1 (api-core, two labelled commits) is needed by `CandidateReadAccess` (Task 6) and every `canUserRead` test; `actor` on workflow input (Task 2) changes the engine signature every wrapper calls; Tasks 3, 4, 5 add the engine queries and deletes; Task 5b (cancel reason, `CancelTargetReviews`) needs Task 4's `listByTarget`; Task 6 (port, `CandidateReadAccess`, errors) needs Task 3's `WorkflowBlockingReview`; Task 6b (building blocks) needs Task 6's `ReviewActiveOnTrashAction`.
2. **2.2** next: the CMS package hosts the single CMS handlers, the `CmsEntryReviewNamespace` abstraction the WB package registers into and the helpers it reuses, so it lands before WB. Task 7 (reading and access) before Task 8 (adapter ports use it) before Tasks 9, 10, 10b (handlers need the loader and sync for their engine-driven tests; 10b after 10 because it extends the same hooks feature); Task 11 (model delete guards) is independent and last.
3. **2.3**: CMS workflow wrappers (Task 12), then the review guard with request and get (Task 13), then the transitions (Task 14), then the cancel-for-delete wrapper (Task 14b, uses Task 12's event recorder and Task 14's registration test).
4. **2.4**: WB package wiring and access (Task 15), WB adapter, publish and move (Task 16), WB trash and delete (Task 16b), WB workflow wrappers (Task 17), WB review wrappers (Task 18), WB cancel-for-delete (Task 18b), then docs and comments (Task 19).

Every task leaves all changed packages building and green. 2.4 depends on 2.2 (namespace abstraction, shared helpers) and 2.1, not on 2.3. Tasks with a `b` suffix were added in the review revision; each runs right after the task of the same number.

## File map (end state)

`packages/api-core`: `src/features/security/authorization/AuthorizationContext/{abstractions,AuthorizationContext,feature}.ts` (R49, R69), `src/features/security/IdentityContext/{abstractions,IdentityContext}.ts` (`withAuthorization`); `__tests__/security/withIdentityPermissions.test.ts` (Task 1).

`packages/api-core-testing`: `src/mocks/TestAuthorizer.ts` (`byIdentity`, R70).

`packages/api-headless-cms-testing`: `src/createCmsTestHandler.ts` (`permissionsByIdentity`).

`packages/api-workflows`:
```
src/
  WorkflowsFeature.ts                                       registers Tasks 4-6 features
  domain/
    workflow/types.ts                                       WorkflowBlockingReview (Task 3)
    workflow/errors.ts                                      HasActiveReviews data { count, reviews } (Task 3)
    workflow/isAppWorkflow.ts (Task 6b)
    review/types.ts                                         ReviewWithViewerFlags (Task 6)
    review/errors.ts                                        TargetLocked, PublishBlocked, ActiveReviewOnTrash (Task 6)
    review/facts.ts Review.ts                               cancel reason (Task 5b)
    review/toBlockingReview.ts                              (Task 3)
    review/getDeleteCancelReason.ts                         (Task 6b)
    review/abstractions/ReviewRepository.ts                 listInProgressByWorkflow, listByTarget, delete (Tasks 3-5)
    assignment/abstractions/AssignmentRepository.ts         delete (Task 5)
  features/
    workflow/StoreWorkflow/{abstractions,events,StoreWorkflowUseCase}.ts     actor (Task 2)
    workflow/DeleteWorkflow/{abstractions,events,DeleteWorkflowUseCase}.ts   actor, blocking reviews (Tasks 2, 3)
    workflow/GetBoundWorkflow/                              abstractions, UseCase, feature, index (Task 4)
    workflow/ReadableBlockingReviews/                       abstractions, ReadableBlockingReviewsService, feature, index (Task 6b)
    review/shared/ReviewRepository.ts  review/shared/types.ts (Tasks 3-5, 5b)
    review/CancelReview/CancelReviewUseCase.ts              reason (Task 5b)
    assignment/shared/AssignmentRepository.ts               (Task 5)
    review/GetTargetReview/ ListTargetReviews/ DeleteTargetReviews/ CancelTargetReviews/   (Tasks 4, 5, 5b)
    review/ReviewTargetReadAccess/ abstractions.ts index.ts (Task 6)
    identity/CandidateReadAccess/ abstractions.ts CandidateReadAccess.ts feature.ts index.ts (Task 6)
__tests__/
  __helpers/fixtures.ts (editor actor, Task 2)  __helpers/FakeAdminUsers.ts (Task 6)
  workflow/WorkflowEventActor.test.ts (Task 2)  workflow/DeleteWorkflowWithReviews.test.ts (Task 3)
  review/TargetReviews.test.ts (Task 4)  review/DeleteTargetReviews.test.ts (Task 5)
  review/CancelTargetReviews.test.ts  domain/Review.decisions.test.ts (Task 5b)
  review/adapterErrors.test.ts  identity/CandidateReadAccess.test.ts (Task 6)
  domain/wrapperBuildingBlocks.test.ts (Task 6b)  registration.test.ts (Tasks 4-6)
```

`packages/api-headless-cms-workflows`:
```
ci.config.json (Task 7)
src/
  CmsWorkflowsFeature.ts  domain/errors.ts (Task 11)  utils/appName.ts (Task 7)
  features/
    Workflows/ (existing bindable-model handlers)
    target/ feature.ts  toCmsReviewTarget.ts (Task 7)
            CmsEntryReviewNamespace/ abstractions.ts CmsModelReviewNamespace.ts index.ts
            CmsEntryTargetReader/ abstractions.ts CmsEntryTargetReader.ts index.ts
            CmsEntryAccess/ abstractions.ts CmsEntryAccess.ts index.ts
            CmsEntryReviewTargetLoader.ts CmsEntryReviewTargetSync.ts CmsEntryReviewTargetReadAccess.ts (Task 8)
    hooks/ feature.ts NullReviewStateOnRevisionCreate.ts BlockUpdateWhileInReview.ts (Task 9)
           RequireApprovedReviewOnPublish.ts RequireApprovedReviewOnRepublish.ts
           BlockMoveWhileInReview.ts BlockFolderChangeWhileInReview.ts (Task 10)
           BlockDeleteWhileInReview.ts BlockRevisionDeleteWhileInReview.ts
           BlockDeleteMultipleWhileInReview.ts DeleteReviewsOnEntryDelete.ts
           DeleteReviewsOnRevisionDelete.ts DeleteReviewsOnEntriesDeleteMultiple.ts (Task 10b)
           DeleteModelBoundToWorkflowDecorator.ts
           FullyDeleteModelBoundToWorkflowDecorator.ts
           DeleteModelTaskBoundToWorkflowDecorator.ts (Task 11)
    wrappers/ feature.ts shared/cmsWorkflows.ts  CmsEntryReviewGuardService/ (no feature.ts)
              StoreCmsEntryWorkflow/ DeleteCmsEntryWorkflow/ ListCmsEntryWorkflows/ GetCmsEntryWorkflow/ (Task 12)
              RequestCmsEntryReview/ GetCmsEntryReview/ (Task 13)
              StartCmsEntryReviewStep/ TakeOverCmsEntryReviewStep/ ApproveCmsEntryReviewStep/
              RejectCmsEntryReviewStep/ CancelCmsEntryReview/ (Task 14)
              CancelCmsEntryReviewsForDelete/ (Task 14b)
__tests__/
  __helpers/ identities.ts permissions.ts entries.ts FakeFolderLevelPermissions.ts (Task 7)
             engine.ts FakeAdminUsers.ts (Task 8)  dbModels.ts RecordingDeleteModelOperations.ts (Task 11)
             FakeListUserTeams.ts userContext.ts RecordingEventPublisher.ts (Task 12)
             FakeWbPageTargetLoader.ts (Task 13)
  __workflows/workflow.ts (actor, Task 2)  registration.test.ts (Tasks 14, 14b)
  target/CmsEntryAccess.test.ts (Task 7)  target/CmsEntryAdapter.test.ts (Task 8)
  hooks/revisionAndSaveBlock.test.ts (Task 9)  hooks/publishAndMove.test.ts (Task 10)
  hooks/trashAndDelete.test.ts (Task 10b)  hooks/deleteModel.test.ts  workflows/bindableDbModel.test.ts (Task 11)
  wrappers/workflowWrappers.test.ts (Task 12)  wrappers/requestAndGetReview.test.ts (Task 13)
  wrappers/reviewTransitions.test.ts (Task 14)  wrappers/cancelReviewsForDelete.test.ts (Task 14b)
```

`packages/api-website-builder-workflows`:
```
ci.config.json (Task 15)
src/
  WebsiteBuilderWorkflowsFeature.ts  constants.ts
  features/
    target/ feature.ts WbPageReviewNamespace.ts toWbPageReviewTarget.ts
            WbPageTargetReader/ WbPageAccess/ (Task 15)
            WbPageReviewTargetLoader.ts WbPageReviewTargetSync.ts WbPageReviewTargetReadAccess.ts (Task 16)
    hooks/ feature.ts RequireApprovedReviewOnPagePublish.ts BlockPageMoveWhileInReview.ts (Task 16)
           BlockPageTrashWhileInReview.ts BlockPageDeleteWhileInReview.ts DeleteReviewsOnPageDelete.ts (Task 16b)
    wrappers/ feature.ts shared/wbWorkflows.ts  WbPageReviewGuardService/ (no feature.ts)
              StoreWebsiteBuilderPageWorkflow/ DeleteWebsiteBuilderPageWorkflow/
              ListWebsiteBuilderPageWorkflows/ GetWebsiteBuilderPageWorkflow/ (Task 17)
              RequestWebsiteBuilderPageReview/ GetWebsiteBuilderPageReview/
              StartWebsiteBuilderPageReviewStep/ TakeOverWebsiteBuilderPageReviewStep/
              ApproveWebsiteBuilderPageReviewStep/ RejectWebsiteBuilderPageReviewStep/
              CancelWebsiteBuilderPageReview/ (Task 18)
              CancelWebsiteBuilderPageReviewsForDelete/ (Task 18b)
__tests__/
  __helpers/ handler.ts cmsModel.ts NoopInvalidateAssetCacheTask.ts identities.ts pages.ts
             userContext.ts FakeFolderLevelPermissions.ts FakeListUserTeams.ts (Task 15)
             engine.ts FakeAdminUsers.ts (Task 16)  RecordingEventPublisher.ts (Task 17)
  target/WbPageAccess.test.ts (Task 15)  target/WbPageAdapter.test.ts (Task 16)
  target/WbPageTrashAndDelete.test.ts (Task 16b)
  wrappers/workflowWrappers.test.ts (Task 17)  wrappers/reviewWrappers.test.ts registration.test.ts (Task 18)
  wrappers/cancelReviewsForDelete.test.ts (Task 18b)
```

Wrapper folders contain `abstractions.ts`, `<Name>UseCase.ts`, `feature.ts`, `index.ts`; `index.ts` exports the abstraction and its input type only; the app feature imports `feature.ts` directly. The review guard folders (`CmsEntryReviewGuardService/`, `WbPageReviewGuardService/`) are shared building blocks of their app's wrappers, not wrappers: no `feature.ts`, registered by the app's wrappers feature. Package roots export only the app feature (unchanged).

## Sub-phases

Each sub-phase has its own folder, its own `00-2.N-<slug>.md` overview (the `PLAN_FILE` for superpowers:subagent-driven-development), its own SDD run and final review, and a stop for the user before the next one starts. This file binds all of them; every overview tells the executor to read it first. Task numbers are global (1-19, with 5b, 6b, 10b, 14b, 16b, 18b).

| Sub-phase | Folder | Tasks | Ends with |
|---|---|---|---|
| 2.1 Engine additions | `2.1-engine-additions/` | 1-6b | api-core permission cache per identity and tenant, `withAuthorization`; `actor` on workflow input and events; blocking reviews on the delete error; target review, bound workflow, delete and cancel use cases; cancel reason; `ReviewTargetReadAccess` port, `CandidateReadAccess`, adapter errors; shared wrapper building blocks |
| 2.2 CMS adapter and hooks | `2.2-cms-adapter-and-hooks/` | 7-11 | `cms.*` adapter (read, access, loader, sync, other-user read), single CMS handlers (revision null, save block on bound models), CMS publish and move rules, trash and delete refusal and cleanup, model delete guards (use case and task) |
| 2.3 CMS wrappers | `2.3-cms-wrappers/` | 12-14b | Twelve CMS wrapper use cases with permission, target-access, cross-app, real API-key and cancel-for-delete tests |
| 2.4 WB adapter and wrappers | `2.4-wb-adapter-and-wrappers/` | 15-19 | `wb.page` adapter and handlers (incl. trash and delete), twelve WB wrapper use cases, docs aligned |

Executing a sub-phase: pass its overview as `PLAN_FILE` and give each task file to `task-brief` with an explicit output path, e.g. `task-brief docs/.bruno/plans/2026-10-11-workflows-phase-2/2.1-engine-additions/task-01-permission-cache-per-identity.md 1 <workspace>/task-1-brief.md`. Reviewers get this file's Global Constraints, the rulings relevant to the task, `../2026-10-09-workflows-phase-1a/00-shared.md` R6, R16, R18, R23, R28 and `../2026-10-10-workflows-phase-1b/00-1b-permission-building-blocks.md` R38, R41, R42, plus D132, D133 and D134.

## Old code to delete

Verified against `b3a538a556`: the duplicated CMS/WB entry and page handlers were removed in 1a Task 1. What remained: `createWorkflowAppName` in `api-headless-cms-workflows/src/utils/appName.ts` (no importer; removed in Task 7; the file stays with the `cms.*` namespace helpers) and a stale comment in `api-website-builder/src/features/experiments/EndExperimentOnPublish/EndExperimentOnPublishHandler.ts` naming the deleted `ValidateWorkflowStateOnPageBeforePublish` (Task 19). Nothing in `api-headless-cms` clears `system.workflow` on publish any more (D85 holds).

---

## Self-review

### Spec coverage

| Spec requirement | Where |
|---|---|
| 4.5 `system.workflow` written only through `UpdateEntrySystemUseCase` under `withoutAuthorization` (D52) | Task 8 (CMS sync), Task 16 (WB sync), R63 |
| 4.5 / 9.2 nulled on every new revision by one handler (D59) | Task 9 (`NullReviewStateOnRevisionCreate`), Task 16 test for pages |
| 5.1 engine vs wrapper: request needs write access (D77) | Tasks 13, 18 |
| 5.1 start, take over, approve, reject need read access | Tasks 14, 18 (`it.each` refusals) |
| 5.1 cancel: requester or `reassign`, and read access (D133 point 7); state errors stay the engine's (1b R41) | Tasks 14, 18 |
| 5.1 API keys act as `user` actors with `identityType: "api-key"` (D133 point 5) | Tasks 14, 18 (real stored key, R79) |
| 5.1 picks lenient at submit; `canPick` = write access + `canPickReviewer` | R61, Tasks 13, 18 |
| 5.1 / D79 publish requires an approved review on bound models; fail closed; create as published allowed (D134 point 2) | Tasks 10, 16 (R53, R83) |
| 5.1 / D121 republish of an unpublished approved revision | Tasks 10, 16 |
| 5.1 / D134 trash and delete refused while a review is in progress; confirm cancels as the trashing user | Task 5b (cancel reason), Tasks 10b, 16b (refusal, fail closed), Tasks 14b, 18b (confirm path, permission checked before any review is read, R86), R73, R74, R86 |
| 5.3 viewer flags AND target read access | Tasks 13, 18 (`GetCmsEntryReview`, `GetWebsiteBuilderPageReview`, R62) |
| 4.1 / D131 store passes `savedOn`; per-app store mutation (D132) | Tasks 12, 17 |
| 4.1 / D115 delete-blocked: engine count + blocking reviews; wrapper keeps 5 readable | Task 3 (engine), Task 6b (building block), Tasks 12, 17 (R57, R76) |
| 8 store and delete need `editor`; list and get any authenticated user (D78) | Tasks 12, 17 (R60) |
| 8 each app checks its own model, folder and content permissions (D133) | Tasks 7, 15 (R47, R72, R82) |
| 9.2 `EntryBeforeUpdate` save block incl. approved revisions (D62, D80), bound models only (D134 point 5); sync exempt | Task 9 (R54, R84) |
| 9.2 `DeleteModelUseCase` decorator → `Workflows/Model/BoundToWorkflow` (D41, D64); "fully delete model" task refused at start (D134 point 4) | Task 11 (R64) |
| 9.2 adapters for other CMS events match namespace and model explicitly | Tasks 10, 10b, 16, 16b (R51, R52) |
| 9.3 load target revision, typed `TargetContext` | Tasks 8, 16 (R66) |
| 9.3 move blocked only while in progress (D84) | Tasks 10, 16 (R55) |
| 9.3 delete the review when the target is permanently deleted (incl. assignment log, 4.3) | Task 5 (engine), Tasks 10b, 16b (R56, R81) |
| 9.3 / D61 / D133 `canUserRead(userId, target)` per adapter | Task 1 (api-core), Task 6 (port, `CandidateReadAccess`), Tasks 8, 16 (R48, R50, R67-R72) |
| D133 point 1: nothing crosses apps | Tasks 12-14b, 17-18b (R46) |
| 1a R26 / 1b R39: `actor` on workflow input and events | Task 2 (R58), Tasks 12, 17 tests (R80) |
| 1b carry-over: DB-model no-access test for the bindable check | Task 11 (`bindableDbModel.test.ts`) |
| 1b carry-over: API-key actor end-to-end | Tasks 14, 18 (R79) |
| D134 point 6: api-core change on this branch, labelled commits, wide test run | Task 1 |
| Roadmap: delete the old duplicated CMS/WB handlers | Already done in 1a Task 1; leftovers in Tasks 7, 19 |

### Not in this phase

- GraphQL for every wrapper (incl. `cancelCmsEntryReviewsForDelete` / `cancelWebsiteBuilderPageReviewsForDelete`), mapping the WB use cases' rejected promises (A26) in the WB resolvers and the WB scheduler's publish action, the shared configuration operations (settings, `listUsers`, step types, transports), `getTargetReview` per app, review lists with filters, row flags, folder filter predicate and pagination (D47, D76, D94, D112, D119), redaction of assignment details in the get-review wrappers (D89, D127), store conflict/not-found error shape, title and comment length validation (D100), the CMS editor model list (D116) (3).
- Routing: candidates' read access through `ReviewTargetReadAccess` (the port and implementations land here), rules, strategies, exclusions, picks validated on step reached, reassign transition and wrappers, `listStepCandidates`, `inspectRouting`, `folderExists` (4). Done in phase 4.
- Automation bypass context for the save block, task triggers under `withIdentity(requester)` (D87), restart wrappers (5); AI tools `readTarget` / `updateTargetFields` per adapter (6); notifications, incl. using the cancel reason (7); admin, incl. the trash and delete warning dialog flow (UI brief 6) (8a-9c).

## Review findings not applied

From the four-part review of this plan (2026-10-12); every other finding is applied in the task files.

- 2.2 Critical, block creating content with `status: "published"` on bound models: not applied; D134 point 2 keeps it allowed (data transfer), R83 and a Task 10 test pin it.
- 2.2 Minor, a folder change through the update input of a revision not under review while another revision is in review: not applied; it needs the update payload's new location in the save block and the admin never sends a location on update; phase 3 added no update inputs, so this stays open for the admin phase (8a) or the phase that adds update inputs.
- 2.2 Minor, `system.workflow` can be set through `input.system` by backend callers: not applied; only trusted backend code can do it (the GraphQL inputs have no `system`) and no rule reads `system.workflow` (R53).
- 2.3 Important, a missing target reported as `Workflows/NotAuthorized` by the review guards: not applied as a distinct error; with D134 a target cannot reach the trash with a review in progress, and reporting "not authorized" for an unreadable or missing target does not reveal whether it exists.
- 2.3 Minor, each review action loads the review twice (guard and engine): not changed; both are primary-storage gets, noted in the guard doc.
- 2.1 Minor, cap the engine's blocking-review list: not applied; the count needs the full walk anyway and the wrappers cap their reads (A36, R76).
- 2.1 Question on the cache key (fingerprint vs. object): decided by R69 (object and tenant), so the fingerprint fix is not applied.
