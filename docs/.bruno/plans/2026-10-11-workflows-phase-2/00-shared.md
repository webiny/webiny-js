# Workflows Phase 2: Target Adapters, App Wrappers and CMS Hooks

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the phase 1a engine usable by the two apps. Each app (Headless CMS, Website Builder) gets its target adapter (load, `system.workflow` sync, read access for another user, publish, move and delete rules) and its wrapper use cases, which read the identity, check the `workflows` permission and target access, then call the internal api-workflows use cases (D132, D133). One set of CMS entry handlers covers CMS entries and Website Builder pages: `system.workflow = null` on a new revision (D59), the save block (D62, D80) and the model delete block (D41, D64). No GraphQL (phase 3).

**Architecture:** Four layers, built bottom up.

1. **Engine additions** (`packages/api-workflows`, 2.1): `actor` on the workflow store and delete input and events (1a R26, 1b R39); the delete-blocked error carries every blocking review (D115, R57); `GetTargetReview`, `ListTargetReviews` and `DeleteTargetReviews` use cases for the adapters; a `ReviewTargetAccess` port (`canUserRead(userId, target)`) next to `ReviewTargetLoader` and `ReviewTargetSync` (R50); a `RunAsUser` building block; shared adapter errors. One platform fix lands first: api-core caches permissions per identity, so `IdentityContext.withIdentity` evaluates the other user's permissions (R49).
2. **CMS adapter and hooks** (`packages/api-headless-cms-workflows`, 2.2): CMS target reading and access checks with the app's real logic (`AccessControl.canAccessEntry` with the entry, plus folder-level permissions), the `cms.*` adapter (loader, sync, read access for another user), the single CMS entry handlers and the `DeleteModelUseCase` decorator.
3. **CMS wrappers** (2.3): eleven wrapper use cases, each `CurrentReviewViewer` → permission and target checks → engine use case.
4. **Website Builder adapter and wrappers** (`packages/api-website-builder-workflows`, 2.4): the `wb.page` adapter on the Website Builder page events, its namespace registration for the single CMS handlers, and eleven WB wrapper use cases.

**Tech Stack:** TypeScript, `@webiny/feature` DI (`createFeature`, `createAbstraction`, `createImplementation`, `createDecorator`), `@webiny/di`, `IdentityContext` / `AuthorizationContext` from `@webiny/api-core`, CMS use cases and events from `@webiny/api-headless-cms`, `FolderLevelPermissions` from `@webiny/api-aco`, `WbPermissions` and page events from `@webiny/api-website-builder`, `BaseError` / `Result` from `@webiny/feature/api`, vitest, `@webiny/api-headless-cms-testing` (`createCmsTestHandler`).

**Spec:** `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` sections 4.5, 5.1 (engine vs wrapper columns), 5.3, 8, 9.2, 9.3, 11 (only the target-read predicate idea, used here for the delete-blocked listing). Decisions: `docs/.bruno/workflows/decisions.md` D41, D52, D59, D61, D62, D64, D77, D79, D80, D84, D115, D121, D131, D132, D133. Roadmap: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` (phase 2 row and cross-phase rules). Earlier rules keep applying: `../2026-10-09-workflows-phase-1a/00-shared.md` (R1-R28, A1-A12) and `../2026-10-10-workflows-phase-1b/00-1b-permission-building-blocks.md` (R29-R44, A13-A19). This plan continues with R45-R66 and A20-A33.

## Global Constraints

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
  - `packages/api-core`: `["ddb", "sql,ddb"]` → `yarn test` and `yarn test:sql`.
  - `packages/api-headless-cms-workflows` and `packages/api-website-builder-workflows`: no `ci.config.json` → `yarn test` only (default storage). Workflows assume OpenSearch (D63), so also run `yarn test:os` on them; record "not run" if OpenSearch is not available locally (A9).
  - OpenSearch is not available locally: run `yarn test:os` anyway, and if it cannot run, record "not run" in the task report and leave it to CI (A9).
- Type-check tests after a signature change that tests call: `yarn check:test:types -p <folder> --report cli 2>&1 | tail -40` (folder name, e.g. `api-workflows`).
- Use CodeGraph (`codegraph explore "<symbols>"`) before reading files to confirm symbols and import paths.
- New package dependencies are allowed only where this file's R65 lists them; `yarn adio` must pass after each.

## Review Focus

1. **A wrapper acts without target read access** (spec 5.1, D133 point 7). Every review action (start, take over, approve, reject, cancel, get review) needs read access to the target; request needs write access (D77). Pinned per app by the `it.each` tests "refuses <action> without read access to the target" (Tasks 14, 18) and "refuses a request without write access" (Tasks 13, 18).
2. **Cancel by a non-requester without `reassign`** (D25, D54, 1b R41). Pinned by "refuses cancel by a non-requester without reassign" and "lets a reassigner with read access cancel" (Tasks 14, 18). A finished review must fail with the engine's `Workflows/Review/InvalidState`, not "not authorized" (1b R41): "reports a state error, not a permission error, for a finished review".
3. **A CMS handler acts on the wrong app or recurses on the workflows' own models** (D59, R51, R52). WB pages are CMS entries, and the workflow, review and assignment models are private CMS models whose entries also fire CMS entry events. Pinned by Task 7 "resolves no namespace for the workflows' private models", Task 9 "does not block saving workflows and reviews", Task 10 "ignores Website Builder pages" and Task 16 "blocks updates to a page under review through the CMS save block".
4. **Publish without an approved review on a bound model** (D79, D121). Fail closed on lookup errors; never trust `system.workflow` (writable through the update input). Pinned by Task 10 and Task 16: "blocks publishing without a review", "blocks publishing while the review is in progress", "publishes an approved revision", "republishes an approved revision after unpublishing (D121)", "publishes normally on a model without a workflow", "blocks publishing when the workflow lookup fails".
5. **Another user's read access computed with the caller's permissions** (D61, D133, R48, R49). `withIdentity` used to return the outer identity's cached permissions. Pinned by Task 1 "loads the permissions of the identity set by withIdentity", Task 6 "runs the callback as the given user", Task 8 / Task 16 "answers read access for another user with that user's permissions".
6. **A model read under another identity or without authorization** (A19). Adapters read the CMS model as the current identity before `RunAsUser` or `withoutAuthorization`. Review by reading `CmsEntryReviewTargetSync`, `CmsEntryReviewTargetAccess`, `WbPageReviewTargetSync`, `WbPageReviewTargetAccess`.
7. **Orphaned reviews and assignment records after a permanent delete** (spec 9.3, R56). Pinned by Task 5 "deletes a target's reviews and their assignment records", Task 10 "deletes the reviews of a permanently deleted entry", "keeps reviews of a trashed entry", "deletes the reviews of a deleted revision", Task 16 "deletes the reviews of a deleted page".
8. **Delete-blocked listing leaks unreadable reviews** (D115, R57). Pinned by Task 12 / Task 17 "lists at most five readable blocking reviews and keeps the exact count".
9. **Cross-app access** (D133 point 1, R46). A CMS wrapper must not read, act on or rebind a WB workflow or review, and the reverse. Pinned by "reports a Website Builder review as not found", "does not rebind a Website Builder workflow" (Tasks 12-14) and the WB mirrors (Tasks 17, 18).

## Rulings

Binding for this plan. Where they refine the spec, the ruling wins for phase 2.

- R45. **Wrapper names.** CMS (`packages/api-headless-cms-workflows`): `StoreCmsEntryWorkflowUseCase`, `DeleteCmsEntryWorkflowUseCase`, `ListCmsEntryWorkflowsUseCase`, `GetCmsEntryWorkflowUseCase`, `RequestCmsEntryReviewUseCase`, `GetCmsEntryReviewUseCase`, `StartCmsEntryReviewStepUseCase`, `TakeOverCmsEntryReviewStepUseCase`, `ApproveCmsEntryReviewStepUseCase`, `RejectCmsEntryReviewStepUseCase`, `CancelCmsEntryReviewUseCase`. Website Builder (`packages/api-website-builder-workflows`): `StoreWebsiteBuilderPageWorkflowUseCase`, `DeleteWebsiteBuilderPageWorkflowUseCase`, `ListWebsiteBuilderPageWorkflowsUseCase`, `GetWebsiteBuilderPageWorkflowUseCase`, `RequestWebsiteBuilderPageReviewUseCase`, `GetWebsiteBuilderPageReviewUseCase`, `StartWebsiteBuilderPageReviewStepUseCase`, `TakeOverWebsiteBuilderPageReviewStepUseCase`, `ApproveWebsiteBuilderPageReviewStepUseCase`, `RejectWebsiteBuilderPageReviewStepUseCase`, `CancelWebsiteBuilderPageReviewUseCase`. Phase 3 names its GraphQL operations after them (`storeWebsiteBuilderPageWorkflow`, `storeCmsEntryWorkflow`, ...).
- R46. **Each app owns its namespaces** (D133 point 1). CMS wrappers accept only `cms.<modelId>`, WB wrappers only `wb.page`. A workflow or review of the other app is reported as not found (`Workflows/Workflow/NotFound`, `Workflows/Review/NotFound`); a request for another app's model fails with `Workflows/Review/TargetNotFound`; storing a workflow whose `models` are not the app's fails with `Workflows/Workflow/Validation`, and storing over the id of another app's workflow fails with `Workflows/Workflow/NotFound` (no rebinding across apps).
- R47. **Target access for the current user is the app's real logic.** CMS (`CmsEntryAccess`): `AccessControl.canAccessEntry({ model, entry, rwd })` (model, group, entry and own permissions) AND folder-level permissions on the entry's folder (`FolderLevelPermissions.getFolderLevelPermissions` + `canAccessFolderContent` with the same `rwd`, skipped for the root folder or when FLP is not in use), mirroring `GetEntryByIdWithFlpDecorator` and `UpdateEntryWithFlpDecorator`. WB (`WbPageAccess`): read = `WbPermissions.canRead("page") && WbPermissions.canAccess("page", page)` (as `GetPageByIdUseCase`), write = `WbPermissions.canEdit("page", page)` (as `UpdatePageUseCase`), each AND the same FLP check (pages are CMS entries and the ACO CMS decorators apply to them). Read for every review action and get review; write for request (D77). The model or page revision is read with `GetModelUseCase` / `PageModelProvider` and `GetRevisionByIdUseCase` as the current identity; a model the user cannot read makes the target unreadable.
- R48. **Another user's read access** (`canUserRead`, D61, D133 point 4a). The adapter reads the model and revision as the current identity, then evaluates its own current-user read check inside `RunAsUser.run(userId, ...)`, which runs the callback under `IdentityContext.withIdentity` with an `admin` identity for that user id (A20). Nothing reads a model as the other user (A19).
- R49. **api-core caches permissions per identity.** `AuthorizationContext.loadPermissions(identity)` caches by `identity.type` + `identity.id` instead of one slot per request, so `withIdentity` returns the right permissions and cannot poison the outer identity's cache. `clearPermissionsCache()` clears all entries. The test harness gains per-identity permissions: `TestPermissionsHolder.byIdentity` (api-core-testing) and `CmsTestHandlerParams.permissionsByIdentity` (api-headless-cms-testing).
- R50. **`ReviewTargetAccess` port** lives in `api-workflows/src/features/review/ReviewTargetAccess/` beside `ReviewTargetLoader` and `ReviewTargetSync`: `canAccess(model)` + `canUserRead({ userId, model, targetId, targetRevisionId })`. One implementation per namespace, last registered match wins, no match means no access (fail closed). Phase 4 (routing, reassign) consumes it; phase 2 only registers the implementations and tests them directly. The engine never calls it for the caller (the caller's checks are the wrappers').
- R51. **One namespace resolver for the single CMS handlers.** `CmsEntryReviewNamespace` (in `api-headless-cms-workflows`, resolved `multiple`) maps a CMS model to its review namespace; the last registered non-null answer wins. The CMS package registers `CmsModelReviewNamespace` (non-private model → `cms.<modelId>`, private → `null`); the WB package registers `WbPageReviewNamespace` (`PAGE_MODEL_ID` → `wb.page`). Handlers skip models with no namespace, which covers the workflows' own private models (no recursion when the engine saves reviews) and every other private model.
- R52. **Adapter handlers match their namespace explicitly** (D59, spec 9.2). The three single handlers (revision create, save block, model delete) use R51. The publish, move and delete rules are adapter handlers: the CMS adapter listens to CMS entry events and acts only on non-private models (`cms.*`); the WB adapter listens to the WB page events (`PageBeforePublish`, `PageBeforeMove`, `PageAfterDelete`), because WB `MovePage` bypasses `MoveEntryUseCase` (it calls `MoveEntryRepository`) and WB `DeletePage` is the permanent delete of a trashed page.
- R53. **Publish rule** (D79, D121). If a workflow is bound to the namespace (`ListWorkflowsUseCase`, `models_in: [namespace]`, `limit: 1`), publishing the revision needs its active review in state `approved` (`GetTargetReviewUseCase`); otherwise `Workflows/Review/PublishBlocked`. A failed lookup throws the lookup error (fail closed). `system.workflow` is never read: it is writable through the CMS and WB update inputs. Republishing an unpublished approved revision passes because approved reviews stay active (D23).
- R54. **Save block** (D62, D80). An update of a revision with any active review (in progress, approved or rejected) fails with `Workflows/Review/TargetLocked` (`action: "update"`). A failed lookup throws (fail closed). `UpdateEntrySystemUseCase` does not publish `EntryBeforeUpdate`, so the sync is exempt; the automation bypass context is phase 5.
- R55. **Move rule** (D84). A move is entry-level (all revisions share `location`), so it is blocked while any revision of the target has an `inProgress` review (`ListTargetReviewsUseCase`), with `Workflows/Review/TargetLocked` (`action: "move"`). Approved, rejected and cancelled reviews do not block.
- R56. **Permanent delete** (spec 9.3). CMS: `EntryAfterDelete` with `permanent: true` deletes every review of the entry; `EntryRevisionAfterDelete` deletes the reviews of that revision; moving to the trash (`permanent: false`) keeps them (the entry can be restored). WB: `PageAfterDelete` (delete from the trash) deletes every review of the page. `DeleteTargetReviewsUseCase` deletes each review's assignment-log records first (paged by `reviewId`, R23), then the review. A failure is thrown from the after-delete handler (the target stays deleted; the caller sees the error).
- R57. **D115 lands in phase 2** (the roadmap lists it under phase 3; the wrapper delete is built here, so its listing is too). The engine's `Workflows/Workflow/HasActiveReviews` carries `{ count, reviews }` with every in-progress review as a `WorkflowBlockingReview` (review id, model, target id, revision id, title, step position, step count, step name). The app's delete wrapper keeps the first 5 the caller can read (R47) and returns the same error class with the exact count.
- R58. **`actor` on workflow input and events** (1a R26, 1b R39). `StoreWorkflowInput.actor` and `DeleteWorkflowInput.actor` are required `Actor`s; all six workflow events carry `actor` in their payload.
- R59. **Per-app workflow list.** WB lists `models_in: ["wb.page"]`. CMS cannot express "every `cms.*` model" with the CMS where-filters, so `ListCmsEntryWorkflowsUseCase` pages through the engine list (`limit: 100`) and keeps workflows whose every model is `cms.*`. Neither wrapper pages in phase 2 (v1 binds one model per workflow, so the list is at most the model count); phase 3 adds paging if it needs it (A23).
- R60. **Workflow store and delete need `editor`** (`WorkflowsPermissions.canEdit()`, full access included); list and get need only an authenticated identity (D78). The store wrapper passes the loaded `savedOn` through (D131).
- R61. **Picks.** The wrapper does not re-validate picks: write access to the target (D77) is the only wrapper condition for `canPick` (spec 5.3), and the engine's `Review.request` already rejects malformed picks with `canPickReviewer` (1b R35). Pinned through the wrapper by "rejects a pick on a step without manual picks".
- R62. **Get review** returns `ReviewWithViewerFlags { review, flags }` with `flags = applyTargetAccess(getReviewViewerFlags(review, viewer), { canRead: true })`. Without read access it fails with `Workflows/NotAuthorized` instead of returning all-false flags (the review content itself needs read access).
- R63. **Sync** (D52). Each adapter's `ReviewTargetSync` reads the model as the current identity, then runs `UpdateEntrySystemUseCase` inside `withoutAuthorization` (reviewers need only read access). Failures are returned as a failed `Result` (R16).
- R64. **Model delete decorator** (D41, D64). `DeleteModelBoundToWorkflowDecorator` on `DeleteModelUseCase` returns `Workflows/Model/BoundToWorkflow` (data: `modelId`, bound workflows `{ id, name }`) before the decorated chain runs, so `DeleteModelWithEntryCleanup` never deletes singleton entries of a bound model. The error type joins `IDeleteModelUseCaseErrors` through module augmentation (precedent: `api-workflows/src/types.ts`).
- R65. **Dependencies.** `api-headless-cms-workflows`: `@webiny/api-aco` moves from `devDependencies` to `dependencies` (runtime `FolderLevelPermissions`). `api-website-builder-workflows`: add `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows` (namespace registration, R51) and `@webiny/api-aco` to `dependencies`, move `@webiny/api-headless-cms` from `devDependencies` to `dependencies`; add `@webiny/background-tasks`, `@webiny/languages`, `@webiny/wcp`, `@webiny/di` to `devDependencies` (test harness). `api-headless-cms-testing` and `api-core-testing` need none.
- R66. **`TargetContext`** (spec 9.3). `folder` is `null` for the root folder or no location, otherwise `{ id, type }` with type `cms:<modelId>` or `wb:page`; `modelId` is the CMS model id (`article`, `wbyWbPage`); `title` is `getEntryTitle(model, entry)` for CMS and `properties.title` for pages; `author` is the revision's `createdBy` `{ id, displayName }`.

## Assumptions

Each is the most defensible option found; the ones marked **NEEDS USER CONFIRMATION** change behaviour or scope and are listed in the handoff.

- A20. **NEEDS USER CONFIRMATION.** `RunAsUser` builds the other user's identity from the user id alone: `new AuthenticatedIdentity({ id, displayName: id, type: "admin", context: { canAccessTenant: true } })`. Candidates are team members of the current tenant (phase 4), so tenant access is assumed; the authorizers (`RolesTeamsAuthorizer`) load the user's roles and teams by id, and FLP evaluates folder access for that id. An unknown id gets no permissions (no access). API keys are never candidates.
- A21. **NEEDS USER CONFIRMATION.** Phase 2 changes api-core (`AuthorizationContext` cache per identity, R49) and the two testing packages. Without it, `withIdentity` silently reuses the outer identity's permissions, so no "can another user read this" answer can be correct; phase 5's `withIdentity(requester)` around task triggers (D87) has the same dependency.
- A22. **NEEDS USER CONFIRMATION.** "Permanently deleted" means: CMS `EntryAfterDelete` with `permanent: true` (all revisions) and `EntryRevisionAfterDelete` (that revision); moving to the trash keeps the reviews; WB `PageAfterDelete` (delete from the trash). Trashing an entry or page with an in-progress review is not blocked (no decision covers it).
- A23. **NEEDS USER CONFIRMATION.** Phase 2 workflow list wrappers return every workflow of the app without paging (R59).
- A24. **NEEDS USER CONFIRMATION.** The move rule blocks a move when any revision of the target has an in-progress review (R55); D84 speaks of "its review", but location is shared by all revisions.
- A25. **NEEDS USER CONFIRMATION.** WB page access is WB permissions plus FLP (R47); CMS `AccessControl` does not apply because the page model is private (`authorization: false`).
- A26. WB use cases do not catch errors thrown by their before-event handlers (`PublishPageUseCase`, `MovePageUseCase` publish the event outside a `try`), so a blocked WB publish or move rejects the use case's promise with the workflows error; WB tests assert `rejects.toMatchObject({ code })`. The CMS use cases turn the same throw into `Result.fail`.
- A27. The "real API-key identity" test runs the request as `{ id: "api-key-1", type: "api-key", displayName: "CI key", permissions: [...] }` through `createCmsTestHandler` with `permissions: []`, so the real `TestAuthenticator` → `IdentityContext` path builds the identity and `TestAuthorizer` returns the key's embedded permissions (it mirrors `ApiKeyAuthorization`). No stored API key or token is involved.
- A28. FLP behaviour in tests uses `FakeFolderLevelPermissions` (one copy per test package): FLP is on for `admin` identities only (as the real one), listed folders give the configured levels, unlisted folders give the current identity `owner`, and the decision itself is the real ACO `CanAccessFolderContent`. The ACO feature (and its CMS decorators) is not registered in either harness.
- A29. OpenSearch lag (R18) also applies to `GetTargetReviewUseCase`, `ListTargetReviewsUseCase` and `DeleteTargetReviewsUseCase`: a review written but not yet indexed can be missed by the save block, the move rule or the delete cleanup. Accepted like D27 and D15; every listed hit is confirmed from primary storage.
- A30. The publish rule accepts any approved active review of the revision, even if it was requested under a workflow that has since been replaced: the approval covers the revision's content (D121's reasoning).
- A31. Deleting target reviews publishes no domain event (D65's audit actions do not include it).
- A32. Test storage persists across `createCmsTestHandler` contexts within one test and is reset between tests (the pattern `api-website-builder/__tests__/pages.permissions.own.test.ts` relies on), so tests create data as an admin in one request context and act as a restricted user in another.
- A33. The default `createTestWcpLicense()` enables `advancedPublishingWorkflow` and AACL, so specific `cms.*` permissions are not filtered out by `filterOutCustomWbyAppsPermissions` (the 1b CMS tests already rely on it).

## Task order

1. **2.1** first: api-core's per-identity permission cache (Task 1) is needed by `RunAsUser` (Task 6) and every `canUserRead` test; `actor` on workflow input (Task 2) changes the engine signature every wrapper calls; Tasks 3-6 add the engine pieces the adapters and wrappers call.
2. **2.2** next: the CMS package hosts the single CMS handlers and the `CmsEntryReviewNamespace` abstraction the WB package registers into, so it lands before WB. Task 7 (reading and access) before Task 8 (adapter ports use it) before Tasks 9-10 (handlers need the loader and sync for their engine-driven tests); Task 11 (model delete) is independent and last.
3. **2.3**: CMS workflow wrappers (Task 12), then the review guard with request and get (Task 13), then the transitions (Task 14).
4. **2.4**: WB package wiring and access (Task 15), WB adapter and handlers (Task 16), WB workflow wrappers (Task 17), WB review wrappers (Task 18), then docs and comments (Task 19).

Every task leaves all changed packages building and green. 2.4 depends on 2.2 (namespace abstraction) and 2.1, not on 2.3.

## File map (end state)

`packages/api-core`: `src/features/security/authorization/AuthorizationContext/AuthorizationContext.ts` (R49); `__tests__/security/withIdentityPermissions.test.ts`.

`packages/api-core-testing`: `src/mocks/TestAuthorizer.ts` (`byIdentity`).

`packages/api-headless-cms-testing`: `src/createCmsTestHandler.ts` (`permissionsByIdentity`).

`packages/api-workflows`:
```
src/
  WorkflowsFeature.ts                                       registers Tasks 4-6 features
  domain/
    workflow/types.ts                                       WorkflowBlockingReview (Task 3)
    workflow/errors.ts                                      HasActiveReviews data { count, reviews } (Task 3)
    review/types.ts                                         ReviewWithViewerFlags (Task 6)
    review/errors.ts                                        ReviewTargetLockedError, ReviewPublishBlockedError (Task 6)
    review/toBlockingReview.ts                              (Task 3)
    review/abstractions/ReviewRepository.ts                 listInProgressByWorkflow, listByTarget, delete (Tasks 3-5)
    assignment/abstractions/AssignmentRepository.ts         delete (Task 5)
  features/
    workflow/StoreWorkflow/{abstractions,events,StoreWorkflowUseCase}.ts     actor (Task 2)
    workflow/DeleteWorkflow/{abstractions,events,DeleteWorkflowUseCase}.ts   actor, blocking reviews (Tasks 2, 3)
    review/shared/ReviewRepository.ts                       (Tasks 3-5)
    assignment/shared/AssignmentRepository.ts               (Task 5)
    review/GetTargetReview/ ListTargetReviews/ DeleteTargetReviews/   abstractions, UseCase, feature, index (Tasks 4, 5)
    review/ReviewTargetAccess/ abstractions.ts index.ts     (Task 6)
    identity/RunAsUser/ abstractions.ts RunAsUser.ts feature.ts index.ts (Task 6)
__tests__/
  __helpers/fixtures.ts                                     editor actor (Task 2)
  workflow/WorkflowEventActor.test.ts (Task 2)  workflow/DeleteWorkflowWithReviews.test.ts (Task 3)
  review/TargetReviews.test.ts (Task 4)  review/DeleteTargetReviews.test.ts (Task 5)
  review/adapterErrors.test.ts  identity/RunAsUser.test.ts (Task 6)  registration.test.ts (Tasks 4-6)
```

`packages/api-headless-cms-workflows`:
```
src/
  CmsWorkflowsFeature.ts  constants.ts  domain/errors.ts (Task 11)  utils/appName.ts (Task 7)
  features/
    Workflows/ (existing bindable-model handlers)
    target/ feature.ts  toCmsReviewTarget.ts
            CmsEntryReviewNamespace/ abstractions.ts CmsModelReviewNamespace.ts resolveReviewNamespace.ts index.ts
            CmsEntryTargetReader/ abstractions.ts CmsEntryTargetReader.ts index.ts
            CmsEntryAccess/ abstractions.ts CmsEntryAccess.ts index.ts
            CmsEntryReviewTargetLoader.ts CmsEntryReviewTargetSync.ts CmsEntryReviewTargetAccess.ts (Task 8)
    hooks/ feature.ts NullReviewStateOnRevisionCreate.ts BlockUpdateWhileInReview.ts (Task 9)
           RequireApprovedReviewOnPublish.ts BlockMoveWhileInReview.ts
           DeleteReviewsOnEntryDelete.ts DeleteReviewsOnRevisionDelete.ts (Task 10)
           DeleteModelBoundToWorkflowDecorator.ts (Task 11)
    wrappers/ shared/cmsWorkflows.ts  CmsEntryReviewGuard/
              StoreCmsEntryWorkflow/ DeleteCmsEntryWorkflow/ ListCmsEntryWorkflows/ GetCmsEntryWorkflow/ (Task 12)
              RequestCmsEntryReview/ GetCmsEntryReview/ (Task 13)
              StartCmsEntryReviewStep/ TakeOverCmsEntryReviewStep/ ApproveCmsEntryReviewStep/
              RejectCmsEntryReviewStep/ CancelCmsEntryReview/ (Task 14)
__tests__/
  __helpers/ identities.ts permissions.ts entries.ts FakeFolderLevelPermissions.ts (Task 7)
             engine.ts (Task 8)  dbModels.ts (Task 11)  FakeListUserTeams.ts userContext.ts (Task 12)
             FakeWbPageTargetLoader.ts (Task 13)
  __workflows/workflow.ts (actor, Task 2)  registration.test.ts (Task 14)
  target/CmsEntryAccess.test.ts (Task 7)  target/CmsEntryAdapter.test.ts (Task 8)
  hooks/revisionAndSaveBlock.test.ts (Task 9)  hooks/publishMoveDelete.test.ts (Task 10)
  hooks/deleteModel.test.ts  workflows/bindableDbModel.test.ts (Task 11)
  wrappers/workflowWrappers.test.ts (Task 12)  wrappers/requestAndGetReview.test.ts (Task 13)
  wrappers/reviewTransitions.test.ts (Task 14)
```

`packages/api-website-builder-workflows`:
```
src/
  WebsiteBuilderWorkflowsFeature.ts  constants.ts
  features/
    target/ feature.ts WbPageReviewNamespace.ts toWbPageReviewTarget.ts
            WbPageTargetReader/ WbPageAccess/ (Task 15)
            WbPageReviewTargetLoader.ts WbPageReviewTargetSync.ts WbPageReviewTargetAccess.ts (Task 16)
    hooks/ feature.ts RequireApprovedReviewOnPagePublish.ts BlockPageMoveWhileInReview.ts
           DeleteReviewsOnPageDelete.ts (Task 16)
    wrappers/ shared/wbWorkflows.ts  WbPageReviewGuard/
              StoreWebsiteBuilderPageWorkflow/ DeleteWebsiteBuilderPageWorkflow/
              ListWebsiteBuilderPageWorkflows/ GetWebsiteBuilderPageWorkflow/ (Task 17)
              RequestWebsiteBuilderPageReview/ GetWebsiteBuilderPageReview/
              StartWebsiteBuilderPageReviewStep/ TakeOverWebsiteBuilderPageReviewStep/
              ApproveWebsiteBuilderPageReviewStep/ RejectWebsiteBuilderPageReviewStep/
              CancelWebsiteBuilderPageReview/ (Task 18)
__tests__/
  __helpers/ handler.ts cmsModel.ts NoopInvalidateAssetCacheTask.ts identities.ts pages.ts
             userContext.ts FakeFolderLevelPermissions.ts FakeListUserTeams.ts (Task 15)
             engine.ts (Task 16)
  target/WbPageAccess.test.ts (Task 15)  target/WbPageAdapter.test.ts (Task 16)
  wrappers/workflowWrappers.test.ts (Task 17)  wrappers/reviewWrappers.test.ts registration.test.ts (Task 18)
```

Wrapper folders contain `abstractions.ts`, `<Name>UseCase.ts`, `feature.ts`, `index.ts`; `index.ts` exports the abstraction and its input type only; the app feature imports `feature.ts` directly. Package roots export only the app feature (unchanged).

## Sub-phases

Each sub-phase has its own folder, its own `00-2.N-<slug>.md` overview (the `PLAN_FILE` for superpowers:subagent-driven-development), its own SDD run and final review, and a stop for the user before the next one starts. This file binds all of them; every overview tells the executor to read it first. Task numbers are global (1-19).

| Sub-phase | Folder | Tasks | Ends with |
|---|---|---|---|
| 2.1 Engine additions | `2.1-engine-additions/` | 1-6 | Per-identity permission cache; `actor` on workflow input and events; blocking reviews on the delete error; target review use cases; `ReviewTargetAccess` port, `RunAsUser`, adapter errors |
| 2.2 CMS adapter and hooks | `2.2-cms-adapter-and-hooks/` | 7-11 | `cms.*` adapter (read, access, loader, sync, other-user read), single CMS handlers (revision null, save block), CMS publish/move/delete rules, model delete decorator |
| 2.3 CMS wrappers | `2.3-cms-wrappers/` | 12-14 | Eleven CMS wrapper use cases with permission, target-access, cross-app and API-key tests |
| 2.4 WB adapter and wrappers | `2.4-wb-adapter-and-wrappers/` | 15-19 | `wb.page` adapter and handlers, eleven WB wrapper use cases, docs aligned |

Executing a sub-phase: pass its overview as `PLAN_FILE` and give each task file to `task-brief` with an explicit output path, e.g. `task-brief docs/.bruno/plans/2026-10-11-workflows-phase-2/2.1-engine-additions/task-01-permission-cache-per-identity.md 1 <workspace>/task-1-brief.md`. Reviewers get this file's Global Constraints, the rulings relevant to the task, `../2026-10-09-workflows-phase-1a/00-shared.md` R6, R16, R18, R23, R28 and `../2026-10-10-workflows-phase-1b/00-1b-permission-building-blocks.md` R38, R41, R42, plus D132 and D133.

## Old code to delete

Verified against `b3a538a556`: the duplicated CMS/WB entry and page handlers were removed in 1a Task 1. What remains: `createWorkflowAppName` in `api-headless-cms-workflows/src/utils/appName.ts` (no importer; removed in Task 7) and a stale comment in `api-website-builder/src/features/experiments/EndExperimentOnPublish/EndExperimentOnPublishHandler.ts` naming the deleted `ValidateWorkflowStateOnPageBeforePublish` (Task 19). Nothing in `api-headless-cms` clears `system.workflow` on publish any more (D85 holds).

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
| 5.1 API keys act as `user` actors with `identityType: "api-key"` (D133 point 5) | Tasks 14, 18 (API-key end-to-end tests, A27) |
| 5.1 picks lenient at submit; `canPick` = write access + `canPickReviewer` | R61, Tasks 13, 18 |
| 5.1 / D79 publish requires an approved review on bound models; fail closed | Tasks 10, 16 (R53) |
| 5.1 / D121 republish of an unpublished approved revision | Tasks 10, 16 |
| 5.3 viewer flags AND target read access | Tasks 13, 18 (`GetCmsEntryReview`, `GetWebsiteBuilderPageReview`, R62) |
| 4.1 / D131 store passes `savedOn`; per-app store mutation (D132) | Tasks 12, 17 |
| 4.1 / D115 delete-blocked: engine count + blocking reviews; wrapper keeps 5 readable | Task 3 (engine), Tasks 12, 17 (R57) |
| 8 store and delete need `editor`; list and get any authenticated user (D78) | Tasks 12, 17 (R60) |
| 8 each app checks its own model, folder and content permissions (D133) | Tasks 7, 15 (R47) |
| 9.2 `EntryBeforeUpdate` save block incl. approved revisions (D62, D80); sync exempt | Task 9 (R54) |
| 9.2 `DeleteModelUseCase` decorator → `Workflows/Model/BoundToWorkflow` (D41, D64) | Task 11 (R64) |
| 9.2 adapters for other CMS events match namespace and model explicitly | Tasks 10, 16 (R51, R52) |
| 9.3 load target revision, typed `TargetContext` | Tasks 8, 16 (R66) |
| 9.3 move blocked only while in progress (D84) | Tasks 10, 16 (R55) |
| 9.3 delete the review when the target is permanently deleted (incl. assignment log, 4.3) | Task 5 (engine), Tasks 10, 16 (R56) |
| 9.3 / D61 / D133 `canUserRead(userId, target)` per adapter | Task 6 (port, `RunAsUser`), Tasks 8, 16 (R48, R50) |
| D133 point 1: nothing crosses apps | Tasks 12-14, 17, 18 (R46) |
| 1a R26 / 1b R39: `actor` on workflow input and events | Task 2 (R58) |
| 1b carry-over: DB-model no-access test for the bindable check | Task 11 (`bindableDbModel.test.ts`) |
| 1b carry-over: API-key actor end-to-end | Tasks 14, 18 |
| Roadmap: delete the old duplicated CMS/WB handlers | Already done in 1a Task 1; leftovers in Tasks 7, 19 |

### Not in this phase

- GraphQL for every wrapper, the shared configuration operations (settings, `listUsers`, step types, transports), `getTargetReview` per app, review lists with filters, row flags, folder filter predicate and pagination (D47, D76, D94, D112, D119), redaction of assignment details (D89, D127), store conflict/not-found error shape, title and comment length validation (D100), the CMS editor model list (D116) (3).
- Routing: candidates' read access through `ReviewTargetAccess` (the port and implementations land here), rules, strategies, exclusions, picks validated on step reached, reassign transition and wrappers, `listStepCandidates`, `inspectRouting`, `folderExists` (4).
- Automation bypass context for the save block, task triggers under `withIdentity(requester)` (D87), restart wrappers (5); AI tools `readTarget` / `updateTargetFields` per adapter (6); notifications (7); admin (8a-9c).
- Blocking trash of a target under review (no decision; A22).

## Review findings not applied

None yet.
