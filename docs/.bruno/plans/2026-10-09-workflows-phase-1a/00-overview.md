# Workflows Phase 1a: Models and Review Aggregate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old workflow and workflow-state code in `@webiny/api-workflows` with the new data model (`wbyWorkflow` with `models[]` and typed steps, `wbyWorkflowReview`, `wbyWorkflowAssignment`, `wbyWorkflowSettings`), an identity-free review aggregate for review steps (request, reach, start, take over, approve, reject, cancel), one review save path, workflow validation with an optimistic save check, and domain events that carry enough data for a later audit app.

**Architecture:** Pure domain code lives in `packages/api-workflows/src/domain/*` (types, validators, the `Review` aggregate, model definitions); it has no DI dependencies and is unit tested without storage. DI features live in `src/features/*` (abstractions, CMS-backed repositories, use cases, events) and are tested through `createContextHandler` against real storage. Later phases plug in through three abstractions shipped here: `ReviewTargetLoader` (no implementation in 1a), `ReviewTargetSync` (no-op in 1a) and `StepAssignmentResolver` (pool-only in 1a). The old domain, use cases and GraphQL schema are deleted in place; the CMS and Website Builder workflow packages lose every handler that used them, except the "model is publishable" check, which moves to the new workflow before-save events.

**Tech Stack:** TypeScript, `@webiny/feature` DI (`createFeature`, `createAbstraction`, `createImplementation`, `createDecorator`), `@webiny/di` container, CMS private models (`ModelFactory` from `@webiny/api-headless-cms/features/modelBuilder/index.js`), CMS entry use cases, `DomainEvent` / `EventPublisher` from `@webiny/api-core/features/eventPublisher/index.js`, `BaseError` / `Result` from `@webiny/feature/api`, zod 4 (`import zod from "zod"`), vitest, `@webiny/api-headless-cms-testing` (`createCmsTestHandler`).

**Spec:** `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` (sections 2, 3, 4.1-4.5, 5.1, 5.2, 9.5). Decisions: `docs/.bruno/workflows/decisions.md` (D2, D5, D11, D15, D19-D23, D27, D29, D30, D41, D45, D49, D74, D75, D81, D105, D106, D108, D115, D119, D123, D127, D131). Roadmap: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` (phase 1a row, cross-phase rules).

## Global Constraints

- DI conventions: one abstraction or implementation per file; implementation file named after its class (no `implementation.ts`); export name matches the abstraction; types via namespace (`X.Interface`); no inline object types (extract named interfaces); minimal barrel exports (only what external consumers need).
- Before every commit, run from the repo root, in order: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, build the changed packages (`yarn build -p <package> 2>&1 | tail -30`), `git add .`. If any step changes something or fails and you fix it, rerun the chain from the start.
- Commit messages use Conventional Commits and end with exactly these two lines:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
  ```
- Never push, never amend.
- Test commands (from repo root): `yarn test <path>` (default storage), `yarn test:ddb <path>`, `yarn test:os <path>`, `yarn test:sql <path>`, `yarn test:pg:os <path>`. Cap output with `2>&1 | tail -50`. Run every storage the package's `ci.config.json` lists.
- Use CodeGraph (`codegraph explore "<symbols>"`) before reading files to confirm symbols and import paths.

## Review Focus

1. **Current-step fields drift from the steps** (D19, D74, D75, D119). Lists in phase 3 and least-loaded in phase 4 read only `currentStepId`, `currentStepState`, `currentOwnerId`, `currentCandidateTeamIds`, `state`, `isActive`, `lastChangedOn`. They must be refreshed by the aggregate on every save, keep the last or rejecting step after approve and reject, stay `null` for a non-user owner, and be cleared on cancel. Pinned by Task 5 tests "keeps the rejecting step and its owner as current", "clears the current-step fields on cancel" and "never sets currentOwnerId for an AI owner".
2. **A requester reviews their own content, or a non-member acts on a step** (spec 5.1 rules, D5). Transitions are identity-free, so the aggregate is the only guard in 1a. Pinned by Task 4 tests "does not let the requester start their own review", "does not let a user outside the candidate teams start", "does not let a non-user actor start", "does not let the current owner take over", "does not take over an AI step" and "falls back to the pool when the resolved owner is the requester", and Task 9 tests through the use cases ("does not let the requester, a non-member or a non-user start the step", "does not let the requester or a non-member take over").
3. **The wrong `system.workflow` value reaches the target** (spec 4.5, D29, D75). Phase 2 writes whatever `ReviewTargetSync` receives. Pinned by Task 9 tests that assert the full list of synced values (exactly one per transition) after start, take over, approve, last approve, reject and cancel, including `null` after cancel and `reviewState: "approved"` on the last step; and by Task 5 "derives the value from the steps without prepareForSave". A failed sync keeps the save (R16): Task 7 "keeps the review saved and publishes events when the target sync fails", Task 8 "keeps the requested review when the target sync fails".
4. **Lost workflow edits** (D131, D123). A stale `savedOn` must fail with `Workflows/Workflow/Conflict` and the stored `savedOn`/`savedBy`; a save of a deleted workflow must fail with `Workflows/Workflow/NotFound` instead of recreating it. Pinned by Task 3 tests "rejects a save with a stale savedOn" and "does not recreate a workflow deleted while it was being edited".
5. **Deleting a workflow while reviews run** (D81). Pinned by Task 6 test "blocks deleting a workflow while reviews are in progress": the error carries the exact count, and finished (approved, cancelled, rejected) reviews do not block; the approved one stays `isActive: true`, which is the trap.
6. **A stale or repeated transition acts on the wrong step** (R17, D27). With no optimistic locking on reviews, a repeated "approve" could approve the next step once the same user holds it. Pinned by Task 4/5 "fails when the step is not the current step" and Task 9 "refuses a stale approve for a step that is no longer current".
7. **OpenSearch lag on the active-review check and the delete block** (D23, D81, R18). On ddb-os the lists read OpenSearch, which lags DynamoDB. Each listed hit is re-read from primary storage before `isActive`/`state` is trusted, so a just-cancelled review never blocks a new request or a delete. Two concurrent requests on one revision can still both pass, and a delete can pass while a request is in flight (a review written but not yet indexed): accepted, like D27 and D15. Local test runs index synchronously, so they cannot reproduce the lag; review `ReviewRepository.getActiveByTarget` / `countInProgressByWorkflow` (Task 6) by reading.

## Rulings

Binding for this plan. Where they refine the spec, the ruling wins for phase 1a.

**User decisions**

- R1. Replace in place. 1a deletes the old workflow and workflow-state domain, use cases and GraphQL schema (`graphql/*`, `WorkflowsSchemaFactory`, GraphQL tests). In `api-headless-cms-workflows` and `api-website-builder-workflows`, every handler, decorator, util and test that depends on removed `api-workflows` symbols is deleted, so every package still builds; phase 2 rebuilds them. Exception: `DisallowUnpublishableModelsOnBeforeCreate` is re-pointed to the new workflow before-save events and its test keeps working. Only this phase's tests are acceptance; the old admin may break.
- R2. Review model id `wbyWorkflowReview`. The domain term is "Review" everywhere: code, events `Workflows/Review/...`, errors `Workflows/Review/...`.
- R3. Step reached for review steps goes through `StepAssignmentResolver`. The 1a default (`PoolStepAssignmentResolver`) returns no owner, `candidateTeamIds` = the step's teams, assignment `{ source: "pool" }`; the step becomes `awaiting`. Request accepts `picks: { stepId: string; userId: string }[]`, stored as `pickedUserId` on the review step; the default resolver ignores them. The `wbyWorkflowAssignment` model and its repository (create, list) exist; nothing in 1a writes to it except its own tests.
- R4. The single save path calls `ReviewTargetSync` after persisting, with the `system.workflow` value (`{ workflowId, reviewState, stepId, stepName, stepState } | null`). 1a ships a no-op; tests decorate it.
- R5. Request gets title and typed `TargetContext` from a `ReviewTargetLoader` (`canLoad(model)` + `load({ model, targetId, targetRevisionId })` → `{ title, context }` or `null`). 1a ships no implementation; request fails with `Workflows/Review/TargetNotFound` when no loader matches or the target is missing. `TargetContext` = `{ folder: { id, type } | null; modelId; title; author: { id, displayName } }` (spec 9.3: folder id and type, model id, title, author).
- R6. Use cases take explicit actor input: start, take over, approve and reject take `{ reviewId, stepId, actor, actorTeamIds }` (approve and reject also `comment`); cancel takes `{ reviewId, actor }` (R17). The aggregate enforces domain rules: the requester never reviews their own content (also on step reached: a resolved user owner who is the requester falls back to the pool); start and take over need a `user` actor and membership of `candidateTeamIds`; take over not by the current owner; approve and reject only by the owner; `stepId` must be the current step; cancel not on approved, rejected or cancelled reviews. Permission checks and identity reading are phase 1b: nothing in 1a reads `IdentityContext` in review transitions or their use cases. Workflow CRUD permission (`editor`) also moves to 1b: the 1a workflow and settings use cases do no permission check.
- R16. Save failure policy: the review stays saved. `ReviewTargetSync.sync` returns a `Result`. If sync fails, events are still published and the use case returns a typed error `Workflows/Review/TargetSync` (error data carries the saved review). Event handler exceptions propagate as elsewhere in the repo. Tested with a failing sync (Tasks 7, 8).
- R17. Start, take over, approve and reject take `{ reviewId, stepId, actor, actorTeamIds }` (approve and reject also `comment`). The aggregate fails with `Workflows/Review/StepNotCurrent` when `stepId` is not the current step. Cancel stays review-level.

**Controller rulings**

- R7. Step types: only `"review"` is accepted on save; any other type fails validation with "Step "{title}" uses the step type "{type}", which is not supported yet. Only "review" steps can be saved." until phase 5 adds the `StepType` extension point. The review config is validated in code with a zod schema in the domain. The models keep `config` as a JSON field, so phase 5 needs no model change.
- R8. Transitions in scope: request, reach (internal, via the resolver), start, take over, approve, reject, cancel. Out of scope: reassign, fail, restart (phases 4/5), viewer flags (1b), routing (4), notifications (7), audit logs (later). Events carry the saved review snapshot plus the fact: actor, review id, workflow id (both in the snapshot), step id, from/to state, comment.
- R9. Events: `Workflows/Workflow/BeforeCreate|AfterCreate|BeforeUpdate|AfterUpdate|BeforeDelete|AfterDelete`, `Workflows/Review/Requested|StepReached|StepStarted|StepTakenOver|StepApproved|StepRejected|Cancelled|Approved`. One event per domain fact: a rejected step ends the review (D10), so `StepRejected` is the review-rejected fact; approving the last step publishes `StepApproved` then `Approved`.
- R10. Single save path: `ReviewSaver.save(review)` is used by every transition. It calls `Review.prepareForSave()` (refreshes `currentStepId`, `currentStepState`, `currentOwnerId` (only for `user` owners, D74), `currentCandidateTeamIds`, `state`, `isActive`, and `lastChangedOn` from the newest fact), persists through `ReviewRepository.save(data)` (create or update), calls `ReviewTargetSync`, then publishes the events. No optimistic locking on reviews (D27).
- R11. `StoreWorkflowUseCase` takes `savedOn` for updates: mismatch → `Workflows/Workflow/Conflict` with data `{ savedOn, savedBy }` from the stored record; missing → `Workflows/Workflow/NotFound`. One validation path for create and update: exactly one model in a valid namespace (`cms.<modelId>` or `wb.page`), at least one step ("Add at least one step."), unique step ids, review config with at least one team, every rule has a target, team targets among the step's teams, no other workflow bound to the same model (race accepted). The "model exists and is publishable" check for `cms.*` stays in the CMS package, as handlers on `WorkflowBeforeCreate` and `WorkflowBeforeUpdate`.
- R12. Workflow delete is blocked while any of its reviews is `inProgress`: `Workflows/Workflow/HasActiveReviews` with data `{ count }` (phase 3 adds the up-to-5 listing, D115).
- R13. Settings model `wbyWorkflowSettings` (one entry per tenant) with Get and Save use cases: unique `userId` enforced on save, last save wins, expired entries filtered on read in memory (D16, D43, D105, D106).
- R14. `features/internal/GetUserTeams` is deleted (only the old state use cases used it). Notifications features stay untouched. Removing `WorkflowsSchemaFactory` (R1) also removes the notifications GraphQL query and the base-schema `CmsEntrySystem.workflow` / `ListWhereInputCmsEntrySystem.workflow` extensions until phase 3; the notifications domain and features keep working.
- R15. `system.workflow` typing: `api-headless-cms` exposes `ICmsEntrySystem` ("to be extended") and only the filter type `CmsEntryListWhereSystemWorkflow`; there is no value type to reuse. `api-workflows/src/types.ts` augments `ICmsEntrySystem` with `workflow?: ReviewSystemWorkflow | null`, and `src/index.ts` does `export type * from "./types.js"` (as `api-websockets` does) so every consumer of the package sees it. (Today's augmentation targets a non-existent `IEntrySystem` and has no effect.)

**Controller rulings after the plan review** (binding)

- R18. OpenSearch lag: the active-review check (`getActiveByTarget`) and the delete-block count (`countInProgressByWorkflow`) list through the CMS list (OpenSearch on ddb-os) and confirm each listed hit with a primary-storage `GetEntryByIdUseCase` read before trusting `isActive`/`state`. Two concurrent requests on the same revision can still both pass, and a delete can pass while a request is in flight; that race is accepted, like D27 and D15 (Review Focus 7).
- R19. Workflow events live in one `events.ts` per use case folder: `StoreWorkflow/events.ts` (create and update Before/After) and `DeleteWorkflow/events.ts` (delete Before/After), each event class with its handler abstraction, as the repo's per-use-case `events.ts` files do (old `CreateWorkflow/events.ts`, CMS `CreateEntry/events.ts`). Handler abstractions are exported from the use case's `index.ts`.
- R20. Model existence: `WorkflowValidator` rejects a malformed namespace id (only `cms.<modelId>` and `wb.page` are valid in v1). For `cms.*`, the CMS package handler (`assertModelsBindable`) rejects a model that does not exist ("The model "{id}" does not exist.") and an unpublishable one. Both tested.
- R21. Team targets: `validateReviewConfig` rejects a team-target rule whose team is not among the step's teams (spec 6). A7 is narrowed to user targets.
- R22. `zod` stays in `api-workflows/package.json` through Task 1 (Task 2 uses it). Task 1's dependency edits are made by hand: adio ignores `graphql` and all `devDependencies`.
- R23. `AssignmentRepository.list` filters by `reviewId`, `workflowId` + `stepId`, `userId`, `userId_in` (AND-combined), newest first, with cursor paging (`after`, `limit`) and the repo's list shape `{ items, meta: CmsEntryMeta }`, so phase 2 can delete every record of a review and phase 4 can read the latest record per candidate.
- R24. Aggregate guards: start and take over require `actor.type === "user"` (`Workflows/Review/ActorNotUser`); `reach` turns a resolved user owner who is the requester into a pool assignment with a `reason`; `getSystemWorkflow()` is derived from the steps through the private `resolveCurrentStep()` that `prepareForSave()` also uses; `request` fails with `Workflows/Review/Validation` when the model is not in `workflow.models` or the workflow has no steps.
- R25. Cancel moves `lastChangedOn`. D119 does not list cancel, but a cancelled review leaves every list (`isActive: false`), so this is harmless and keeps the field monotonic.
- R26. Workflow use cases take no actor in 1a, so workflow events carry none (`workflow.savedBy` on delete is the last editor, not the deleter). Phase 1b adds `actor` to the workflow events.
- R27. Review creation passes `createdOn: review.createdOn` to the CMS (the input accepts it), so the stored `createdOn` equals the `requested` fact's time. The assignment log does the same with `assignedOn`.

**Assumptions made by this plan** (flag in review if wrong)

- A1. Settings read: `GetWorkflowSettingsUseCase` filters expired exclusions by default and takes `{ includeExpired: true }` for the settings page, which must show expired entries so they can be edited (D105). Both rulings hold this way.
- A2. `issues`, `taskId` and `runs` on review steps are not modelled in 1a; phases 5 and 6 add the fields (adding fields to a private model needs no migration, D1).
- A3. `targetContext` is stored as an object field (not JSON) so phase 3 can filter by folder.
- A4. The domain keeps the spec's `createdBy: Actor` (the requester). The model field is named `requester`, because `createdBy` is a reserved CMS field id; the mapper translates. CMS meta `createdOn`/`savedOn` map to the review's `createdOn`/`savedOn`.
- A5. Ids: workflow ids come from the caller (as today); review ids are generated in `RequestReviewUseCase` with `mdbid()`; the aggregate receives the id and `now` so it stays deterministic.
- A6. A before-save handler rejects a save by throwing `WorkflowValidationError`; `StoreWorkflowUseCase` turns that into `Result.fail`. Other thrown errors propagate.
- A7. Save-time validation of user rule targets against team membership (spec 6, last paragraph) needs team lookups and lands in phase 4. Team targets are checked in 1a (R21).
- A8. The assignment repository stores `createdOn = assignedOn` and sorts `createdOn_DESC` in storage, so pages are newest `assignedOn` first. Writers (phase 4) must pass the decision time as `assignedOn`.
- A9. OpenSearch is not available locally. Every task still lists `yarn test:os`; if it cannot run, say so in the task report and leave it to CI.
- A10. When several `ReviewTargetLoader`s match a model, the last registered wins (the same rule as resolving a single registration).
- A11. `ReviewTargetSync.sync` fails with a plain `Error` (`Result<void, Error>`); phase 2 adapters may return any `BaseError`.

## Task files

This overview holds everything that binds all tasks. Each task lives in its own file in this folder and is read together with this overview:

1. `task-01-remove-old-review-code.md`
2. `task-02-workflow-domain-and-validator.md`
3. `task-03-workflow-model-repository-use-cases.md`
4. `task-04-review-aggregate-request-start-take-over.md`
5. `task-05-review-aggregate-approve-reject-cancel.md`
6. `task-06-review-model-repository-delete-block.md`
7. `task-07-review-lifecycle-collaborators.md`
8. `task-08-request-and-get-review.md`
9. `task-09-review-transition-use-cases.md`
10. `task-10-assignment-log.md`
11. `task-11-workflow-settings.md`

Executing with superpowers:subagent-driven-development: pass this overview as `PLAN_FILE` (it owns the ledger workspace) and give each task file to `task-brief` with an explicit output path, e.g. `task-brief docs/.bruno/plans/2026-10-09-workflows-phase-1a/task-03-workflow-model-repository-use-cases.md 3 <workspace>/task-3-brief.md`.

## Task order

1. Delete the review side first (old state domain, GraphQL, consumers' state handlers). The old workflow feature stays for one task, so the CMS publishable-model handler still compiles.
2. Add the pure workflow domain under new file names (no clash with the old files).
3. Replace the workflow model, repository, use cases and events in one task: the model id `wbyWorkflow` and the CMS handler's event cannot exist in two shapes at once.
4-5. The review aggregate is pure domain, added under new names.
6. The review model `wbyWorkflowReview` is a new id, so it is added beside the workflow model; the delete-block lands with the repository it needs.
7-9. Lifecycle collaborators, then the use cases on top of them.
10-11. Assignment log and settings are independent and last.

Every task leaves all three packages building and green.

## File map (end state of `packages/api-workflows/src`)

```
WorkflowsFeature.ts  constants.ts  types.ts  index.ts
domain/
  workflow/   types.ts  errors.ts  reviewStepConfigSchema.ts  WorkflowValidator.ts  workflow.model.ts
              abstractions/WorkflowModelProvider.ts  abstractions/WorkflowRepository.ts
  review/     types.ts  facts.ts  errors.ts  Review.ts  review.model.ts
              abstractions/ReviewModelProvider.ts  abstractions/ReviewRepository.ts
  assignment/ types.ts  errors.ts  assignment.model.ts
              abstractions/AssignmentModelProvider.ts  abstractions/AssignmentRepository.ts
  settings/   types.ts  errors.ts  settings.model.ts  WorkflowSettingsValidator.ts  filterActiveExclusions.ts
              abstractions/WorkflowSettingsModelProvider.ts  abstractions/WorkflowSettingsRepository.ts
  notifications/ (unchanged)
features/
  shared/toIsoString.ts  shared/ActorEntryMapper.ts
  workflow/   shared/{WorkflowEntryMapper,WorkflowModelProvider,WorkflowRepository,feature}.ts
              GetWorkflow/ ListWorkflows/ StoreWorkflow/ (+ events.ts) DeleteWorkflow/ (+ events.ts)
  review/     events.ts  ReviewLifecycleFeature.ts
              shared/{types,ReviewEntryMapper,ReviewModelProvider,ReviewRepository,feature}.ts
              ReviewTargetLoader/ ReviewTargetSync/ StepAssignmentResolver/ ReviewStepReacher/ ReviewSaver/
              RequestReview/ GetReview/ StartReviewStep/ TakeOverReviewStep/ ApproveReviewStep/ RejectReviewStep/ CancelReview/
  assignment/ shared/{AssignmentEntryMapper,AssignmentModelProvider,AssignmentRepository,feature}.ts
  settings/   shared/{WorkflowSettingsEntryMapper,WorkflowSettingsModelProvider,WorkflowSettingsRepository,feature}.ts
              GetWorkflowSettings/ SaveWorkflowSettings/
  notifications/ (unchanged)
```

Use case folders contain `abstractions.ts`, `<Name>UseCase.ts`, `feature.ts`, `index.ts` (plus `events.ts` for `StoreWorkflow` and `DeleteWorkflow`). `index.ts` exports the use case abstraction, its input and result types, and (for workflow use cases) the event handler abstractions and payload types; `WorkflowsFeature` imports `feature.ts` directly. `src/index.ts` exports `WorkflowsFeature` and `export type * from "./types.js"`. Review shared input types (`ReviewActorInput`, `ReviewDecisionInput`, `CancelReviewInput`) live in `features/review/shared/types.ts`.

Test helpers (`__tests__/__helpers/`): `handler.ts`, `fixtures.ts` (incl. `expectOk`), `RecordingEventPublisher.ts`, `RecordingReviewTargetSync.ts`, `FailingReviewTargetSync.ts`, `FakeReviewTargetLoader.ts`, `reviewContext.ts`.

---

## Self-review

### Spec coverage

| Spec requirement | Where |
|---|---|
| 2: stored shape free, replace in place, old admin may break | Task 1, Task 3 (R1) |
| 3: terminology (Review, Requester, Step reached, Pool, Owner, namespace id) | Tasks 4-9 naming (R2) |
| 4.1 `wbyWorkflow` with `models[]`, typed steps, `config` JSON | Task 2 (types, schema), Task 3 (model) |
| 4.1 validation: exactly one model in a valid namespace, at least one step (D108), one workflow per model (D15, D41) | Task 2 (`WorkflowValidator`), Task 3 (`ensureModelIsFree`) |
| 4.1 model exists and is publishable | Task 3 (CMS `assertModelsBindable` on BeforeCreate/BeforeUpdate) |
| 4.1 every rule has a target; review config teams; 6: team targets among the step's teams | Task 2 |
| 4.1 only review step type until phase 5 (R7) | Task 2 |
| 4.1 optimistic save (D131), NotFound without tombstone (D123) | Task 3 |
| 4.1 delete blocked while in progress with exact count (D81) | Task 6 |
| 4.2 review model, full workflow snapshot (D81), current-step fields (D19), `lastChangedOn` (D119), `model` replaces `app` (D41) | Task 4 (aggregate), Task 6 (model, repository) |
| 4.2 `currentOwnerId` only for user owners (D74) | Task 5 |
| 4.2 at most one active review per revision (D23), robust to OpenSearch lag (R18) | Task 6 (`getActiveByTarget`, primary-storage confirm), Task 8 |
| 4.2 approve/reject keep last or rejecting step; cancel clears (D75) | Task 5, Task 9 |
| 4.2 assignment details on steps (D127), picks stored (D22) | Task 4 (`assignment`, `pickedUserId`), Task 8 |
| 4.3 `wbyWorkflowAssignment` model with create/list (filters by review, step, user, user set; cursor paging for delete-with-review) | Task 10 |
| 4.4 `wbyWorkflowSettings`, unique user (D105), last save wins (D106), expired filtered in memory | Task 11 |
| 4.5 `system.workflow` value shape and sync after every save; failed sync keeps the save (R16) | Task 5 (`getSystemWorkflow`), Task 7 (`ReviewTargetSync`, `ReviewSaver`, `ICmsEntrySystem` + type test), Tasks 8, 9 |
| 5.1 identity-free transitions with explicit actor (D5) | Tasks 4, 5, 9 (R6) |
| 5.1 request, start, take over, approve, reject, cancel and their rules (user-only start and take over, step id must be current, R17) | Tasks 4, 5, 8, 9 |
| 5.1 single save path (D19, D52) | Task 7 (`ReviewSaver`) |
| 5.2 one step-reached path, pool default (D2, D49) | Task 7 (`ReviewStepReacher`, `PoolStepAssignmentResolver`), Task 8 |
| 9.3 typed `TargetContext` from the target adapter | Task 4 (type), Task 7 (`ReviewTargetLoader`), Task 8 |
| 9.5 events carry data for a later audit app | Task 3 (workflow events), Task 7 (review events with snapshot + fact) |

### Not in this phase

- Permissions and identity: `editor` on workflow and settings use cases, review operation checks, shared permission checker, write access to request, read access to review (1b).
- Viewer flags `canStart`, `canTakeOver`, `canApprove`, `canReject`, `canCancel`, `canReassign`, `canRestart`, `canPick` (1b).
- Target adapters: `ReviewTargetLoader` and `ReviewTargetSync` implementations, `system.workflow` writes through `UpdateEntrySystemUseCase`, publish rule (D79, D121), move rule (D84), review and assignment-log delete on target delete, `EntryRevisionBeforeCreate` null, save block (D62, D80), model delete decorator (D64) (2).
- Rebuilt CMS and Website Builder workflow handlers deleted in Task 1 (2).
- GraphQL schema, including `CmsEntrySystemWorkflow` on the base schema and the CMS endpoint type update to `reviewState`/`stepState`; review lists, folder filter, `lastChangedOn` sort, pagination (D47, D76, D94, D112, D119); delete-blocked listing of up to 5 reviews (D115); error shape; title and comment length validation (D100) (3).
- Routing: pick validation on step reached, rules, strategies, exclusions in candidate resolution, assignment-log writes, reassign, save-time validation of user rule targets against team membership, `listUsers`, `listStepCandidates`, `inspectRouting` (4).
- `actor` on workflow events (1b, R26).
- Step types beyond "review", `StepType` extension point, automation, fail and restart, `taskId`, `runs`, secret config encryption (5).
- AI steps and `issues` (6).
- Notifications on review events (7); existing notifications features are untouched.
- Admin UI (8a-9c); the old admin is expected to break against this API.
- Audit-log app (later; events already carry the data).

## Review findings not applied

- B: the optional `stepId` question is resolved by R17 (required, not optional).
- C: `ReviewRepository.save` still reads before it writes (two round trips per transition). An `isNew` hint needs a new field or signature on the single save path; revisit when profiling shows it matters.
- C: `ReviewEntryMapper.fromEntry` keeps the empty-requester fallback for corrupt entries. Throwing from a mapper turns into an uncaught exception in every use case; phase 3 can add a persistence error if corrupt data shows up.
- C: model providers still throw when the model cannot be loaded, so repositories can reject instead of returning `Persistence`. This is the contract `WorkflowModelProvider` already uses (same as `FileModelProvider`); changing it is a cross-repository decision.
- D: settings tenant isolation has no test: `createCmsTestHandler` seeds only the root tenant and `getContext()` always sends `x-tenant: root`.
- D: the concurrent first settings save (both create, second fails with Persistence) is documented in the repository as an accepted race instead of a create-then-update retry.
- Review events stay in one `features/review/events.ts`: they are published by `ReviewSaver`, not by one use case each, so the per-use-case split of R19 does not apply.
