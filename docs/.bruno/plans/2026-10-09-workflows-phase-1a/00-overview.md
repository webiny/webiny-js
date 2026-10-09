# Workflows Phase 1a: Models and Review Aggregate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old workflow and workflow-state code in `@webiny/api-workflows` with the new data model (`wbyWorkflow` with `models[]` and typed steps, `wbyWorkflowReview`, `wbyWorkflowAssignment`, `wbyWorkflowSettings`), an identity-free review aggregate for review steps (request, reach, start, take over, approve, reject, cancel), one review save path, workflow validation with an optimistic save check, and domain events that carry enough data for a later audit app.

**Architecture:** Pure domain code lives in `packages/api-workflows/src/domain/*` (types, validators, the `Review` aggregate, model definitions); it has no DI dependencies and is unit tested without storage. DI features live in `src/features/*` (abstractions, CMS-backed repositories, use cases, events) and are tested through `createContextHandler` against real storage. Later phases plug in through three abstractions shipped here: `ReviewTargetLoader` (no implementation in 1a), `ReviewTargetSync` (no-op in 1a) and `StepAssignmentResolver` (pool-only in 1a). The old domain, use cases and GraphQL schema are deleted in place; the CMS and Website Builder workflow packages lose every handler that used them, except the "model is publishable" check, which moves to the new workflow before-save events.

**Tech Stack:** TypeScript, `@webiny/feature` DI (`createFeature`, `createAbstraction`, `createImplementation`, `createDecorator`), `@webiny/di` container, CMS private models (`ModelFactory` from `@webiny/api-headless-cms/features/modelBuilder/index.js`), CMS entry use cases, `DomainEvent` / `EventPublisher` from `@webiny/api-core/features/eventPublisher/index.js`, `BaseError` / `Result` from `@webiny/feature/api`, zod 4 (`import zod from "zod"`), vitest, `@webiny/api-headless-cms-testing` (`createCmsTestHandler`).

**Spec:** `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` (sections 2, 3, 4.1-4.5, 5.1, 5.2, 9.5). Decisions: `docs/.bruno/workflows/decisions.md` (D2, D5, D11, D15, D19-D23, D27, D29, D30, D41, D45, D49, D74, D75, D81, D105, D106, D108, D115, D119, D123, D127, D131). Roadmap: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` (phase 1a row, cross-phase rules).

## Global Constraints

- DI conventions: one abstraction or implementation per file; implementation file named after its class (no `implementation.ts`); export name matches the abstraction; types via namespace (`X.Interface`); no inline object types (extract named interfaces); minimal barrel exports (only what external consumers need).
- Before every commit, run from the repo root, in order: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, build the changed packages (`yarn build -p <package> 2>&1 | tail -30`), `git add .`. If any step changes something or fails and you fix it, rerun the chain from the start.
- Commit messages use Conventional Commits and end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  ```
- Never push, never amend.
- Test commands (from repo root): `yarn test <path>` (default storage), `yarn test:ddb <path>`, `yarn test:os <path>`, `yarn test:sql <path>`, `yarn test:pg:os <path>`. Cap output with `2>&1 | tail -50`. Run every storage the package's `ci.config.json` lists.
- Use CodeGraph (`codegraph explore "<symbols>"`) before reading files to confirm symbols and import paths.

## Review Focus

1. **Current-step fields drift from the steps** (D19, D74, D75, D119). Lists in phase 3 and least-loaded in phase 4 read only `currentStepId`, `currentStepState`, `currentOwnerId`, `currentCandidateTeamIds`, `state`, `isActive`, `lastChangedOn`. They must be refreshed by the aggregate on every save, keep the last or rejecting step after approve and reject, stay `null` for a non-user owner, and be cleared on cancel. Pinned by Task 5 tests "keeps the rejecting step and its owner as current", "clears the current-step fields on cancel" and "never sets currentOwnerId for an AI owner".
2. **A requester reviews their own content, or a non-member acts on a step** (spec 5.1 rules, D5). Transitions are identity-free, so the aggregate is the only guard in 1a. Pinned by Task 4 tests "does not let the requester start their own review", "does not let a user outside the candidate teams start", "does not let the current owner take over" and "does not take over an AI step", and Task 9 tests through the use cases.
3. **The wrong `system.workflow` value reaches the target** (spec 4.5, D29, D75). Phase 2 writes whatever `ReviewTargetSync` receives. Pinned by Task 9 tests that assert the synced value after every transition, including `null` after cancel and `reviewState: "approved"` on the last step.
4. **Lost workflow edits** (D131, D123). A stale `savedOn` must fail with `Workflows/Workflow/Conflict` and the stored `savedOn`/`savedBy`; a save of a deleted workflow must fail with `Workflows/Workflow/NotFound` instead of recreating it. Pinned by Task 3 tests "rejects a save with a stale savedOn" and "does not recreate a workflow deleted while it was being edited".
5. **Deleting a workflow while reviews run** (D81). Pinned by Task 6 test "blocks deleting a workflow while reviews are in progress": the error carries the exact count, and finished (cancelled, rejected) reviews do not block.

## Rulings

Binding for this plan. Where they refine the spec, the ruling wins for phase 1a.

**User decisions**

- R1. Replace in place. 1a deletes the old workflow and workflow-state domain, use cases and GraphQL schema (`graphql/*`, `WorkflowsSchemaFactory`, GraphQL tests). In `api-headless-cms-workflows` and `api-website-builder-workflows`, every handler, decorator, util and test that depends on removed `api-workflows` symbols is deleted, so every package still builds; phase 2 rebuilds them. Exception: `DisallowUnpublishableModelsOnBeforeCreate` is re-pointed to the new workflow before-save events and its test keeps working. Only this phase's tests are acceptance; the old admin may break.
- R2. Review model id `wbyWorkflowReview`. The domain term is "Review" everywhere: code, events `Workflows/Review/...`, errors `Workflows/Review/...`.
- R3. Step reached for review steps goes through `StepAssignmentResolver`. The 1a default (`PoolStepAssignmentResolver`) returns no owner, `candidateTeamIds` = the step's teams, assignment `{ source: "pool" }`; the step becomes `awaiting`. Request accepts `picks: { stepId: string; userId: string }[]`, stored as `pickedUserId` on the review step; the default resolver ignores them. The `wbyWorkflowAssignment` model and its repository (create, list) exist; nothing in 1a writes to it except its own tests.
- R4. The single save path calls `ReviewTargetSync` after persisting, with the `system.workflow` value (`{ workflowId, reviewState, stepId, stepName, stepState } | null`). 1a ships a no-op; tests decorate it.
- R5. Request gets title and typed `TargetContext` from a `ReviewTargetLoader` (`canLoad(model)` + `load({ model, targetId, targetRevisionId })` → `{ title, context }` or `null`). 1a ships no implementation; request fails with `Workflows/Review/TargetNotFound` when no loader matches or the target is missing. `TargetContext` = `{ folder: { id, type } | null; modelId; title; author: { id, displayName } }` (spec 9.3: folder id and type, model id, title, author).
- R6. Use cases take explicit actor input (`{ reviewId, actor, actorTeamIds }`, plus `comment` where relevant). The aggregate enforces domain rules: the requester never reviews their own content; start and take over need membership of `candidateTeamIds`; take over not by the current owner; approve and reject only by the owner; cancel not on approved, rejected or cancelled reviews. Permission checks and identity reading are phase 1b: nothing in 1a reads `IdentityContext` in review transitions or their use cases. Workflow CRUD permission (`editor`) also moves to 1b: the 1a workflow and settings use cases do no permission check.

**Controller rulings**

- R7. Step types: only `"review"` is accepted on save; any other type fails validation with "Step "{title}" uses the step type "{type}", which is not supported yet. Only "review" steps can be saved." until phase 5 adds the `StepType` extension point. The review config is validated in code with a zod schema in the domain. The models keep `config` as a JSON field, so phase 5 needs no model change.
- R8. Transitions in scope: request, reach (internal, via the resolver), start, take over, approve, reject, cancel. Out of scope: reassign, fail, restart (phases 4/5), viewer flags (1b), routing (4), notifications (7), audit logs (later). Events carry the saved review snapshot plus the fact: actor, review id, workflow id (both in the snapshot), step id, from/to state, comment.
- R9. Events: `Workflows/Workflow/BeforeCreate|AfterCreate|BeforeUpdate|AfterUpdate|BeforeDelete|AfterDelete`, `Workflows/Review/Requested|StepReached|StepStarted|StepTakenOver|StepApproved|StepRejected|Cancelled|Approved`. One event per domain fact: a rejected step ends the review (D10), so `StepRejected` is the review-rejected fact; approving the last step publishes `StepApproved` then `Approved`.
- R10. Single save path: `ReviewSaver.save(review)` is used by every transition. It calls `Review.prepareForSave()` (refreshes `currentStepId`, `currentStepState`, `currentOwnerId` (only for `user` owners, D74), `currentCandidateTeamIds`, `state`, `isActive`, and `lastChangedOn` from the newest fact), persists through `ReviewRepository.save(data)` (create or update), calls `ReviewTargetSync`, then publishes the events. No optimistic locking on reviews (D27).
- R11. `StoreWorkflowUseCase` takes `savedOn` for updates: mismatch → `Workflows/Workflow/Conflict` with data `{ savedOn, savedBy }` from the stored record; missing → `Workflows/Workflow/NotFound`. One validation path for create and update: exactly one model, at least one step ("Add at least one step."), unique step ids, review config with at least one team, every rule has a target, no other workflow bound to the same model (race accepted). The "model is publishable" check stays in the CMS package, as handlers on `WorkflowBeforeCreate` and `WorkflowBeforeUpdate`.
- R12. Workflow delete is blocked while any of its reviews is `inProgress`: `Workflows/Workflow/HasActiveReviews` with data `{ count }` (phase 3 adds the up-to-5 listing, D115).
- R13. Settings model `wbyWorkflowSettings` (one entry per tenant) with Get and Save use cases: unique `userId` enforced on save, last save wins, expired entries filtered on read in memory (D16, D43, D105, D106).
- R14. `features/internal/GetUserTeams` is deleted (only the old state use cases used it). Notifications features stay untouched.
- R15. `system.workflow` typing: `api-headless-cms` exposes `ICmsEntrySystem` ("to be extended") and only the filter type `CmsEntryListWhereSystemWorkflow`; there is no value type to reuse. `api-workflows/src/types.ts` augments `ICmsEntrySystem` with `workflow?: ReviewSystemWorkflow | null`. (Today's augmentation targets a non-existent `IEntrySystem` and has no effect.)

**Assumptions made by this plan** (flag in review if wrong)

- A1. Settings read: `GetWorkflowSettingsUseCase` filters expired exclusions by default and takes `{ includeExpired: true }` for the settings page, which must show expired entries so they can be edited (D105). Both rulings hold this way.
- A2. `issues`, `taskId` and `runs` on review steps are not modelled in 1a; phases 5 and 6 add the fields (adding fields to a private model needs no migration, D1).
- A3. `targetContext` is stored as an object field (not JSON) so phase 3 can filter by folder.
- A4. The domain keeps the spec's `createdBy: Actor` (the requester). The model field is named `requester`, because `createdBy` is a reserved CMS field id; the mapper translates. CMS meta `createdOn`/`savedOn` map to the review's `createdOn`/`savedOn`.
- A5. Ids: workflow ids come from the caller (as today); review ids are generated in `RequestReviewUseCase` with `mdbid()`; the aggregate receives the id and `now` so it stays deterministic.
- A6. A before-save handler rejects a save by throwing `WorkflowValidationError`; `StoreWorkflowUseCase` turns that into `Result.fail`. Other thrown errors propagate.
- A7. Save-time validation of rule targets against team membership (spec 6, last paragraph) needs team lookups and lands in phase 4; 1a only requires a target.
- A8. The assignment repository lists newest first by `assignedOn` (sorted in memory after a `createdOn_DESC` query), which is enough for phase 4 to read "the latest record".
- A9. OpenSearch is not available locally. Every task still lists `yarn test:os`; if it cannot run, say so in the task report and leave it to CI.

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
  shared/toIsoString.ts
  workflow/   events.ts  shared/{WorkflowEntryMapper,WorkflowModelProvider,WorkflowRepository,feature}.ts
              GetWorkflow/ ListWorkflows/ StoreWorkflow/ DeleteWorkflow/
  review/     events.ts  ReviewLifecycleFeature.ts
              shared/{types,ReviewEntryMapper,ReviewModelProvider,ReviewRepository,feature}.ts
              ReviewTargetLoader/ ReviewTargetSync/ StepAssignmentResolver/ ReviewStepReacher/ ReviewSaver/
              RequestReview/ GetReview/ StartReviewStep/ TakeOverReviewStep/ ApproveReviewStep/ RejectReviewStep/ CancelReview/
  assignment/ shared/{AssignmentEntryMapper,AssignmentModelProvider,AssignmentRepository,feature}.ts
  settings/   shared/{WorkflowSettingsEntryMapper,WorkflowSettingsModelProvider,WorkflowSettingsRepository,feature}.ts
              GetWorkflowSettings/ SaveWorkflowSettings/
  notifications/ (unchanged)
```

Use case folders contain `abstractions.ts`, `<Name>UseCase.ts`, `feature.ts`, `index.ts`. `index.ts` exports only the use case abstraction and its input types; `WorkflowsFeature` imports `feature.ts` directly.

---

## Self-review

### Spec coverage

| Spec requirement | Where |
|---|---|
| 2: stored shape free, replace in place, old admin may break | Task 1, Task 3 (R1) |
| 3: terminology (Review, Requester, Step reached, Pool, Owner, namespace id) | Tasks 4-9 naming (R2) |
| 4.1 `wbyWorkflow` with `models[]`, typed steps, `config` JSON | Task 2 (types, schema), Task 3 (model) |
| 4.1 validation: exactly one model, at least one step (D108), one workflow per model (D15, D41) | Task 2 (`WorkflowValidator`), Task 3 (`ensureModelIsFree`) |
| 4.1 model is publishable | Task 3 (CMS handlers on BeforeCreate/BeforeUpdate) |
| 4.1 every rule has a target; review config teams | Task 2 |
| 4.1 only review step type until phase 5 (R7) | Task 2 |
| 4.1 optimistic save (D131), NotFound without tombstone (D123) | Task 3 |
| 4.1 delete blocked while in progress with exact count (D81) | Task 6 |
| 4.2 review model, full workflow snapshot (D81), current-step fields (D19), `lastChangedOn` (D119), `model` replaces `app` (D41) | Task 4 (aggregate), Task 6 (model, repository) |
| 4.2 `currentOwnerId` only for user owners (D74) | Task 5 |
| 4.2 at most one active review per revision (D23) | Task 6 (`getActiveByTarget`), Task 8 |
| 4.2 approve/reject keep last or rejecting step; cancel clears (D75) | Task 5, Task 9 |
| 4.2 assignment details on steps (D127), picks stored (D22) | Task 4 (`assignment`, `pickedUserId`), Task 8 |
| 4.3 `wbyWorkflowAssignment` model with create/list | Task 10 |
| 4.4 `wbyWorkflowSettings`, unique user (D105), last save wins (D106), expired filtered in memory | Task 11 |
| 4.5 `system.workflow` value shape and sync after every save | Task 5 (`getSystemWorkflow`), Task 7 (`ReviewTargetSync`, `ICmsEntrySystem`), Task 9 |
| 5.1 identity-free transitions with explicit actor (D5) | Tasks 4, 5, 9 (R6) |
| 5.1 request, start, take over, approve, reject, cancel and their rules | Tasks 4, 5, 8, 9 |
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
- Routing: pick validation on step reached, rules, strategies, exclusions in candidate resolution, assignment-log writes, reassign, save-time rule-target validation against team membership, `listUsers`, `listStepCandidates`, `inspectRouting` (4).
- Step types beyond "review", `StepType` extension point, automation, fail and restart, `taskId`, `runs`, secret config encryption (5).
- AI steps and `issues` (6).
- Notifications on review events (7); existing notifications features are untouched.
- Admin UI (8a-9c); the old admin is expected to break against this API.
- Audit-log app (later; events already carry the data).
