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

### Task 1: Remove the old review-state code, the old GraphQL schema and their consumers

**Files:**
- Delete (api-workflows): `packages/api-workflows/src/WorkflowsSchemaFactory.ts`, `packages/api-workflows/src/graphql/` (whole folder), `packages/api-workflows/src/domain/workflowState/` (whole folder), `packages/api-workflows/src/features/workflowState/` (whole folder, incl. `README.md`), `packages/api-workflows/src/features/internal/` (whole folder), `packages/api-workflows/__tests__/graphql/`, `packages/api-workflows/__tests__/validation/`, `packages/api-workflows/__tests__/__helpers/graphql.ts`, `packages/api-workflows/__tests__/WorkflowStateUseCases.test.ts`
- Modify (api-workflows): `packages/api-workflows/src/WorkflowsFeature.ts`, `packages/api-workflows/src/features/WorkflowModelProviders.ts`, `packages/api-workflows/src/constants.ts`, `packages/api-workflows/__tests__/__helpers/handler.ts`, `packages/api-workflows/__tests__/registration.test.ts`, `packages/api-workflows/package.json` (as `yarn adio` reports)
- Delete (CMS): `packages/api-headless-cms-workflows/src/features/EntryWorkflows/` (whole folder), `packages/api-headless-cms-workflows/src/utils/state.ts`, `packages/api-headless-cms-workflows/src/utils/modelAllowed.ts`, `packages/api-headless-cms-workflows/__tests__/entry/`, `packages/api-headless-cms-workflows/__tests__/state/`
- Modify (CMS): `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts`, `packages/api-headless-cms-workflows/package.json` (as `yarn adio` reports)
- Delete (WB): `packages/api-website-builder-workflows/src/features/` (whole folder), `packages/api-website-builder-workflows/src/utils/` (whole folder)
- Modify (WB): `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts`, `packages/api-website-builder-workflows/package.json` (as `yarn adio` reports)

**Interfaces:**
- Consumes: `GetModelUseCase` (`@webiny/api-headless-cms/features/contentModel/GetModel/index.js`), `createCmsTestHandler`, `CmsTestHandlerParams` (`@webiny/api-headless-cms-testing`), old `CreateWorkflowUseCase` / `UpdateWorkflowUseCase` (still present until Task 3).
- Produces: `WorkflowsFeature` registers only the workflow model, workflow features and notifications. Test helper `createContextHandler(params?: CmsTestHandlerParams): Promise<{ handler; context }>` that registers `WorkflowsFeature` and then runs `params.setup`. `CmsWorkflowsFeature` registers only the local `WorkflowsFeature` (publishable-model check) and the CMS endpoint `system.workflow` schema extension. `WebsiteBuilderWorkflowsFeature` registers only `WebsiteBuilderPageSchemaFactory`.

- [ ] **Step 1: Write the failing test**

Replace `packages/api-workflows/__tests__/registration.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { CreateWorkflowUseCase } from "~/features/workflow/CreateWorkflow/index.js";
import { UpdateWorkflowUseCase } from "~/features/workflow/UpdateWorkflow/index.js";

describe("WorkflowsFeature registration", () => {
    it("registers create and update workflow use cases once", async () => {
        const { context } = await createContextHandler();

        expect(context.container.resolveAll(CreateWorkflowUseCase)).toHaveLength(1);
        expect(context.container.resolveAll(UpdateWorkflowUseCase)).toHaveLength(1);
    });

    it("does not register the old workflow state model", async () => {
        const { context } = await createContextHandler();

        const result = await context.container.resolve(GetModelUseCase).execute("wbyWorkflowState");

        expect(result.isFail()).toBe(true);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL in "does not register the old workflow state model": `expected false to be true`.

- [ ] **Step 3: Delete the old review-state code in api-workflows**

```bash
git rm -r -q packages/api-workflows/src/WorkflowsSchemaFactory.ts \
  packages/api-workflows/src/graphql \
  packages/api-workflows/src/domain/workflowState \
  packages/api-workflows/src/features/workflowState \
  packages/api-workflows/src/features/internal \
  packages/api-workflows/__tests__/graphql \
  packages/api-workflows/__tests__/validation \
  packages/api-workflows/__tests__/__helpers/graphql.ts \
  packages/api-workflows/__tests__/WorkflowStateUseCases.test.ts
```

- [ ] **Step 4: Rewire api-workflows without the deleted code**

Replace `packages/api-workflows/src/constants.ts` with:

```ts
export const WORKFLOW_MODEL_ID = "wbyWorkflow";
export const WORKFLOWS_PERMISSION = "workflows";
```

Replace `packages/api-workflows/src/features/WorkflowModelProviders.ts` with:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowModelProvider } from "~/domain/workflow/abstractions.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

/**
 * Resolve the tenant's workflow model on demand. No memoization (`ModelsFetcher` caches per
 * request) and no `withoutAuthorization` (private models skip model authorization).
 */
class WorkflowModelProviderImplementation implements WorkflowModelProvider.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(WORKFLOW_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const WorkflowModelProviderImpl = WorkflowModelProvider.createImplementation({
    implementation: WorkflowModelProviderImplementation,
    dependencies: [GetModelUseCase]
});
```

Replace `packages/api-workflows/src/WorkflowsFeature.ts` with:

```ts
import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowModel as WorkflowPrivateModel } from "./domain/workflow/workflowModel.js";
import { WorkflowModelProviderImpl } from "~/features/WorkflowModelProviders.js";
import { WorkflowMapper } from "~/domain/workflow/WorkflowMapper.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { CreateWorkflowFeature } from "~/features/workflow/CreateWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";
import { UpdateWorkflowFeature } from "~/features/workflow/UpdateWorkflow/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { ListNotificationTypesFeature } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransportFeature } from "./features/notifications/NotificationTransport/index.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated. Check the effective flag at register time
        // (the license is refreshed pre-register) so nothing is wired up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Register private CMS model definitions early so HeadlessCmsInitializerImpl
        // picks them up when it builds the model list during the enhance phase.
        container.register(WorkflowPrivateModel);
        container.register(WorkflowModelProviderImpl);
        container.register(WorkflowMapper);

        // Notifications
        ListNotificationTypesFeature.register(container);
        NotificationTransportFeature.register(container);

        // Workflows
        GetWorkflowFeature.register(container);
        ListWorkflowsFeature.register(container);
        CreateWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
        UpdateWorkflowFeature.register(container);
        StoreWorkflowFeature.register(container);
    }
});
```

Replace `packages/api-workflows/__tests__/__helpers/handler.ts` with:

```ts
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { WorkflowsFeature } from "~/WorkflowsFeature.js";

/**
 * Request context with `WorkflowsFeature` registered. `params.setup` runs after it, so tests can
 * register fakes and decorators on top of the workflows abstractions.
 */
export const createContextHandler = async (params: CmsTestHandlerParams = {}) => {
    const handler = createCmsTestHandler({
        ...params,
        setup: async container => {
            WorkflowsFeature.register(container);
            await params.setup?.(container);
        },
        permissions: params.permissions ?? [{ name: "*" }]
    });
    const context = await handler.getContext();

    return {
        handler,
        context
    };
};
```

- [ ] **Step 5: Remove the CMS entry handlers that used the old review state**

```bash
git rm -r -q packages/api-headless-cms-workflows/src/features/EntryWorkflows \
  packages/api-headless-cms-workflows/src/utils/state.ts \
  packages/api-headless-cms-workflows/src/utils/modelAllowed.ts \
  packages/api-headless-cms-workflows/__tests__/entry \
  packages/api-headless-cms-workflows/__tests__/state
```

Replace `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { CmsGraphQLSchemaFactory } from "@webiny/api-headless-cms";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowsFeature as CmsLocalWorkflowsFeature } from "./features/Workflows/index.js";
import { createEntrySystemSchemaExtension } from "./graphql/entrySystemSchema.js";

export const CmsWorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        // Advanced publishing workflow is license-gated — check at register time (license is fresh
        // pre-register) so nothing wires up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Entry handlers (system.workflow sync, publish and move rules, target delete) are rebuilt
        // as target adapters in phase 2.
        CmsLocalWorkflowsFeature.register(container);

        // Add the `workflow` field to CmsEntrySystem on the CMS endpoint, which is served from the
        // separate CMS schema and needs its own CmsGraphQLSchemaFactory entry.
        container.registerInstance(CmsGraphQLSchemaFactory, {
            execute: () => [createEntrySystemSchemaExtension()]
        });
    }
});
```

- [ ] **Step 6: Remove the Website Builder page handlers that used the old review state**

```bash
git rm -r -q packages/api-website-builder-workflows/src/features \
  packages/api-website-builder-workflows/src/utils
```

Replace `packages/api-website-builder-workflows/src/WebsiteBuilderWorkflowsFeature.ts` with:

```ts
import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WebsiteBuilderPageSchemaFactory } from "./WebsiteBuilderPageSchemaFactory.js";

export const WebsiteBuilderWorkflowsFeature = createFeature({
    name: "WebsiteBuilderWorkflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated — check at register time (license is fresh
        // pre-register) so nothing wires up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Page handlers (system.workflow sync, publish and move rules, target delete) are rebuilt
        // as the `wb.page` target adapter in phase 2.
        container.register(WebsiteBuilderPageSchemaFactory);
    }
});
```

- [ ] **Step 7: Align package dependencies**

Run: `yarn adio 2>&1 | tail -40`
Remove every dependency it reports as unused and move test-only ones to `devDependencies`. Expected (verify against the output):
- `packages/api-workflows/package.json`: remove `@webiny/api-graphql` and `graphql`.
- `packages/api-headless-cms-workflows/package.json`: remove `@webiny/api`, `@webiny/error`, `@webiny/shared-aco`; move `@webiny/api-aco` to `devDependencies` (used by `__tests__/__handler/context.ts`).
- `packages/api-website-builder-workflows/package.json`: remove `@webiny/api`, `@webiny/api-aco`, `@webiny/api-workflows`, `@webiny/error`, `@webiny/shared-aco`.

Then run `node scripts/generateTsConfigsInPackages.js` and `yarn adio 2>&1 | tail -20` again; expected: no findings for these packages.

- [ ] **Step 8: Run the tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS (`registration.test.ts`, `WorkflowUseCases.test.ts`, `WorkflowMapper.test.ts`).
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS (`registration.test.ts`, `entrySystemSchema.test.ts`, `workflows/disallowUnpublishableModels.test.ts`).
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS (`wbPageSystem.test.ts`).
Run: `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 9: Build**

Run: `yarn build -p @webiny/api-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-headless-cms-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-website-builder-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-event-handler-core 2>&1 | tail -30`
Expected: all succeed.

- [ ] **Step 10: Commit**

Run the Global Constraints chain, then:

```bash
git commit -m "refactor(api-workflows): remove the old review state domain and GraphQL schema

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Workflow domain types, review step config schema and validator

**Files:**
- Create: `packages/api-workflows/src/domain/workflow/types.ts`
- Create: `packages/api-workflows/src/domain/workflow/reviewStepConfigSchema.ts`
- Create: `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts`
- Create: `packages/api-workflows/__tests__/__helpers/fixtures.ts`
- Create: `packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts`

**Interfaces:**
- Consumes: `WorkflowValidationError` (`~/domain/workflow/errors.js`, existing, constructor `(message: string)`, code `Workflows/Workflow/Validation`), `Result` (`@webiny/feature/api`), `zod`.
- Produces:
  - Types `Workflow`, `WorkflowValues`, `WorkflowStep`, `WorkflowStepNotification`, `WorkflowIdentity`, `ReviewStepConfig`, `ReviewStepAssignmentConfig`, `RoutingRule`, `RoutingRuleConditions`, `RoutingRuleFolderCondition`, `RoutingRuleTarget`, `RoutingStrategy`, `RoutingRuleTargetType`.
  - `reviewStepConfigSchema` (zod) and `parseReviewStepConfig(config: unknown): ReviewStepConfig | null`.
  - `REVIEW_STEP_TYPE = "review"`, `WorkflowValidator.validate(values: WorkflowValues): Result<WorkflowValues, WorkflowValidationError>`.

- [ ] **Step 1: Write the test fixtures**

Create `packages/api-workflows/__tests__/__helpers/fixtures.ts`:

```ts
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";

export const NOW = "2026-10-09T10:00:00.000Z";
export const REVIEW_TEAM_ID = "team-reviewers";
export const OTHER_TEAM_ID = "team-other";
export const ARTICLE_MODEL = "cms.article";

export interface ReviewStepFixtureParams {
    id: string;
    title: string;
    teams?: string[];
    allowManualPick?: boolean;
    rules?: unknown[];
}

export const createReviewStep = (params: ReviewStepFixtureParams): WorkflowStep => {
    return {
        id: params.id,
        title: params.title,
        color: "#3b82f6",
        type: "review",
        notifications: [],
        config: {
            teams: params.teams ?? [REVIEW_TEAM_ID],
            assignment: {
                strategy: "none",
                allowManualPick: params.allowManualPick ?? false,
                rules: params.rules ?? []
            }
        }
    };
};

export const createWorkflowValues = (overrides: Partial<WorkflowValues> = {}): WorkflowValues => {
    return {
        id: "workflow-1",
        name: "Article review",
        models: [ARTICLE_MODEL],
        steps: [
            createReviewStep({ id: "legal", title: "Legal review", allowManualPick: true }),
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ],
        ...overrides
    };
};
```

- [ ] **Step 2: Write the failing test**

Create `packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
import type { WorkflowValues } from "~/domain/workflow/types.js";
import { createReviewStep, createWorkflowValues } from "~tests/__helpers/fixtures.js";

const validationMessage = (values: WorkflowValues): string => {
    const result = WorkflowValidator.validate(values);
    if (result.isOk()) {
        throw new Error("Expected the workflow to be invalid.");
    }
    expect(result.error.code).toBe("Workflows/Workflow/Validation");
    return result.error.message;
};

describe("WorkflowValidator", () => {
    it("accepts a workflow with review steps", () => {
        const values = createWorkflowValues();

        const result = WorkflowValidator.validate(values);

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual(values);
    });

    it("requires a name", () => {
        expect(validationMessage(createWorkflowValues({ name: "  " }))).toBe(
            "Workflow name is required."
        );
    });

    it("requires exactly one model", () => {
        const expected = "A workflow must be bound to exactly one model.";
        expect(validationMessage(createWorkflowValues({ models: [] }))).toBe(expected);
        expect(validationMessage(createWorkflowValues({ models: ["cms.a", "cms.b"] }))).toBe(
            expected
        );
    });

    it("requires at least one step", () => {
        expect(validationMessage(createWorkflowValues({ steps: [] }))).toBe(
            "Add at least one step."
        );
    });

    it("requires unique step ids", () => {
        const steps = [
            createReviewStep({ id: "legal", title: "Legal review" }),
            createReviewStep({ id: "legal", title: "Second legal review" })
        ];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Step ID "legal" is used more than once.'
        );
    });

    it("accepts only review steps until step types are pluggable", () => {
        const steps = [{ ...createReviewStep({ id: "ai", title: "AI check" }), type: "ai" }];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Step "AI check" uses the step type "ai", which is not supported yet. Only "review" steps can be saved.'
        );
    });

    it("requires at least one team on a review step", () => {
        const steps = [createReviewStep({ id: "legal", title: "Legal review", teams: [] })];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Step "Legal review" needs at least one team.'
        );
    });

    it("requires a target on every routing rule", () => {
        const steps = [
            createReviewStep({
                id: "legal",
                title: "Legal review",
                rules: [{ id: "rule-1", conditions: {} }]
            })
        ];

        expect(validationMessage(createWorkflowValues({ steps }))).toBe(
            'Every routing rule in step "Legal review" needs a target.'
        );
    });

    it("rejects an invalid review config", () => {
        const step = createReviewStep({ id: "legal", title: "Legal review" });
        const steps = [
            {
                ...step,
                config: {
                    teams: ["team-a"],
                    assignment: { strategy: "random", allowManualPick: false, rules: [] }
                }
            }
        ];

        expect(validationMessage(createWorkflowValues({ steps }))).toMatch(
            /^Step "Legal review" has an invalid configuration: /
        );
    });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/workflow/WorkflowValidator.js`.

- [ ] **Step 4: Add the workflow domain types**

Create `packages/api-workflows/src/domain/workflow/types.ts`:

```ts
export interface WorkflowStepNotification {
    /** Notification transport id, e.g. "e-mail" (D44). */
    id: string;
}

export interface WorkflowStep {
    id: string;
    title: string;
    color: string;
    description?: string;
    /** Step type id. Phase 1a accepts only "review" (R7). */
    type: string;
    notifications: WorkflowStepNotification[];
    /** Validated by the step type's schema; for "review" see `ReviewStepConfig`. */
    config: unknown;
}

export interface WorkflowValues {
    id: string;
    name: string;
    /** Namespace ids, e.g. `["cms.article"]`; exactly one in v1 (D15). */
    models: string[];
    steps: WorkflowStep[];
}

export interface WorkflowIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface Workflow extends WorkflowValues {
    createdOn: string;
    savedOn: string;
    createdBy: WorkflowIdentity;
    savedBy: WorkflowIdentity;
}

export type RoutingStrategy = "none" | "roundRobin" | "leastLoaded";

export type RoutingRuleTargetType = "user" | "team";

export interface RoutingRuleFolderCondition {
    id: string;
    type: string;
    includeDescendants: boolean;
}

export interface RoutingRuleConditions {
    requesterUserId?: string;
    requesterTeamId?: string;
    folder?: RoutingRuleFolderCondition;
    modelId?: string;
}

export interface RoutingRuleTarget {
    type: RoutingRuleTargetType;
    id: string;
}

export interface RoutingRule {
    id: string;
    conditions: RoutingRuleConditions;
    target: RoutingRuleTarget;
}

export interface ReviewStepAssignmentConfig {
    strategy: RoutingStrategy;
    allowManualPick: boolean;
    /** Ordered; first match wins (spec 6). */
    rules: RoutingRule[];
}

export interface ReviewStepConfig {
    /** Team ids; at least one. */
    teams: string[];
    assignment: ReviewStepAssignmentConfig;
}
```

- [ ] **Step 5: Add the review step config schema**

Create `packages/api-workflows/src/domain/workflow/reviewStepConfigSchema.ts`:

```ts
import zod from "zod";
import type { ReviewStepConfig } from "./types.js";

const routingRuleFolderConditionSchema = zod.object({
    id: zod.string().min(1, "Folder ID is required."),
    type: zod.string().min(1, "Folder type is required."),
    includeDescendants: zod.boolean()
});

const routingRuleSchema = zod.object({
    id: zod.string().min(1, "Rule ID is required."),
    conditions: zod.object({
        requesterUserId: zod.string().min(1).optional(),
        requesterTeamId: zod.string().min(1).optional(),
        folder: routingRuleFolderConditionSchema.optional(),
        modelId: zod.string().min(1).optional()
    }),
    target: zod.object({
        type: zod.enum(["user", "team"]),
        id: zod.string().min(1, "Rule target ID is required.")
    })
});

/**
 * Config of a "review" step (spec 4.1). Validated in code until phase 5 adds the `StepType`
 * extension point; stored as JSON on the workflow and review models.
 */
export const reviewStepConfigSchema = zod.object({
    teams: zod.array(zod.string().min(1, "Team ID is required.")),
    assignment: zod.object({
        strategy: zod.enum(["none", "roundRobin", "leastLoaded"]),
        allowManualPick: zod.boolean(),
        rules: zod.array(routingRuleSchema)
    })
});

/** Parses a stored review step config; `null` when it does not match the schema. */
export const parseReviewStepConfig = (config: unknown): ReviewStepConfig | null => {
    const result = reviewStepConfigSchema.safeParse(config);
    return result.success ? result.data : null;
};
```

- [ ] **Step 6: Add the validator**

Create `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "./errors.js";
import { reviewStepConfigSchema } from "./reviewStepConfigSchema.js";
import type { ReviewStepConfig, WorkflowStep, WorkflowValues } from "./types.js";

/** The only step type phase 1a accepts; phase 5 replaces this check with the `StepType` registry. */
export const REVIEW_STEP_TYPE = "review";

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};

/**
 * Validates a workflow on create and update (one path, spec 4.1, D41, D108). Checks that need
 * storage (model already bound to another workflow) live in `StoreWorkflowUseCase`; the "model is
 * publishable" check is a `WorkflowBeforeCreate` / `WorkflowBeforeUpdate` handler in the CMS
 * workflows package.
 */
export class WorkflowValidator {
    public static validate(values: WorkflowValues): Result<WorkflowValues, WorkflowValidationError> {
        if (!values.id) {
            return fail("Workflow ID is required.");
        }
        if (!values.name || !values.name.trim()) {
            return fail("Workflow name is required.");
        }
        if (values.models.length !== 1 || !values.models[0]) {
            return fail("A workflow must be bound to exactly one model.");
        }
        if (values.steps.length === 0) {
            return fail("Add at least one step.");
        }

        const stepIds = new Set<string>();
        const steps: WorkflowStep[] = [];
        for (const step of values.steps) {
            const result = WorkflowValidator.validateStep(step, stepIds);
            if (result.isFail()) {
                return Result.fail(result.error);
            }
            steps.push(result.value);
        }

        return Result.ok({
            id: values.id,
            name: values.name.trim(),
            models: [...values.models],
            steps
        });
    }

    private static validateStep(
        step: WorkflowStep,
        stepIds: Set<string>
    ): Result<WorkflowStep, WorkflowValidationError> {
        if (!step.id) {
            return fail("Every step needs an ID.");
        }
        if (stepIds.has(step.id)) {
            return fail(`Step ID "${step.id}" is used more than once.`);
        }
        stepIds.add(step.id);

        if (!step.title || !step.title.trim()) {
            return fail(`Step "${step.id}" needs a title.`);
        }
        if (step.type !== REVIEW_STEP_TYPE) {
            return fail(
                `Step "${step.title}" uses the step type "${step.type}", which is not supported yet. Only "review" steps can be saved.`
            );
        }

        const config = WorkflowValidator.validateReviewConfig(step);
        if (config.isFail()) {
            return Result.fail(config.error);
        }

        return Result.ok({
            ...step,
            notifications: step.notifications ?? [],
            config: config.value
        });
    }

    private static validateReviewConfig(
        step: WorkflowStep
    ): Result<ReviewStepConfig, WorkflowValidationError> {
        const config: UnknownRecord = isRecord(step.config) ? step.config : {};
        const teams = Array.isArray(config.teams) ? config.teams : [];
        if (teams.length === 0) {
            return fail(`Step "${step.title}" needs at least one team.`);
        }

        const assignment: UnknownRecord = isRecord(config.assignment) ? config.assignment : {};
        const rules = Array.isArray(assignment.rules) ? assignment.rules : [];
        for (const rule of rules) {
            if (!isRecord(rule) || !isRecord(rule.target)) {
                return fail(`Every routing rule in step "${step.title}" needs a target.`);
            }
        }

        const parsed = reviewStepConfigSchema.safeParse(step.config);
        if (!parsed.success) {
            const [issue] = parsed.error.issues;
            return fail(
                `Step "${step.title}" has an invalid configuration: ${issue?.message ?? "unknown error"}`
            );
        }

        return Result.ok(parsed.data);
    }
}
```

- [ ] **Step 7: Run the test**

Run: `yarn test packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts 2>&1 | tail -50`
Expected: PASS (9 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add workflow domain types and validator

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 3: Replace the workflow model, repository, use cases and events

**Files:**
- Delete: `packages/api-workflows/src/domain/workflow/WorkflowMapper.ts`, `packages/api-workflows/src/domain/workflow/abstractions.ts`, `packages/api-workflows/src/domain/workflow/workflowModel.ts`, `packages/api-workflows/src/features/workflow/` (all six old folders), `packages/api-workflows/src/features/shared/abstractions.ts`, `packages/api-workflows/src/features/WorkflowModelProviders.ts`, `packages/api-workflows/__tests__/WorkflowMapper.test.ts`, `packages/api-workflows/__tests__/WorkflowUseCases.test.ts`, `packages/api-workflows/__tests__/mocks/`
- Modify: `packages/api-workflows/src/domain/workflow/errors.ts` (rewrite), `packages/api-workflows/src/WorkflowsFeature.ts`, `packages/api-workflows/__tests__/registration.test.ts`
- Create: `packages/api-workflows/src/domain/workflow/workflow.model.ts`
- Create: `packages/api-workflows/src/domain/workflow/abstractions/WorkflowModelProvider.ts`
- Create: `packages/api-workflows/src/domain/workflow/abstractions/WorkflowRepository.ts`
- Create: `packages/api-workflows/src/features/workflow/shared/WorkflowEntryMapper.ts`
- Create: `packages/api-workflows/src/features/workflow/shared/WorkflowModelProvider.ts`
- Create: `packages/api-workflows/src/features/workflow/shared/WorkflowRepository.ts`
- Create: `packages/api-workflows/src/features/workflow/shared/feature.ts`
- Create: `packages/api-workflows/src/features/workflow/events.ts`
- Create: `packages/api-workflows/src/features/workflow/GetWorkflow/{abstractions.ts,GetWorkflowUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/workflow/ListWorkflows/{abstractions.ts,ListWorkflowsUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/workflow/StoreWorkflow/{abstractions.ts,StoreWorkflowUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/workflow/DeleteWorkflow/{abstractions.ts,DeleteWorkflowUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingEventPublisher.ts`
- Create: `packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts`
- Modify (CMS): `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.ts`, `packages/api-headless-cms-workflows/src/features/Workflows/feature.ts`, `packages/api-headless-cms-workflows/__tests__/__workflows/workflow.ts`, `packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts`, `packages/api-headless-cms-workflows/__tests__/registration.test.ts`
- Create (CMS): `packages/api-headless-cms-workflows/src/features/Workflows/assertModelsPublishable.ts`, `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeUpdate.ts`

**Interfaces:**
- Consumes: `WorkflowValidator`, workflow types (Task 2); CMS `CreateEntryUseCase`, `UpdateEntryUseCase`, `GetEntryByIdUseCase`, `ListLatestEntriesUseCase`, `DeleteEntryUseCase` (`@webiny/api-headless-cms/features/contentEntry/{CreateEntry,UpdateEntry,GetEntryById,ListEntries,DeleteEntry}/index.js`), `GetModelUseCase`, `ModelFactory`, `EventPublisher`, `DomainEvent`, `IEventHandler`, `createIdentifier` / `parseIdentifier` (`@webiny/utils`), `CmsEntry`, `CmsEntryMeta`, `CmsIdentity`, `CmsModel` (`@webiny/api-headless-cms/types/index.js`).
- Produces:
  - Errors: `WorkflowNotFoundError` (`Workflows/Workflow/NotFound`, data `{ id }`), `WorkflowConflictError` (`Workflows/Workflow/Conflict`, data `{ savedOn, savedBy }`), `WorkflowValidationError` (`Workflows/Workflow/Validation`), `isWorkflowValidationError(error: unknown): error is WorkflowValidationError`, `WorkflowPersistenceError` (`Workflows/Workflow/Persistence`).
  - `WorkflowModelProvider.Interface { get(): Promise<CmsModel> }`.
  - `WorkflowRepository.Interface { get(id); list(params: WorkflowRepository.ListParams); create(values: WorkflowValues); update(values: WorkflowValues); delete(id) }`.
  - Use cases: `GetWorkflowUseCase.execute({ id })`, `ListWorkflowsUseCase.execute({ where?: { models_in? }, limit?, after? })` → `{ items: Workflow[]; meta: CmsEntryMeta }`, `StoreWorkflowUseCase.execute({ workflow: WorkflowValues; savedOn?: string | null })`, `DeleteWorkflowUseCase.execute({ id })`; all return `Result<…>`.
  - Events in `@webiny/api-workflows/features/workflow/events.js`: `WorkflowBeforeCreateEvent` / `WorkflowAfterCreateEvent` / `WorkflowBeforeUpdateEvent` / `WorkflowAfterUpdateEvent` / `WorkflowBeforeDeleteEvent` / `WorkflowAfterDeleteEvent` and their `…EventHandler` abstractions.
  - CMS: `assertModelsPublishable(getModel, models): Promise<void>`; handlers `DisallowUnpublishableModelsOnBeforeCreate`, `DisallowUnpublishableModelsOnBeforeUpdate`.

- [ ] **Step 1: Write the event recorder used by tests**

Create `packages/api-workflows/__tests__/__helpers/RecordingEventPublisher.ts`:

```ts
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import type { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";

/** Every event published while the decorator is registered. Reset it at the start of a test. */
export const recordedEvents: DomainEvent<any>[] = [];

/** Event types published by workflows, in order. */
export const workflowEventTypes = (): string[] => {
    return recordedEvents
        .map(event => event.eventType)
        .filter(eventType => eventType.startsWith("Workflows/"));
};

class RecordingEventPublisherImpl implements EventPublisher.Interface {
    constructor(private decoratee: EventPublisher.Interface) {}

    async publish<TEvent extends DomainEvent<any>>(event: TEvent): Promise<void> {
        recordedEvents.push(event);
        await this.decoratee.publish(event);
    }
}

export const RecordingEventPublisher = EventPublisher.createDecorator({
    decorator: RecordingEventPublisherImpl,
    dependencies: []
});
```

- [ ] **Step 2: Write the failing tests**

Create `packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { ARTICLE_MODEL, createWorkflowValues } from "~tests/__helpers/fixtures.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { ListWorkflowsUseCase } from "~/features/workflow/ListWorkflows/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

const STALE_SAVED_ON = "2000-01-01T00:00:00.000Z";

const createUseCases = async () => {
    recordedEvents.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(RecordingEventPublisher);
        }
    });

    return {
        storeWorkflow: context.container.resolve(StoreWorkflowUseCase),
        getWorkflow: context.container.resolve(GetWorkflowUseCase),
        listWorkflows: context.container.resolve(ListWorkflowsUseCase),
        deleteWorkflow: context.container.resolve(DeleteWorkflowUseCase)
    };
};

describe("Workflow use cases", () => {
    it("creates, reads, lists, updates and deletes a workflow", async () => {
        const { storeWorkflow, getWorkflow, listWorkflows, deleteWorkflow } =
            await createUseCases();
        const values = createWorkflowValues();

        const created = await storeWorkflow.execute({ workflow: values });
        expect(created.isOk()).toBe(true);
        expect(created.value).toMatchObject(values);
        expect(created.value.savedOn).toEqual(expect.any(String));
        expect(created.value.savedBy.id).toEqual(expect.any(String));

        const read = await getWorkflow.execute({ id: values.id });
        expect(read.value).toEqual(created.value);

        const listed = await listWorkflows.execute({ where: { models_in: [ARTICLE_MODEL] } });
        expect(listed.value.items.map(item => item.id)).toEqual([values.id]);

        const otherModel = await listWorkflows.execute({ where: { models_in: ["cms.other"] } });
        expect(otherModel.value.items).toEqual([]);

        const updated = await storeWorkflow.execute({
            workflow: { ...values, name: "Article review v2" },
            savedOn: created.value.savedOn
        });
        expect(updated.isOk()).toBe(true);
        expect(updated.value.name).toBe("Article review v2");

        const deleted = await deleteWorkflow.execute({ id: values.id });
        expect(deleted.isOk()).toBe(true);

        const afterDelete = await getWorkflow.execute({ id: values.id });
        expect(afterDelete.isFail()).toBe(true);
        expect(afterDelete.error.code).toBe("Workflows/Workflow/NotFound");

        expect(workflowEventTypes()).toEqual([
            "Workflows/Workflow/BeforeCreate",
            "Workflows/Workflow/AfterCreate",
            "Workflows/Workflow/BeforeUpdate",
            "Workflows/Workflow/AfterUpdate",
            "Workflows/Workflow/BeforeDelete",
            "Workflows/Workflow/AfterDelete"
        ]);
    });

    it("validates through the same path on create and update", async () => {
        const { storeWorkflow } = await createUseCases();

        const invalidCreate = await storeWorkflow.execute({
            workflow: createWorkflowValues({ steps: [] })
        });
        expect(invalidCreate.isFail()).toBe(true);
        expect(invalidCreate.error.code).toBe("Workflows/Workflow/Validation");
        expect(invalidCreate.error.message).toBe("Add at least one step.");

        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });
        const invalidUpdate = await storeWorkflow.execute({
            workflow: createWorkflowValues({ steps: [] }),
            savedOn: created.value.savedOn
        });
        expect(invalidUpdate.isFail()).toBe(true);
        expect(invalidUpdate.error.message).toBe("Add at least one step.");
        expect(workflowEventTypes()).toEqual([
            "Workflows/Workflow/BeforeCreate",
            "Workflows/Workflow/AfterCreate"
        ]);
    });

    it("rejects a save with a stale savedOn", async () => {
        const { storeWorkflow } = await createUseCases();
        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });

        const result = await storeWorkflow.execute({
            workflow: createWorkflowValues({ name: "Changed" }),
            savedOn: STALE_SAVED_ON
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Conflict");
        expect(result.error.data).toEqual({
            savedOn: created.value.savedOn,
            savedBy: created.value.savedBy
        });
    });

    it("rejects creating a workflow over an existing one", async () => {
        const { storeWorkflow } = await createUseCases();
        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });

        const result = await storeWorkflow.execute({ workflow: createWorkflowValues() });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Conflict");
        expect(result.error.data).toEqual({
            savedOn: created.value.savedOn,
            savedBy: created.value.savedBy
        });
    });

    it("does not recreate a workflow deleted while it was being edited", async () => {
        const { storeWorkflow, deleteWorkflow, getWorkflow } = await createUseCases();
        const created = await storeWorkflow.execute({ workflow: createWorkflowValues() });
        await deleteWorkflow.execute({ id: created.value.id });

        const result = await storeWorkflow.execute({
            workflow: createWorkflowValues({ name: "Changed" }),
            savedOn: created.value.savedOn
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/NotFound");
        expect(result.error.data).toEqual({ id: created.value.id });
        const read = await getWorkflow.execute({ id: created.value.id });
        expect(read.isFail()).toBe(true);
    });

    it("allows one workflow per model", async () => {
        const { storeWorkflow } = await createUseCases();
        await storeWorkflow.execute({ workflow: createWorkflowValues() });

        const result = await storeWorkflow.execute({
            workflow: createWorkflowValues({ id: "workflow-2", name: "Second review" })
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'The model "cms.article" already has a workflow: "Article review".'
        );
    });

    it("returns NotFound for unknown workflows", async () => {
        const { getWorkflow, deleteWorkflow } = await createUseCases();

        const read = await getWorkflow.execute({ id: "missing" });
        expect(read.isFail()).toBe(true);
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");

        const deleted = await deleteWorkflow.execute({ id: "missing" });
        expect(deleted.isFail()).toBe(true);
        expect(deleted.error.code).toBe("Workflows/Workflow/NotFound");
    });
});
```

Replace `packages/api-workflows/__tests__/registration.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

describe("WorkflowsFeature registration", () => {
    it("registers the workflow use cases once", async () => {
        const { context } = await createContextHandler();

        expect(context.container.resolveAll(StoreWorkflowUseCase)).toHaveLength(1);
        expect(context.container.resolveAll(DeleteWorkflowUseCase)).toHaveLength(1);
    });

    it("does not register the old workflow state model", async () => {
        const { context } = await createContextHandler();

        const result = await context.container.resolve(GetModelUseCase).execute("wbyWorkflowState");

        expect(result.isFail()).toBe(true);
    });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts 2>&1 | tail -50`
Expected: FAIL. The old `StoreWorkflowUseCase` expects `{ app, id, name, steps }`, so the first test fails on `expect(created.isOk()).toBe(true)` (`expected false to be true`), and the other tests fail on their first assertion.

- [ ] **Step 4: Delete the old workflow code**

```bash
git rm -r -q packages/api-workflows/src/domain/workflow/WorkflowMapper.ts \
  packages/api-workflows/src/domain/workflow/abstractions.ts \
  packages/api-workflows/src/domain/workflow/workflowModel.ts \
  packages/api-workflows/src/features/workflow \
  packages/api-workflows/src/features/shared/abstractions.ts \
  packages/api-workflows/src/features/WorkflowModelProviders.ts \
  packages/api-workflows/__tests__/WorkflowMapper.test.ts \
  packages/api-workflows/__tests__/WorkflowUseCases.test.ts \
  packages/api-workflows/__tests__/mocks
```

- [ ] **Step 5: Rewrite the workflow errors**

Replace `packages/api-workflows/src/domain/workflow/errors.ts` with:

```ts
import { BaseError } from "@webiny/feature/api";
import type { WorkflowIdentity } from "./types.js";

export interface WorkflowNotFoundErrorData {
    id: string;
}

export class WorkflowNotFoundError extends BaseError<WorkflowNotFoundErrorData> {
    override readonly code = "Workflows/Workflow/NotFound" as const;

    constructor(data: WorkflowNotFoundErrorData) {
        super({
            message: `Workflow "${data.id}" was not found.`,
            data
        });
    }
}

export interface WorkflowConflictErrorData {
    savedOn: string;
    savedBy: WorkflowIdentity;
}

/** The stored workflow changed after the caller loaded it (D131). */
export class WorkflowConflictError extends BaseError<WorkflowConflictErrorData> {
    override readonly code = "Workflows/Workflow/Conflict" as const;

    constructor(data: WorkflowConflictErrorData) {
        super({
            message: `The workflow was changed by ${data.savedBy.displayName} on ${data.savedOn}. Reload it to see the latest version.`,
            data
        });
    }
}

export class WorkflowValidationError extends BaseError {
    override readonly code = "Workflows/Workflow/Validation" as const;

    constructor(message: string) {
        super({
            message
        });
    }
}

/** Duck-typed so errors thrown by handlers in other packages are recognised. */
export const isWorkflowValidationError = (error: unknown): error is WorkflowValidationError => {
    return (
        error instanceof Error &&
        (error as Partial<WorkflowValidationError>).code === "Workflows/Workflow/Validation"
    );
};

export class WorkflowPersistenceError extends BaseError {
    override readonly code = "Workflows/Workflow/Persistence" as const;

    constructor(error: Error) {
        super({
            message: error.message
        });
    }
}
```

- [ ] **Step 6: Add the workflow model and its abstractions**

Create `packages/api-workflows/src/domain/workflow/workflow.model.ts`:

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

/**
 * Private model for workflows (spec 4.1). Validation lives in `WorkflowValidator`; the step
 * `config` is JSON so new step types need no model change.
 */
class WorkflowModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: WORKFLOW_MODEL_ID,
                    name: "Workflow"
                })
                .fields(fields => ({
                    name: fields.text().label("Name"),
                    models: fields.text().label("Models").list(),
                    steps: fields
                        .object()
                        .label("Steps")
                        .list()
                        .fields(stepFields => ({
                            id: stepFields.text().label("ID"),
                            title: stepFields.text().label("Title"),
                            color: stepFields.text().label("Color"),
                            description: stepFields.longText().label("Description"),
                            type: stepFields.text().label("Type"),
                            notifications: stepFields
                                .object()
                                .label("Notifications")
                                .list()
                                .fields(notificationFields => ({
                                    id: notificationFields.text().label("ID")
                                })),
                            config: stepFields.json().label("Config")
                        }))
                }))
        ];
    }
}

export const WorkflowModel = ModelFactory.createImplementation({
    implementation: WorkflowModelImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/domain/workflow/abstractions/WorkflowModelProvider.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowModelProvider {
    get(): Promise<CmsModel>;
}

/**
 * Provides the tenant's `wbyWorkflow` model. A provider rather than the model itself: fetching a
 * model is asynchronous and tenant-dependent, while DI resolution is synchronous.
 */
export const WorkflowModelProvider =
    createAbstraction<IWorkflowModelProvider>("WorkflowModelProvider");

export namespace WorkflowModelProvider {
    export type Interface = IWorkflowModelProvider;
}
```

Create `packages/api-workflows/src/domain/workflow/abstractions/WorkflowRepository.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { Workflow, WorkflowValues } from "../types.js";
import type { WorkflowNotFoundError, WorkflowPersistenceError } from "../errors.js";

export interface WorkflowRepositoryListWhere {
    /** Workflows bound to any of these namespace ids. */
    models_in?: string[];
}

export interface WorkflowRepositoryListParams {
    where?: WorkflowRepositoryListWhere;
    limit?: number;
    after?: string | null;
}

export interface WorkflowRepositoryListResult {
    items: Workflow[];
    meta: CmsEntryMeta;
}

export interface IWorkflowRepository {
    get(id: string): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>>;
    list(
        params: WorkflowRepositoryListParams
    ): Promise<Result<WorkflowRepositoryListResult, WorkflowPersistenceError>>;
    create(values: WorkflowValues): Promise<Result<Workflow, WorkflowPersistenceError>>;
    update(
        values: WorkflowValues
    ): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>>;
    delete(id: string): Promise<Result<void, WorkflowNotFoundError | WorkflowPersistenceError>>;
}

/** Reads and writes workflows (entries of the private `wbyWorkflow` model, always revision 1). */
export const WorkflowRepository = createAbstraction<IWorkflowRepository>("WorkflowRepository");

export namespace WorkflowRepository {
    export type Interface = IWorkflowRepository;
    export type ListParams = WorkflowRepositoryListParams;
    export type ListWhere = WorkflowRepositoryListWhere;
    export type ListResult = WorkflowRepositoryListResult;
}
```

- [ ] **Step 7: Add the shared workflow implementations**

Create `packages/api-workflows/src/features/workflow/shared/WorkflowEntryMapper.ts`:

```ts
import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry, CmsIdentity } from "@webiny/api-headless-cms/types/index.js";
import type {
    Workflow,
    WorkflowIdentity,
    WorkflowStep,
    WorkflowStepNotification,
    WorkflowValues
} from "~/domain/workflow/types.js";

export interface WorkflowEntryStep {
    id: string;
    title: string;
    color: string | null;
    description: string | null;
    type: string;
    notifications: WorkflowStepNotification[] | null;
    config: unknown;
}

export interface WorkflowEntryValues {
    name: string;
    models: string[] | null;
    steps: WorkflowEntryStep[] | null;
}

const toIdentity = (identity: CmsIdentity): WorkflowIdentity => {
    return {
        id: identity.id,
        displayName: identity.displayName,
        type: identity.type
    };
};

/** Maps workflows to and from `wbyWorkflow` entries. */
export class WorkflowEntryMapper {
    public static toValues(values: WorkflowValues): WorkflowEntryValues {
        return {
            name: values.name,
            models: [...values.models],
            steps: values.steps.map(step => ({
                id: step.id,
                title: step.title,
                color: step.color,
                description: step.description ?? null,
                type: step.type,
                notifications: step.notifications.map(notification => ({ id: notification.id })),
                config: step.config
            }))
        };
    }

    public static fromEntry(entry: CmsEntry<WorkflowEntryValues>): Workflow {
        const { id } = parseIdentifier(entry.id);
        return {
            id,
            name: entry.values.name,
            models: entry.values.models ?? [],
            steps: (entry.values.steps ?? []).map(step => WorkflowEntryMapper.stepFromEntry(step)),
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            createdBy: toIdentity(entry.createdBy),
            savedBy: toIdentity(entry.savedBy)
        };
    }

    private static stepFromEntry(step: WorkflowEntryStep): WorkflowStep {
        return {
            id: step.id,
            title: step.title,
            color: step.color ?? "",
            ...(step.description ? { description: step.description } : {}),
            type: step.type,
            notifications: (step.notifications ?? []).map(notification => ({
                id: notification.id
            })),
            config: step.config ?? null
        };
    }
}
```

Create `packages/api-workflows/src/features/workflow/shared/WorkflowModelProvider.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowModelProvider as Abstraction } from "~/domain/workflow/abstractions/WorkflowModelProvider.js";
import { WORKFLOW_MODEL_ID } from "~/constants.js";

/**
 * No memoization (`ModelsFetcher` caches the model list per request) and no
 * `withoutAuthorization` (private models skip model authorization). Same as `FileModelProvider`
 * in api-file-manager.
 */
class WorkflowModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(WORKFLOW_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const WorkflowModelProvider = Abstraction.createImplementation({
    implementation: WorkflowModelProviderImpl,
    dependencies: [GetModelUseCase]
});
```

Create `packages/api-workflows/src/features/workflow/shared/WorkflowRepository.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { WorkflowModelProvider } from "~/domain/workflow/abstractions/WorkflowModelProvider.js";
import { WorkflowRepository as Abstraction } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowNotFoundError, WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import type { Workflow, WorkflowValues } from "~/domain/workflow/types.js";
import { WorkflowEntryMapper, type WorkflowEntryValues } from "./WorkflowEntryMapper.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";

class WorkflowRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: WorkflowModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface,
        private deleteEntry: DeleteEntryUseCase.Interface
    ) {}

    async get(id: string): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.getEntryById.execute<WorkflowEntryValues>(
            model,
            createIdentifier({ id, version: 1 })
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new WorkflowNotFoundError({ id }));
            }
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok(WorkflowEntryMapper.fromEntry(result.value));
    }

    async list(
        params: Abstraction.ListParams
    ): Promise<Result<Abstraction.ListResult, WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const where: CmsEntryListWhere | undefined = params.where?.models_in
            ? { values: { models_in: params.where.models_in } }
            : undefined;

        const result = await this.listLatestEntries.execute<WorkflowEntryValues>(model, {
            where,
            sort: ["createdOn_ASC"],
            limit: params.limit ?? 100,
            after: params.after ?? null
        });
        if (result.isFail()) {
            return Result.fail(new WorkflowPersistenceError(result.error));
        }

        return Result.ok({
            items: result.value.entries.map(entry => WorkflowEntryMapper.fromEntry(entry)),
            meta: result.value.meta
        });
    }

    async create(values: WorkflowValues): Promise<Result<Workflow, WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.createEntry.execute<WorkflowEntryValues>(model, {
            id: values.id,
            values: WorkflowEntryMapper.toValues(values)
        });
        if (result.isFail()) {
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok(WorkflowEntryMapper.fromEntry(result.value));
    }

    async update(
        values: WorkflowValues
    ): Promise<Result<Workflow, WorkflowNotFoundError | WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.updateEntry.execute<WorkflowEntryValues>(
            model,
            createIdentifier({ id: values.id, version: 1 }),
            { values: WorkflowEntryMapper.toValues(values) }
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new WorkflowNotFoundError({ id: values.id }));
            }
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok(WorkflowEntryMapper.fromEntry(result.value));
    }

    async delete(id: string): Promise<Result<void, WorkflowNotFoundError | WorkflowPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.deleteEntry.execute(model, createIdentifier({ id, version: 1 }), {
            permanently: true
        });
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new WorkflowNotFoundError({ id }));
            }
            return Result.fail(new WorkflowPersistenceError(result.error));
        }
        return Result.ok();
    }
}

export const WorkflowRepository = Abstraction.createImplementation({
    implementation: WorkflowRepositoryImpl,
    dependencies: [
        WorkflowModelProvider,
        GetEntryByIdUseCase,
        ListLatestEntriesUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase,
        DeleteEntryUseCase
    ]
});
```

Create `packages/api-workflows/src/features/workflow/shared/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { WorkflowModelProvider } from "./WorkflowModelProvider.js";
import { WorkflowRepository } from "./WorkflowRepository.js";

export const WorkflowSharedFeature = createFeature({
    name: "Workflows/WorkflowShared",
    register(container) {
        container.register(WorkflowModelProvider);
        container.register(WorkflowRepository).inSingletonScope();
    }
});
```

- [ ] **Step 8: Add the workflow events**

Create `packages/api-workflows/src/features/workflow/events.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { Workflow, WorkflowValues } from "~/domain/workflow/types.js";

// ============================================================================
// WorkflowBeforeCreate
// ============================================================================

export interface WorkflowBeforeCreatePayload {
    workflow: WorkflowValues;
}

export class WorkflowBeforeCreateEvent extends DomainEvent<WorkflowBeforeCreatePayload> {
    eventType = "Workflows/Workflow/BeforeCreate" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeCreateEventHandler;
    }
}

/** Hook in before a workflow is created. Throw `WorkflowValidationError` to reject the save. */
export const WorkflowBeforeCreateEventHandler = createAbstraction<
    IEventHandler<WorkflowBeforeCreateEvent>
>("WorkflowBeforeCreateEventHandler");

export namespace WorkflowBeforeCreateEventHandler {
    export type Interface = IEventHandler<WorkflowBeforeCreateEvent>;
    export type Event = WorkflowBeforeCreateEvent;
}

// ============================================================================
// WorkflowAfterCreate
// ============================================================================

export interface WorkflowAfterCreatePayload {
    workflow: Workflow;
}

export class WorkflowAfterCreateEvent extends DomainEvent<WorkflowAfterCreatePayload> {
    eventType = "Workflows/Workflow/AfterCreate" as const;

    getHandlerAbstraction() {
        return WorkflowAfterCreateEventHandler;
    }
}

/** Hook in after a workflow is created. */
export const WorkflowAfterCreateEventHandler = createAbstraction<
    IEventHandler<WorkflowAfterCreateEvent>
>("WorkflowAfterCreateEventHandler");

export namespace WorkflowAfterCreateEventHandler {
    export type Interface = IEventHandler<WorkflowAfterCreateEvent>;
    export type Event = WorkflowAfterCreateEvent;
}

// ============================================================================
// WorkflowBeforeUpdate
// ============================================================================

export interface WorkflowBeforeUpdatePayload {
    original: Workflow;
    workflow: WorkflowValues;
}

export class WorkflowBeforeUpdateEvent extends DomainEvent<WorkflowBeforeUpdatePayload> {
    eventType = "Workflows/Workflow/BeforeUpdate" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeUpdateEventHandler;
    }
}

/** Hook in before a workflow is updated. Throw `WorkflowValidationError` to reject the save. */
export const WorkflowBeforeUpdateEventHandler = createAbstraction<
    IEventHandler<WorkflowBeforeUpdateEvent>
>("WorkflowBeforeUpdateEventHandler");

export namespace WorkflowBeforeUpdateEventHandler {
    export type Interface = IEventHandler<WorkflowBeforeUpdateEvent>;
    export type Event = WorkflowBeforeUpdateEvent;
}

// ============================================================================
// WorkflowAfterUpdate
// ============================================================================

export interface WorkflowAfterUpdatePayload {
    original: Workflow;
    workflow: Workflow;
}

export class WorkflowAfterUpdateEvent extends DomainEvent<WorkflowAfterUpdatePayload> {
    eventType = "Workflows/Workflow/AfterUpdate" as const;

    getHandlerAbstraction() {
        return WorkflowAfterUpdateEventHandler;
    }
}

/** Hook in after a workflow is updated. */
export const WorkflowAfterUpdateEventHandler = createAbstraction<
    IEventHandler<WorkflowAfterUpdateEvent>
>("WorkflowAfterUpdateEventHandler");

export namespace WorkflowAfterUpdateEventHandler {
    export type Interface = IEventHandler<WorkflowAfterUpdateEvent>;
    export type Event = WorkflowAfterUpdateEvent;
}

// ============================================================================
// WorkflowBeforeDelete
// ============================================================================

export interface WorkflowBeforeDeletePayload {
    workflow: Workflow;
}

export class WorkflowBeforeDeleteEvent extends DomainEvent<WorkflowBeforeDeletePayload> {
    eventType = "Workflows/Workflow/BeforeDelete" as const;

    getHandlerAbstraction() {
        return WorkflowBeforeDeleteEventHandler;
    }
}

/** Hook in before a workflow is deleted. */
export const WorkflowBeforeDeleteEventHandler = createAbstraction<
    IEventHandler<WorkflowBeforeDeleteEvent>
>("WorkflowBeforeDeleteEventHandler");

export namespace WorkflowBeforeDeleteEventHandler {
    export type Interface = IEventHandler<WorkflowBeforeDeleteEvent>;
    export type Event = WorkflowBeforeDeleteEvent;
}

// ============================================================================
// WorkflowAfterDelete
// ============================================================================

export interface WorkflowAfterDeletePayload {
    workflow: Workflow;
}

export class WorkflowAfterDeleteEvent extends DomainEvent<WorkflowAfterDeletePayload> {
    eventType = "Workflows/Workflow/AfterDelete" as const;

    getHandlerAbstraction() {
        return WorkflowAfterDeleteEventHandler;
    }
}

/** Hook in after a workflow is deleted. */
export const WorkflowAfterDeleteEventHandler = createAbstraction<
    IEventHandler<WorkflowAfterDeleteEvent>
>("WorkflowAfterDeleteEventHandler");

export namespace WorkflowAfterDeleteEventHandler {
    export type Interface = IEventHandler<WorkflowAfterDeleteEvent>;
    export type Event = WorkflowAfterDeleteEvent;
}
```

- [ ] **Step 9: Add `GetWorkflow`**

Create `packages/api-workflows/src/features/workflow/GetWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import type {
    WorkflowNotFoundError,
    WorkflowPersistenceError
} from "~/domain/workflow/errors.js";

export interface GetWorkflowInput {
    id: string;
}

export interface IGetWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IGetWorkflowUseCaseErrors[keyof IGetWorkflowUseCaseErrors];

export interface IGetWorkflowUseCase {
    execute(input: GetWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/** Get one workflow by id. No permission check in 1a (phase 1b). */
export const GetWorkflowUseCase = createAbstraction<IGetWorkflowUseCase>("GetWorkflowUseCase");

export namespace GetWorkflowUseCase {
    export type Interface = IGetWorkflowUseCase;
    export type Input = GetWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/workflow/GetWorkflow/GetWorkflowUseCase.ts`:

```ts
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { GetWorkflowUseCase as UseCase } from "./abstractions.js";

class GetWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        return this.repository.get(input.id);
    }
}

export const GetWorkflowUseCase = UseCase.createImplementation({
    implementation: GetWorkflowUseCaseImpl,
    dependencies: [WorkflowRepository]
});
```

Create `packages/api-workflows/src/features/workflow/GetWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetWorkflowUseCase } from "./GetWorkflowUseCase.js";

export const GetWorkflowFeature = createFeature({
    name: "Workflows/GetWorkflow",
    register(container) {
        container.register(GetWorkflowUseCase);
    }
});
```

Create `packages/api-workflows/src/features/workflow/GetWorkflow/index.ts`:

```ts
export { GetWorkflowUseCase } from "./abstractions.js";
export type { GetWorkflowInput } from "./abstractions.js";
```

- [ ] **Step 10: Add `ListWorkflows`**

Create `packages/api-workflows/src/features/workflow/ListWorkflows/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { CmsEntryMeta } from "@webiny/api-headless-cms/types/index.js";
import type { Workflow } from "~/domain/workflow/types.js";
import type { WorkflowPersistenceError } from "~/domain/workflow/errors.js";

export interface ListWorkflowsWhere {
    models_in?: string[];
}

export interface ListWorkflowsInput {
    where?: ListWorkflowsWhere;
    limit?: number;
    after?: string | null;
}

export interface ListWorkflowsResult {
    items: Workflow[];
    meta: CmsEntryMeta;
}

export interface IListWorkflowsUseCaseErrors {
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IListWorkflowsUseCaseErrors[keyof IListWorkflowsUseCaseErrors];

export interface IListWorkflowsUseCase {
    execute(input?: ListWorkflowsInput): Promise<Result<ListWorkflowsResult, UseCaseError>>;
}

/** List workflows, optionally by bound model. No permission check in 1a (phase 1b). */
export const ListWorkflowsUseCase =
    createAbstraction<IListWorkflowsUseCase>("ListWorkflowsUseCase");

export namespace ListWorkflowsUseCase {
    export type Interface = IListWorkflowsUseCase;
    export type Input = ListWorkflowsInput;
    export type Where = ListWorkflowsWhere;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ListWorkflowsResult, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/workflow/ListWorkflows/ListWorkflowsUseCase.ts`:

```ts
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { ListWorkflowsUseCase as UseCase } from "./abstractions.js";

class ListWorkflowsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowRepository.Interface) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
        return this.repository.list({
            where: input.where,
            limit: input.limit,
            after: input.after
        });
    }
}

export const ListWorkflowsUseCase = UseCase.createImplementation({
    implementation: ListWorkflowsUseCaseImpl,
    dependencies: [WorkflowRepository]
});
```

Create `packages/api-workflows/src/features/workflow/ListWorkflows/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListWorkflowsUseCase } from "./ListWorkflowsUseCase.js";

export const ListWorkflowsFeature = createFeature({
    name: "Workflows/ListWorkflows",
    register(container) {
        container.register(ListWorkflowsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/workflow/ListWorkflows/index.ts`:

```ts
export { ListWorkflowsUseCase } from "./abstractions.js";
export type { ListWorkflowsInput, ListWorkflowsResult, ListWorkflowsWhere } from "./abstractions.js";
```

- [ ] **Step 11: Add `StoreWorkflow`**

Create `packages/api-workflows/src/features/workflow/StoreWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow, WorkflowValues } from "~/domain/workflow/types.js";
import type {
    WorkflowConflictError,
    WorkflowNotFoundError,
    WorkflowPersistenceError,
    WorkflowValidationError
} from "~/domain/workflow/errors.js";

export interface StoreWorkflowInput {
    workflow: WorkflowValues;
    /** The `savedOn` the caller loaded. Omit when creating a new workflow (D131). */
    savedOn?: string | null;
}

export interface IStoreWorkflowUseCaseErrors {
    validation: WorkflowValidationError;
    conflict: WorkflowConflictError;
    notFound: WorkflowNotFoundError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IStoreWorkflowUseCaseErrors[keyof IStoreWorkflowUseCaseErrors];

export interface IStoreWorkflowUseCase {
    execute(input: StoreWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/**
 * Create or update a workflow through one validation path, with an optimistic `savedOn` check
 * on updates. No permission check in 1a (`editor` is enforced in phase 1b).
 */
export const StoreWorkflowUseCase =
    createAbstraction<IStoreWorkflowUseCase>("StoreWorkflowUseCase");

export namespace StoreWorkflowUseCase {
    export type Interface = IStoreWorkflowUseCase;
    export type Input = StoreWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
import {
    isWorkflowValidationError,
    WorkflowConflictError,
    WorkflowNotFoundError,
    type WorkflowPersistenceError,
    WorkflowValidationError
} from "~/domain/workflow/errors.js";
import type { Workflow, WorkflowValues } from "~/domain/workflow/types.js";
import {
    WorkflowAfterCreateEvent,
    WorkflowAfterUpdateEvent,
    WorkflowBeforeCreateEvent,
    WorkflowBeforeUpdateEvent
} from "../events.js";
import { StoreWorkflowUseCase as UseCase } from "./abstractions.js";

const WORKFLOW_NOT_FOUND = "Workflows/Workflow/NotFound";

class StoreWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: WorkflowRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const validation = WorkflowValidator.validate(input.workflow);
        if (validation.isFail()) {
            return Result.fail(validation.error);
        }
        const values = validation.value;

        const existingResult = await this.repository.get(values.id);
        if (existingResult.isFail() && existingResult.error.code !== WORKFLOW_NOT_FOUND) {
            return Result.fail(existingResult.error);
        }
        const existing = existingResult.isOk() ? existingResult.value : null;

        if (existing && existing.savedOn !== input.savedOn) {
            return Result.fail(
                new WorkflowConflictError({
                    savedOn: existing.savedOn,
                    savedBy: existing.savedBy
                })
            );
        }
        if (!existing && input.savedOn) {
            // No tombstone: the caller only learns that the workflow no longer exists (D123).
            return Result.fail(new WorkflowNotFoundError({ id: values.id }));
        }

        const modelIsFree = await this.ensureModelIsFree(values);
        if (modelIsFree.isFail()) {
            return Result.fail(modelIsFree.error);
        }

        if (existing) {
            return this.update(existing, values);
        }
        return this.create(values);
    }

    private async create(values: WorkflowValues): UseCase.Return {
        const before = await this.publishBefore(new WorkflowBeforeCreateEvent({ workflow: values }));
        if (before.isFail()) {
            return Result.fail(before.error);
        }

        const result = await this.repository.create(values);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new WorkflowAfterCreateEvent({ workflow: result.value }));
        return Result.ok(result.value);
    }

    private async update(original: Workflow, values: WorkflowValues): UseCase.Return {
        const before = await this.publishBefore(
            new WorkflowBeforeUpdateEvent({ original, workflow: values })
        );
        if (before.isFail()) {
            return Result.fail(before.error);
        }

        const result = await this.repository.update(values);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new WorkflowAfterUpdateEvent({ original, workflow: result.value })
        );
        return Result.ok(result.value);
    }

    /** v1: one workflow per model; the race between two saves is accepted (D41). */
    private async ensureModelIsFree(
        values: WorkflowValues
    ): Promise<Result<void, WorkflowValidationError | WorkflowPersistenceError>> {
        const result = await this.repository.list({
            where: { models_in: values.models },
            limit: 10
        });
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const other = result.value.items.find(item => item.id !== values.id);
        if (!other) {
            return Result.ok();
        }
        const model = other.models.find(item => values.models.includes(item)) ?? values.models[0];
        return Result.fail(
            new WorkflowValidationError(
                `The model "${model}" already has a workflow: "${other.name}".`
            )
        );
    }

    /** Before handlers reject a save by throwing `WorkflowValidationError`. */
    private async publishBefore(
        event: WorkflowBeforeCreateEvent | WorkflowBeforeUpdateEvent
    ): Promise<Result<void, WorkflowValidationError>> {
        try {
            await this.eventPublisher.publish(event);
            return Result.ok();
        } catch (error) {
            if (isWorkflowValidationError(error)) {
                return Result.fail(error);
            }
            throw error;
        }
    }
}

export const StoreWorkflowUseCase = UseCase.createImplementation({
    implementation: StoreWorkflowUseCaseImpl,
    dependencies: [WorkflowRepository, EventPublisher]
});
```

Create `packages/api-workflows/src/features/workflow/StoreWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StoreWorkflowUseCase } from "./StoreWorkflowUseCase.js";

export const StoreWorkflowFeature = createFeature({
    name: "Workflows/StoreWorkflow",
    register(container) {
        container.register(StoreWorkflowUseCase);
    }
});
```

Create `packages/api-workflows/src/features/workflow/StoreWorkflow/index.ts`:

```ts
export { StoreWorkflowUseCase } from "./abstractions.js";
export type { StoreWorkflowInput } from "./abstractions.js";
```

- [ ] **Step 12: Add `DeleteWorkflow`**

Create `packages/api-workflows/src/features/workflow/DeleteWorkflow/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import type {
    WorkflowNotFoundError,
    WorkflowPersistenceError
} from "~/domain/workflow/errors.js";

export interface DeleteWorkflowInput {
    id: string;
}

export interface IDeleteWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IDeleteWorkflowUseCaseErrors[keyof IDeleteWorkflowUseCaseErrors];

export interface IDeleteWorkflowUseCase {
    execute(input: DeleteWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/** Delete a workflow. No permission check in 1a (phase 1b). */
export const DeleteWorkflowUseCase =
    createAbstraction<IDeleteWorkflowUseCase>("DeleteWorkflowUseCase");

export namespace DeleteWorkflowUseCase {
    export type Interface = IDeleteWorkflowUseCase;
    export type Input = DeleteWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/workflow/DeleteWorkflow/DeleteWorkflowUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { WorkflowAfterDeleteEvent, WorkflowBeforeDeleteEvent } from "../events.js";
import { DeleteWorkflowUseCase as UseCase } from "./abstractions.js";

class DeleteWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: WorkflowRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const existing = await this.repository.get(input.id);
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }
        const workflow = existing.value;

        await this.eventPublisher.publish(new WorkflowBeforeDeleteEvent({ workflow }));

        const result = await this.repository.delete(workflow.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new WorkflowAfterDeleteEvent({ workflow }));
        return Result.ok(workflow);
    }
}

export const DeleteWorkflowUseCase = UseCase.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [WorkflowRepository, EventPublisher]
});
```

Create `packages/api-workflows/src/features/workflow/DeleteWorkflow/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { DeleteWorkflowUseCase } from "./DeleteWorkflowUseCase.js";

export const DeleteWorkflowFeature = createFeature({
    name: "Workflows/DeleteWorkflow",
    register(container) {
        container.register(DeleteWorkflowUseCase);
    }
});
```

Create `packages/api-workflows/src/features/workflow/DeleteWorkflow/index.ts`:

```ts
export { DeleteWorkflowUseCase } from "./abstractions.js";
export type { DeleteWorkflowInput } from "./abstractions.js";
```

- [ ] **Step 13: Register the new workflow features**

Replace `packages/api-workflows/src/WorkflowsFeature.ts` with:

```ts
import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowModel } from "~/domain/workflow/workflow.model.js";
import { ListNotificationTypesFeature } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransportFeature } from "~/features/notifications/NotificationTransport/index.js";
import { WorkflowSharedFeature } from "~/features/workflow/shared/feature.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated. Check the effective flag at register time
        // (the license is refreshed pre-register) so nothing is wired up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Private CMS models, registered early so HeadlessCmsInitializerImpl picks them up when
        // it builds the model list during the enhance phase.
        container.register(WorkflowModel);

        // Notifications (unchanged until phase 7)
        ListNotificationTypesFeature.register(container);
        NotificationTransportFeature.register(container);

        // Workflows
        WorkflowSharedFeature.register(container);
        GetWorkflowFeature.register(container);
        ListWorkflowsFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);
    }
});
```

- [ ] **Step 14: Run the api-workflows tests**

Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS (`registration.test.ts`, `domain/WorkflowValidator.test.ts`, `workflow/WorkflowUseCases.test.ts`).
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 15: Re-point the CMS publishable-model check (failing test first)**

Replace `packages/api-headless-cms-workflows/__tests__/__workflows/workflow.ts` with:

```ts
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { model } from "~tests/__cms/models.js";

export const createWorkflowValues = (
    models: string[] = [`cms.${model.modelId}`]
): WorkflowValues => {
    return {
        id: "workflow-1",
        name: "Test Workflow",
        models,
        steps: [
            {
                id: "step-1",
                title: "Step 1",
                description: "This is step 1",
                color: "blue",
                type: "review",
                notifications: [{ id: "e-mail" }],
                config: {
                    teams: ["team-1"],
                    assignment: { strategy: "none", allowManualPick: false, rules: [] }
                }
            }
        ]
    };
};

export const storeWorkflow = async (
    context: CmsContext,
    values: WorkflowValues = createWorkflowValues(),
    savedOn?: string
) => {
    return context.container.resolve(StoreWorkflowUseCase).execute({ workflow: values, savedOn });
};
```

Replace `packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__handler/context.js";
import { model as modelDefinition } from "~tests/__cms/models.js";
import { createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";

const expectedMessage = `Cannot bind a workflow to the model "${modelDefinition.modelId}" because it is marked as unpublishable.`;

const createUnpublishableContext = async () => {
    const { context } = createContextHandler({
        modifyModel: model => {
            return {
                ...model,
                tags: ["$publishing:false"]
            };
        }
    });
    return context();
};

describe("Disallow unpublishable models", () => {
    it("rejects creating a workflow for an unpublishable model", async () => {
        const context = await createUnpublishableContext();

        const result = await storeWorkflow(context);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
    });

    it("rejects binding an existing workflow to an unpublishable model", async () => {
        const context = await createUnpublishableContext();
        const created = await storeWorkflow(context, createWorkflowValues(["wb.page"]));
        expect(created.isOk()).toBe(true);

        const result = await storeWorkflow(context, createWorkflowValues(), created.value.savedOn);

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(expectedMessage);
    });

    it("allows a workflow for a publishable model", async () => {
        const { context } = createContextHandler();

        const result = await storeWorkflow(await context());

        expect(result.isOk()).toBe(true);
    });
});
```

Replace `packages/api-headless-cms-workflows/__tests__/registration.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { createContextHandler } from "./__handler/context.js";

describe("CmsWorkflowsFeature registration", () => {
    it("registers the core workflows feature only once", async () => {
        const { context } = createContextHandler();
        const ctx = await context();

        expect(ctx.container.resolveAll(StoreWorkflowUseCase)).toHaveLength(1);
    });
});
```

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: FAIL to compile/run `src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.ts`: `@webiny/api-workflows/features/workflow/CreateWorkflow/events.js` no longer exists.

- [ ] **Step 16: Implement the CMS handlers on the new events**

Create `packages/api-headless-cms-workflows/src/features/Workflows/assertModelsPublishable.ts`:

```ts
import type { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowValidationError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { getModelIdFromAppName } from "~/utils/appName.js";

/**
 * Spec 4.1: a workflow can only bind publishable models. Throws `WorkflowValidationError`, which
 * `StoreWorkflowUseCase` returns as a failed result. Non-CMS namespaces (e.g. `wb.page`) are
 * skipped.
 */
export const assertModelsPublishable = async (
    getModel: GetModelUseCase.Interface,
    models: string[]
): Promise<void> => {
    for (const namespaceId of models) {
        const modelId = getModelIdFromAppName(namespaceId);
        if (!modelId) {
            continue;
        }
        const model = await getModel.execute(modelId);
        if (model.isFail()) {
            continue;
        }
        const tags = model.value.tags || [];
        if (!tags.includes("$publishing:false")) {
            continue;
        }
        throw new WorkflowValidationError(
            `Cannot bind a workflow to the model "${modelId}" because it is marked as unpublishable.`
        );
    }
};
```

Replace `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.ts` with:

```ts
import { WorkflowBeforeCreateEventHandler } from "@webiny/api-workflows/features/workflow/events.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { assertModelsPublishable } from "../assertModelsPublishable.js";

class DisallowUnpublishableModelsOnBeforeCreateImpl
    implements WorkflowBeforeCreateEventHandler.Interface
{
    public constructor(private getModel: GetModelUseCase.Interface) {}

    public async handle(event: WorkflowBeforeCreateEventHandler.Event): Promise<void> {
        await assertModelsPublishable(this.getModel, event.payload.workflow.models);
    }
}

export const DisallowUnpublishableModelsOnBeforeCreate =
    WorkflowBeforeCreateEventHandler.createImplementation({
        implementation: DisallowUnpublishableModelsOnBeforeCreateImpl,
        dependencies: [GetModelUseCase]
    });
```

Create `packages/api-headless-cms-workflows/src/features/Workflows/handlers/DisallowUnpublishableModelsOnBeforeUpdate.ts`:

```ts
import { WorkflowBeforeUpdateEventHandler } from "@webiny/api-workflows/features/workflow/events.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { assertModelsPublishable } from "../assertModelsPublishable.js";

class DisallowUnpublishableModelsOnBeforeUpdateImpl
    implements WorkflowBeforeUpdateEventHandler.Interface
{
    public constructor(private getModel: GetModelUseCase.Interface) {}

    public async handle(event: WorkflowBeforeUpdateEventHandler.Event): Promise<void> {
        await assertModelsPublishable(this.getModel, event.payload.workflow.models);
    }
}

export const DisallowUnpublishableModelsOnBeforeUpdate =
    WorkflowBeforeUpdateEventHandler.createImplementation({
        implementation: DisallowUnpublishableModelsOnBeforeUpdateImpl,
        dependencies: [GetModelUseCase]
    });
```

Replace `packages/api-headless-cms-workflows/src/features/Workflows/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { DisallowUnpublishableModelsOnBeforeCreate } from "./handlers/DisallowUnpublishableModelsOnBeforeCreate.js";
import { DisallowUnpublishableModelsOnBeforeUpdate } from "./handlers/DisallowUnpublishableModelsOnBeforeUpdate.js";

export const WorkflowsFeature = createFeature({
    name: "CmsWorkflows",
    register(container) {
        container.register(DisallowUnpublishableModelsOnBeforeCreate);
        container.register(DisallowUnpublishableModelsOnBeforeUpdate);
    }
});
```

- [ ] **Step 17: Run every affected suite**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS (3 tests in `disallowUnpublishableModels.test.ts`, plus `registration.test.ts`, `entrySystemSchema.test.ts`).
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-workflows 2>&1 | tail -50` and `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 18: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows`, `@webiny/api-website-builder-workflows`), then:

```bash
git commit -m "feat(api-workflows): replace workflow model, use cases and events

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Review aggregate — request, reach, start, take over

**Files:**
- Create: `packages/api-workflows/src/domain/review/types.ts`
- Create: `packages/api-workflows/src/domain/review/facts.ts`
- Create: `packages/api-workflows/src/domain/review/errors.ts`
- Create: `packages/api-workflows/src/domain/review/Review.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/fixtures.ts` (full replacement below)
- Create: `packages/api-workflows/__tests__/domain/Review.request.test.ts`

**Interfaces:**
- Consumes: `Workflow`, `WorkflowStep` (Task 2), `parseReviewStepConfig` (Task 2), `Result`, `BaseError` (`@webiny/feature/api`).
- Produces:
  - Types: `ReviewState`, `StepState`, `ActorType`, `Actor`, `ReviewStepAssignment`, `ReviewStep`, `ReviewWorkflowSnapshot`, `TargetContext`, `TargetContextFolder`, `TargetContextAuthor`, `ReviewData`, `ReviewPick`, `StepAssignmentResolution`, `ReviewSystemWorkflow`.
  - Facts: `ReviewFact` union (`requested`, `stepReached`, `stepStarted`, `stepTakenOver`, `stepApproved`, `stepRejected`, `cancelled`, `approved`) and `ReviewStepChange`.
  - Errors (`Workflows/Review/...`): `NotFound`, `Persistence`, `Validation`, `InvalidState`, `RequesterCannotReview`, `NotCandidate`, `AlreadyOwner`, `NotOwner`, `StepNotTakeable`, `AlreadyActive`, `WorkflowNotFound`, `TargetNotFound`.
  - `class Review`:
    - `static request(params: ReviewRequestParams): Result<Review, ReviewValidationError>`
    - `static fromData(data: ReviewData): Review`, `toData(): ReviewData`, `get id(): string`
    - `getStepToReach(): ReviewStep | null`
    - `reach(params: ReviewReachParams): Result<void, ReviewInvalidStateError>`
    - `start(params: ReviewActorParams): Result<void, ReviewReviewerError>`
    - `takeOver(params: ReviewActorParams): Result<void, ReviewTakeOverError>`
    - `pullFacts(): ReviewFact[]`

- [ ] **Step 1: Extend the fixtures**

Replace `packages/api-workflows/__tests__/__helpers/fixtures.ts` with:

```ts
import { Review } from "~/domain/review/Review.js";
import type {
    Actor,
    ReviewPick,
    StepAssignmentResolution,
    TargetContext
} from "~/domain/review/types.js";
import type { Workflow, WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";

export const NOW = "2026-10-09T10:00:00.000Z";
export const REVIEW_TEAM_ID = "team-reviewers";
export const OTHER_TEAM_ID = "team-other";
export const ARTICLE_MODEL = "cms.article";

export interface ReviewStepFixtureParams {
    id: string;
    title: string;
    teams?: string[];
    allowManualPick?: boolean;
    rules?: unknown[];
}

export const createReviewStep = (params: ReviewStepFixtureParams): WorkflowStep => {
    return {
        id: params.id,
        title: params.title,
        color: "#3b82f6",
        type: "review",
        notifications: [],
        config: {
            teams: params.teams ?? [REVIEW_TEAM_ID],
            assignment: {
                strategy: "none",
                allowManualPick: params.allowManualPick ?? false,
                rules: params.rules ?? []
            }
        }
    };
};

export const createWorkflowValues = (overrides: Partial<WorkflowValues> = {}): WorkflowValues => {
    return {
        id: "workflow-1",
        name: "Article review",
        models: [ARTICLE_MODEL],
        steps: [
            createReviewStep({ id: "legal", title: "Legal review", allowManualPick: true }),
            createReviewStep({ id: "editorial", title: "Editorial review" })
        ],
        ...overrides
    };
};

export const createWorkflow = (overrides: Partial<WorkflowValues> = {}): Workflow => {
    return {
        ...createWorkflowValues(overrides),
        createdOn: NOW,
        savedOn: NOW,
        createdBy: { id: "admin", displayName: "Admin", type: "admin" },
        savedBy: { id: "admin", displayName: "Admin", type: "admin" }
    };
};

export const requester: Actor = {
    type: "user",
    id: "user-requester",
    displayName: "Rita Requester",
    identityType: "admin"
};

export const reviewer: Actor = {
    type: "user",
    id: "user-reviewer",
    displayName: "Rob Reviewer"
};

export const otherReviewer: Actor = {
    type: "user",
    id: "user-other-reviewer",
    displayName: "Olga Reviewer"
};

/** AI owners carry the requester's id (D58) and are named by the step title (D107). */
export const aiActor: Actor = {
    type: "ai",
    id: "user-requester",
    displayName: "AI check"
};

export const targetContext: TargetContext = {
    folder: { id: "folder-1", type: "cms:article" },
    modelId: "article",
    title: "Article 1",
    author: { id: "user-requester", displayName: "Rita Requester" }
};

export const poolResolution = (): StepAssignmentResolution => {
    return {
        owner: null,
        candidateTeamIds: [REVIEW_TEAM_ID],
        assignment: { source: "pool" }
    };
};

export interface RequestedReviewParams {
    id?: string;
    targetRevisionId?: string;
    picks?: ReviewPick[];
    workflow?: Workflow;
}

/** A review whose first step was reached into the pool. Facts are left in place. */
export const createRequestedReview = (params: RequestedReviewParams = {}): Review => {
    const targetRevisionId = params.targetRevisionId ?? "article-1#0001";
    const result = Review.request({
        id: params.id ?? "review-1",
        workflow: params.workflow ?? createWorkflow(),
        model: ARTICLE_MODEL,
        targetId: targetRevisionId.split("#")[0],
        targetRevisionId,
        title: "Article 1",
        targetContext,
        picks: params.picks ?? [],
        requester,
        now: NOW
    });
    if (result.isFail()) {
        throw result.error;
    }
    const review = result.value;
    const reached = review.reach({ resolution: poolResolution(), actor: requester, now: NOW });
    if (reached.isFail()) {
        throw reached.error;
    }
    return review;
};

/** A review whose first step was started by `reviewer`. Facts are cleared. */
export const createStartedReview = (params: RequestedReviewParams = {}): Review => {
    const review = createRequestedReview(params);
    const started = review.start({ actor: reviewer, actorTeamIds: [REVIEW_TEAM_ID], now: NOW });
    if (started.isFail()) {
        throw started.error;
    }
    review.pullFacts();
    return review;
};
```

- [ ] **Step 2: Write the failing test**

Create `packages/api-workflows/__tests__/domain/Review.request.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Review, type ReviewRequestParams } from "~/domain/review/Review.js";
import {
    aiActor,
    ARTICLE_MODEL,
    createRequestedReview,
    createStartedReview,
    createWorkflow,
    NOW,
    OTHER_TEAM_ID,
    otherReviewer,
    poolResolution,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    targetContext
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

const requestParams = (overrides: Partial<ReviewRequestParams> = {}): ReviewRequestParams => {
    return {
        id: "review-1",
        workflow: createWorkflow(),
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        title: "Article 1",
        targetContext,
        picks: [],
        requester,
        now: NOW,
        ...overrides
    };
};

const requestReview = (overrides: Partial<ReviewRequestParams> = {}): Review => {
    const result = Review.request(requestParams(overrides));
    if (result.isFail()) {
        throw result.error;
    }
    return result.value;
};

describe("Review.request", () => {
    it("snapshots the workflow with every step pending", () => {
        const workflow = createWorkflow();
        const review = requestReview({ workflow });

        const data = review.toData();

        expect(data).toMatchObject({
            id: "review-1",
            workflowId: workflow.id,
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            isActive: true,
            state: "inProgress",
            targetContext,
            workflow: { name: workflow.name, models: workflow.models },
            createdBy: requester,
            createdOn: NOW,
            lastChangedOn: NOW
        });
        expect(data.steps.map(step => step.state)).toEqual(["pending", "pending"]);
        expect(data.steps[0].config).toEqual(workflow.steps[0].config);
        expect(review.getStepToReach()?.id).toBe("legal");
        expect(review.pullFacts()).toEqual([
            { type: "requested", occurredOn: NOW, actor: requester }
        ]);
    });

    it("stores picks on the matching steps", () => {
        const review = requestReview({ picks: [{ stepId: "legal", userId: otherReviewer.id }] });

        expect(review.toData().steps.map(step => step.pickedUserId)).toEqual([
            otherReviewer.id,
            null
        ]);
    });

    it("rejects picks for unknown steps or steps without manual picks", () => {
        const unknownStep = Review.request(
            requestParams({ picks: [{ stepId: "missing", userId: reviewer.id }] })
        );
        expect(unknownStep.isFail()).toBe(true);
        expect(unknownStep.error.code).toBe("Workflows/Review/Validation");
        expect(unknownStep.error.message).toBe(
            'Step "missing" does not exist in workflow "Article review".'
        );

        const noPicks = Review.request(
            requestParams({ picks: [{ stepId: "editorial", userId: reviewer.id }] })
        );
        expect(noPicks.isFail()).toBe(true);
        expect(noPicks.error.message).toBe(
            'Step "Editorial review" does not allow picking a reviewer.'
        );
    });
});

describe("Review.reach", () => {
    it("puts the step in the pool when nobody owns it", () => {
        const review = requestReview();
        review.pullFacts();

        const result = review.reach({ resolution: poolResolution(), actor: requester, now: NOW });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "awaiting",
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignmentSource: "pool",
            assignment: { source: "pool" },
            reachedOn: NOW,
            startedOn: null
        });
        expect(review.getStepToReach()).toBeNull();
        expect(review.pullFacts()).toEqual([
            {
                type: "stepReached",
                occurredOn: NOW,
                actor: requester,
                change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
                assignment: { source: "pool" }
            }
        ]);
    });

    it("starts the step when an owner resolves", () => {
        const review = requestReview();

        review.reach({
            resolution: {
                owner: reviewer,
                candidateTeamIds: [REVIEW_TEAM_ID],
                assignment: { source: "picked" }
            },
            actor: requester,
            now: NOW
        });

        expect(review.toData().steps[0]).toMatchObject({
            state: "inReview",
            owner: reviewer,
            assignmentSource: "picked",
            reachedOn: NOW,
            startedOn: NOW
        });
    });

    it("fails when the current step is not pending", () => {
        const review = createRequestedReview();

        const result = review.reach({ resolution: poolResolution(), actor: requester, now: NOW });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            transition: "reach",
            reviewState: "inProgress",
            stepId: "legal",
            stepState: "awaiting"
        });
    });
});

describe("Review.start", () => {
    it("lets a candidate start an awaiting step", () => {
        const review = createRequestedReview();
        review.pullFacts();

        const result = review.start({
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            now: LATER
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "inReview",
            owner: reviewer,
            startedOn: LATER,
            assignmentSource: "poolStart",
            assignment: { source: "poolStart" }
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepStarted",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "awaiting", toState: "inReview" }
            }
        ]);
    });

    it("does not let the requester start their own review", () => {
        const review = createRequestedReview();
        review.pullFacts();

        const result = review.start({
            actor: requester,
            actorTeamIds: [REVIEW_TEAM_ID],
            now: LATER
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/RequesterCannotReview");
        expect(review.toData().steps[0].state).toBe("awaiting");
        expect(review.pullFacts()).toEqual([]);
    });

    it("does not let a user outside the candidate teams start", () => {
        const review = createRequestedReview();

        const result = review.start({
            actor: reviewer,
            actorTeamIds: [OTHER_TEAM_ID],
            now: LATER
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotCandidate");
        expect(result.error.data).toEqual({ reviewId: "review-1", stepId: "legal" });
    });

    it("cannot start a step that is already in review", () => {
        const review = createStartedReview();

        const result = review.start({
            actor: otherReviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            now: LATER
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
    });
});

describe("Review.takeOver", () => {
    it("moves a human step to another candidate", () => {
        const review = createStartedReview();

        const result = review.takeOver({
            actor: otherReviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            now: LATER
        });

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "inReview",
            owner: otherReviewer,
            assignmentSource: "takeOver",
            assignment: { source: "takeOver", by: otherReviewer }
        });
        expect(review.pullFacts()).toEqual([
            {
                type: "stepTakenOver",
                occurredOn: LATER,
                actor: otherReviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "inReview" },
                previousOwner: reviewer
            }
        ]);
    });

    it("does not let the current owner take over", () => {
        const review = createStartedReview();

        const result = review.takeOver({
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            now: LATER
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/AlreadyOwner");
    });

    it("does not let the requester take over", () => {
        const review = createStartedReview();

        const result = review.takeOver({
            actor: requester,
            actorTeamIds: [REVIEW_TEAM_ID],
            now: LATER
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/RequesterCannotReview");
    });

    it("does not take over an AI step", () => {
        const review = requestReview();
        review.reach({
            resolution: {
                owner: aiActor,
                candidateTeamIds: [REVIEW_TEAM_ID],
                assignment: { source: "strategy" }
            },
            actor: requester,
            now: NOW
        });

        const result = review.takeOver({
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            now: LATER
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/StepNotTakeable");
        expect(result.error.data).toEqual({
            reviewId: "review-1",
            stepId: "legal",
            ownerType: "ai"
        });
    });

    it("cannot take over an awaiting step", () => {
        const review = createRequestedReview();

        const result = review.takeOver({
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            now: LATER
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
    });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.request.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/review/Review.js`.

- [ ] **Step 4: Add the review types**

Create `packages/api-workflows/src/domain/review/types.ts`:

```ts
import type { WorkflowStep } from "~/domain/workflow/types.js";

export type ReviewState = "inProgress" | "approved" | "rejected" | "cancelled";

export type StepState = "pending" | "awaiting" | "inReview" | "approved" | "rejected" | "failed";

export type ActorType = "user" | "ai" | "automation";

/** Who acted or holds a step (D3, D30). For AI and automation, `id` is the requester's id (D58). */
export interface Actor {
    type: ActorType;
    id: string;
    displayName: string;
    identityType?: string;
}

/** "Why this owner" (D127). Sources: rule id, "strategy", "picked", "pool", "poolStart", "takeOver", "reassign". */
export interface ReviewStepAssignment {
    source: string;
    ruleId?: string;
    reason?: string;
    by?: Actor;
}

export interface ReviewStep extends WorkflowStep {
    state: StepState;
    owner: Actor | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[];
    assignmentSource: string | null;
    assignment: ReviewStepAssignment | null;
    reachedOn: string | null;
    startedOn: string | null;
    finishedOn: string | null;
}

export interface ReviewWorkflowSnapshot {
    name: string;
    models: string[];
}

export interface TargetContextFolder {
    id: string;
    type: string;
}

export interface TargetContextAuthor {
    id: string;
    displayName: string;
}

/** Produced by the target adapter (`ReviewTargetLoader`, spec 9.3). */
export interface TargetContext {
    folder: TargetContextFolder | null;
    modelId: string;
    title: string;
    author: TargetContextAuthor;
}

export interface ReviewData {
    id: string;
    workflowId: string;
    /** Namespace id, e.g. "cms.article" (D41). */
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    /** Current review of the revision; false only after cancel (D23). */
    isActive: boolean;
    state: ReviewState;
    currentStepId: string | null;
    currentStepState: StepState | null;
    /** Only for `user` owners (D74). */
    currentOwnerId: string | null;
    currentCandidateTeamIds: string[];
    targetContext: TargetContext;
    workflow: ReviewWorkflowSnapshot;
    steps: ReviewStep[];
    /** The requester. */
    createdBy: Actor;
    createdOn: string;
    savedOn: string;
    /** Changes on every review event; list sort key (D119). */
    lastChangedOn: string;
}

export interface ReviewPick {
    stepId: string;
    userId: string;
}

/** Result of assignment resolution on step reached (spec 5.2, 6). */
export interface StepAssignmentResolution {
    owner: Actor | null;
    candidateTeamIds: string[];
    assignment: ReviewStepAssignment;
}

/** The value of `system.workflow` on the target revision (spec 4.5). */
export interface ReviewSystemWorkflow {
    workflowId: string;
    reviewState: ReviewState;
    stepId: string;
    stepName: string;
    stepState: StepState;
}
```

- [ ] **Step 5: Add the review facts**

Create `packages/api-workflows/src/domain/review/facts.ts`:

```ts
import type { Actor, ReviewStepAssignment, StepState } from "./types.js";

/**
 * Domain facts recorded by the `Review` aggregate. `ReviewSaver` publishes one event per fact
 * after the review is persisted. Each fact carries what a later audit app needs (spec 9.5).
 */
export interface ReviewStepChange {
    stepId: string;
    fromState: StepState;
    toState: StepState;
}

export interface ReviewRequestedFact {
    type: "requested";
    occurredOn: string;
    actor: Actor;
}

export interface ReviewStepReachedFact {
    type: "stepReached";
    occurredOn: string;
    /** Who caused the step to be reached: the requester or the approver of the previous step. */
    actor: Actor;
    change: ReviewStepChange;
    assignment: ReviewStepAssignment;
}

export interface ReviewStepStartedFact {
    type: "stepStarted";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
}

export interface ReviewStepTakenOverFact {
    type: "stepTakenOver";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    previousOwner: Actor;
}

export interface ReviewStepApprovedFact {
    type: "stepApproved";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    comment: string | null;
}

export interface ReviewStepRejectedFact {
    type: "stepRejected";
    occurredOn: string;
    actor: Actor;
    change: ReviewStepChange;
    comment: string | null;
}

export interface ReviewCancelledFact {
    type: "cancelled";
    occurredOn: string;
    actor: Actor;
    /** The step that was current when the review was cancelled. */
    stepId: string | null;
    stepState: StepState | null;
}

export interface ReviewApprovedFact {
    type: "approved";
    occurredOn: string;
    actor: Actor;
}

export type ReviewFact =
    | ReviewRequestedFact
    | ReviewStepReachedFact
    | ReviewStepStartedFact
    | ReviewStepTakenOverFact
    | ReviewStepApprovedFact
    | ReviewStepRejectedFact
    | ReviewCancelledFact
    | ReviewApprovedFact;
```

- [ ] **Step 6: Add the review errors**

Create `packages/api-workflows/src/domain/review/errors.ts`:

```ts
import { BaseError } from "@webiny/feature/api";
import type { ActorType, ReviewState, StepState } from "./types.js";

export type ReviewTransitionName = "reach" | "start" | "takeOver" | "approve" | "reject" | "cancel";

export interface ReviewNotFoundErrorData {
    id: string;
}

export class ReviewNotFoundError extends BaseError<ReviewNotFoundErrorData> {
    override readonly code = "Workflows/Review/NotFound" as const;

    constructor(data: ReviewNotFoundErrorData) {
        super({ message: `Review "${data.id}" was not found.`, data });
    }
}

export class ReviewPersistenceError extends BaseError {
    override readonly code = "Workflows/Review/Persistence" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}

export class ReviewValidationError extends BaseError {
    override readonly code = "Workflows/Review/Validation" as const;

    constructor(message: string) {
        super({ message });
    }
}

export interface ReviewInvalidStateErrorData {
    reviewId: string;
    transition: ReviewTransitionName;
    reviewState: ReviewState;
    stepId: string | null;
    stepState: StepState | null;
}

export class ReviewInvalidStateError extends BaseError<ReviewInvalidStateErrorData> {
    override readonly code = "Workflows/Review/InvalidState" as const;

    constructor(data: ReviewInvalidStateErrorData) {
        super({
            message: `Cannot ${data.transition} review "${data.reviewId}": the review is "${data.reviewState}" and the current step is "${data.stepState ?? "none"}".`,
            data
        });
    }
}

export interface ReviewStepErrorData {
    reviewId: string;
    stepId: string;
}

export class ReviewRequesterCannotReviewError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/RequesterCannotReview" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "The requester cannot review their own content.", data });
    }
}

export class ReviewNotCandidateError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/NotCandidate" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "Only members of the step's teams can review this step.", data });
    }
}

export class ReviewAlreadyOwnerError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/AlreadyOwner" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "You already hold this step.", data });
    }
}

export class ReviewNotOwnerError extends BaseError<ReviewStepErrorData> {
    override readonly code = "Workflows/Review/NotOwner" as const;

    constructor(data: ReviewStepErrorData) {
        super({ message: "Only the step owner can approve or reject it.", data });
    }
}

export interface ReviewStepNotTakeableErrorData extends ReviewStepErrorData {
    ownerType: ActorType | null;
}

export class ReviewStepNotTakeableError extends BaseError<ReviewStepNotTakeableErrorData> {
    override readonly code = "Workflows/Review/StepNotTakeable" as const;

    constructor(data: ReviewStepNotTakeableErrorData) {
        super({ message: "AI and automation steps cannot be taken over.", data });
    }
}

export interface ReviewAlreadyActiveErrorData {
    reviewId: string;
    targetRevisionId: string;
}

export class ReviewAlreadyActiveError extends BaseError<ReviewAlreadyActiveErrorData> {
    override readonly code = "Workflows/Review/AlreadyActive" as const;

    constructor(data: ReviewAlreadyActiveErrorData) {
        super({
            message: `Revision "${data.targetRevisionId}" already has an active review.`,
            data
        });
    }
}

export interface ReviewWorkflowNotFoundErrorData {
    model: string;
}

export class ReviewWorkflowNotFoundError extends BaseError<ReviewWorkflowNotFoundErrorData> {
    override readonly code = "Workflows/Review/WorkflowNotFound" as const;

    constructor(data: ReviewWorkflowNotFoundErrorData) {
        super({ message: `No workflow is bound to the model "${data.model}".`, data });
    }
}

export interface ReviewTargetNotFoundErrorData {
    model: string;
    targetRevisionId: string;
}

export class ReviewTargetNotFoundError extends BaseError<ReviewTargetNotFoundErrorData> {
    override readonly code = "Workflows/Review/TargetNotFound" as const;

    constructor(data: ReviewTargetNotFoundErrorData) {
        super({
            message: `Content "${data.targetRevisionId}" of the model "${data.model}" was not found.`,
            data
        });
    }
}
```

- [ ] **Step 7: Add the aggregate**

Create `packages/api-workflows/src/domain/review/Review.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import type {
    Actor,
    ReviewData,
    ReviewPick,
    ReviewStep,
    StepAssignmentResolution,
    StepState,
    TargetContext
} from "./types.js";
import type { ReviewFact } from "./facts.js";
import {
    ReviewAlreadyOwnerError,
    ReviewInvalidStateError,
    ReviewNotCandidateError,
    ReviewRequesterCannotReviewError,
    ReviewStepNotTakeableError,
    type ReviewTransitionName,
    ReviewValidationError
} from "./errors.js";

export interface ReviewRequestParams {
    id: string;
    workflow: Workflow;
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    targetContext: TargetContext;
    picks: ReviewPick[];
    requester: Actor;
    now: string;
}

export interface ReviewReachParams {
    resolution: StepAssignmentResolution;
    /** Who caused the step to be reached. */
    actor: Actor;
    now: string;
}

export interface ReviewActorParams {
    actor: Actor;
    /** Teams of the actor, resolved by the caller (the aggregate never reads identity, D5). */
    actorTeamIds: string[];
    now: string;
}

export type ReviewReviewerError =
    | ReviewInvalidStateError
    | ReviewRequesterCannotReviewError
    | ReviewNotCandidateError;

export type ReviewTakeOverError =
    | ReviewReviewerError
    | ReviewAlreadyOwnerError
    | ReviewStepNotTakeableError;

/**
 * One run of a workflow on one target revision (spec 3, 4.2, 5.1). Transitions take an explicit
 * actor and `now`, never read identity, and record facts; `ReviewSaver` persists the review and
 * publishes one event per fact.
 */
export class Review {
    private readonly facts: ReviewFact[] = [];

    private constructor(private readonly data: ReviewData) {}

    public static fromData(data: ReviewData): Review {
        return new Review(structuredClone(data));
    }

    public static request(params: ReviewRequestParams): Result<Review, ReviewValidationError> {
        const picks = new Map<string, string>();
        for (const pick of params.picks) {
            const step = params.workflow.steps.find(item => item.id === pick.stepId);
            if (!step) {
                return Result.fail(
                    new ReviewValidationError(
                        `Step "${pick.stepId}" does not exist in workflow "${params.workflow.name}".`
                    )
                );
            }
            const config = parseReviewStepConfig(step.config);
            if (!config || !config.assignment.allowManualPick) {
                return Result.fail(
                    new ReviewValidationError(`Step "${step.title}" does not allow picking a reviewer.`)
                );
            }
            if (picks.has(step.id)) {
                return Result.fail(
                    new ReviewValidationError(`Step "${step.title}" has more than one pick.`)
                );
            }
            picks.set(step.id, pick.userId);
        }

        const steps = params.workflow.steps.map(
            (step): ReviewStep => ({
                ...structuredClone(step),
                state: "pending",
                owner: null,
                comment: null,
                pickedUserId: picks.get(step.id) ?? null,
                candidateTeamIds: [],
                assignmentSource: null,
                assignment: null,
                reachedOn: null,
                startedOn: null,
                finishedOn: null
            })
        );

        const review = new Review({
            id: params.id,
            workflowId: params.workflow.id,
            model: params.model,
            targetId: params.targetId,
            targetRevisionId: params.targetRevisionId,
            title: params.title,
            isActive: true,
            state: "inProgress",
            currentStepId: null,
            currentStepState: null,
            currentOwnerId: null,
            currentCandidateTeamIds: [],
            targetContext: structuredClone(params.targetContext),
            workflow: {
                name: params.workflow.name,
                models: [...params.workflow.models]
            },
            steps,
            createdBy: { ...params.requester },
            createdOn: params.now,
            savedOn: params.now,
            lastChangedOn: params.now
        });
        review.facts.push({ type: "requested", occurredOn: params.now, actor: { ...params.requester } });
        return Result.ok(review);
    }

    public get id(): string {
        return this.data.id;
    }

    public toData(): ReviewData {
        return structuredClone(this.data);
    }

    /** The current step when it still has to be reached (spec 5.2). */
    public getStepToReach(): ReviewStep | null {
        if (this.data.state !== "inProgress") {
            return null;
        }
        const step = this.findCurrentStep();
        if (!step || step.state !== "pending") {
            return null;
        }
        return structuredClone(step);
    }

    public reach(params: ReviewReachParams): Result<void, ReviewInvalidStateError> {
        const current = this.getCurrentStepIn("reach", "pending");
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const { resolution } = params;

        step.candidateTeamIds = [...resolution.candidateTeamIds];
        step.assignment = structuredClone(resolution.assignment);
        step.assignmentSource = resolution.assignment.source;
        step.reachedOn = params.now;
        if (resolution.owner) {
            step.owner = { ...resolution.owner };
            step.state = "inReview";
            step.startedOn = params.now;
        } else {
            step.owner = null;
            step.state = "awaiting";
        }

        this.facts.push({
            type: "stepReached",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "pending", toState: step.state },
            assignment: structuredClone(resolution.assignment)
        });
        return Result.ok();
    }

    public start(params: ReviewActorParams): Result<void, ReviewReviewerError> {
        const current = this.getCurrentStepIn("start", "awaiting");
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const reviewer = this.checkReviewer(step, params);
        if (reviewer.isFail()) {
            return Result.fail(reviewer.error);
        }

        step.owner = { ...params.actor };
        step.state = "inReview";
        step.startedOn = params.now;
        step.assignmentSource = "poolStart";
        step.assignment = { source: "poolStart" };

        this.facts.push({
            type: "stepStarted",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "awaiting", toState: "inReview" }
        });
        return Result.ok();
    }

    public takeOver(params: ReviewActorParams): Result<void, ReviewTakeOverError> {
        const current = this.getCurrentStepIn("takeOver", "inReview");
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const previousOwner = step.owner;
        if (!previousOwner || previousOwner.type !== "user") {
            // AI and automation steps cannot be taken over (D9).
            return Result.fail(
                new ReviewStepNotTakeableError({
                    reviewId: this.data.id,
                    stepId: step.id,
                    ownerType: previousOwner?.type ?? null
                })
            );
        }
        const reviewer = this.checkReviewer(step, params);
        if (reviewer.isFail()) {
            return Result.fail(reviewer.error);
        }
        if (previousOwner.id === params.actor.id) {
            return Result.fail(
                new ReviewAlreadyOwnerError({ reviewId: this.data.id, stepId: step.id })
            );
        }

        step.owner = { ...params.actor };
        step.assignmentSource = "takeOver";
        step.assignment = { source: "takeOver", by: { ...params.actor } };

        this.facts.push({
            type: "stepTakenOver",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "inReview", toState: "inReview" },
            previousOwner: { ...previousOwner }
        });
        return Result.ok();
    }

    /** Returns and clears the facts recorded since the last call. */
    public pullFacts(): ReviewFact[] {
        return this.facts.splice(0, this.facts.length);
    }

    /** The first step that is not approved; null when every step is approved. */
    private findCurrentStep(): ReviewStep | null {
        return this.data.steps.find(step => step.state !== "approved") ?? null;
    }

    private getCurrentStepIn(
        transition: ReviewTransitionName,
        stepState: StepState
    ): Result<ReviewStep, ReviewInvalidStateError> {
        const step = this.findCurrentStep();
        if (this.data.state !== "inProgress" || !step || step.state !== stepState) {
            return Result.fail(
                new ReviewInvalidStateError({
                    reviewId: this.data.id,
                    transition,
                    reviewState: this.data.state,
                    stepId: step?.id ?? null,
                    stepState: step?.state ?? null
                })
            );
        }
        return Result.ok(step);
    }

    /** Human actions: not the requester, member of the step's candidate teams (spec 5.1). */
    private checkReviewer(
        step: ReviewStep,
        params: ReviewActorParams
    ): Result<void, ReviewRequesterCannotReviewError | ReviewNotCandidateError> {
        if (params.actor.id === this.data.createdBy.id) {
            return Result.fail(
                new ReviewRequesterCannotReviewError({ reviewId: this.data.id, stepId: step.id })
            );
        }
        const isCandidate = params.actorTeamIds.some(teamId =>
            step.candidateTeamIds.includes(teamId)
        );
        if (!isCandidate) {
            return Result.fail(
                new ReviewNotCandidateError({ reviewId: this.data.id, stepId: step.id })
            );
        }
        return Result.ok();
    }
}
```

- [ ] **Step 8: Run the test**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.request.test.ts 2>&1 | tail -50`
Expected: PASS (15 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add review aggregate with request, reach, start and take over

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 5: Review aggregate — approve, reject, cancel, save preparation and `system.workflow`

**Files:**
- Modify: `packages/api-workflows/src/domain/review/Review.ts`
- Create: `packages/api-workflows/__tests__/domain/Review.decisions.test.ts`

**Interfaces:**
- Consumes: Task 4 types, facts and errors (`ReviewNotOwnerError`).
- Produces (on `Review`):
  - `approve(params: ReviewDecisionParams): Result<void, ReviewDecisionError>`
  - `reject(params: ReviewDecisionParams): Result<void, ReviewDecisionError>`
  - `cancel(params: ReviewCancelParams): Result<void, ReviewInvalidStateError>`
  - `prepareForSave(): void` — refreshes `state`, `isActive`, `currentStepId`, `currentStepState`, `currentOwnerId` (user owners only), `currentCandidateTeamIds`, and `lastChangedOn` (newest unpulled fact).
  - `getSystemWorkflow(): ReviewSystemWorkflow | null` — `null` for cancelled reviews; read after `prepareForSave`.
  - `ReviewDecisionParams extends ReviewActorParams { comment: string | null }`, `ReviewCancelParams { actor: Actor; now: string }`, `ReviewDecisionError = ReviewInvalidStateError | ReviewNotOwnerError`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/domain/Review.decisions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Review } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import {
    aiActor,
    ARTICLE_MODEL,
    createRequestedReview,
    createStartedReview,
    createWorkflow,
    NOW,
    otherReviewer,
    poolResolution,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    targetContext
} from "~tests/__helpers/fixtures.js";

const LATER = "2026-10-09T11:00:00.000Z";

const decision = (actor: Actor, comment: string | null = null) => {
    return { actor, actorTeamIds: [REVIEW_TEAM_ID], comment, now: LATER };
};

/** Approves "legal" and starts "editorial" as `reviewer`; facts are cleared. */
const moveToSecondStep = (review: Review): void => {
    review.approve(decision(reviewer));
    review.reach({ resolution: poolResolution(), actor: reviewer, now: LATER });
    review.start({ actor: reviewer, actorTeamIds: [REVIEW_TEAM_ID], now: LATER });
    review.pullFacts();
};

const requestWithOwner = (owner: Actor): Review => {
    const result = Review.request({
        id: "review-1",
        workflow: createWorkflow(),
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        title: "Article 1",
        targetContext,
        picks: [],
        requester,
        now: NOW
    });
    const review = result.value;
    review.reach({
        resolution: {
            owner,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "strategy" }
        },
        actor: requester,
        now: NOW
    });
    return review;
};

describe("Review.approve", () => {
    it("approves the current step and leaves the next step to be reached", () => {
        const review = createStartedReview();

        const result = review.approve(decision(reviewer, "Looks good."));

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "approved",
            comment: "Looks good.",
            finishedOn: LATER,
            owner: reviewer
        });
        expect(review.getStepToReach()?.id).toBe("editorial");
        expect(review.pullFacts()).toEqual([
            {
                type: "stepApproved",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "approved" },
                comment: "Looks good."
            }
        ]);
    });

    it("approves the review when the last step is approved", () => {
        const review = createStartedReview();
        moveToSecondStep(review);

        const result = review.approve(decision(reviewer));

        expect(result.isOk()).toBe(true);
        expect(review.pullFacts().map(fact => fact.type)).toEqual(["stepApproved", "approved"]);
        review.prepareForSave();
        expect(review.toData()).toMatchObject({
            state: "approved",
            isActive: true,
            currentStepId: "editorial",
            currentStepState: "approved",
            currentOwnerId: reviewer.id,
            currentCandidateTeamIds: [REVIEW_TEAM_ID]
        });
        expect(review.getSystemWorkflow()).toEqual({
            workflowId: "workflow-1",
            reviewState: "approved",
            stepId: "editorial",
            stepName: "Editorial review",
            stepState: "approved"
        });
        expect(review.getStepToReach()).toBeNull();
    });

    it("lets only the owner approve", () => {
        const review = createStartedReview();

        const result = review.approve(decision(otherReviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotOwner");
    });

    it("cannot approve a step that is not in review", () => {
        const review = createRequestedReview();

        const result = review.approve(decision(reviewer));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/InvalidState");
    });

    it("lets an AI owner approve through the same path", () => {
        const review = requestWithOwner(aiActor);

        const result = review.approve(decision(aiActor, "No issues found."));

        expect(result.isOk()).toBe(true);
        expect(review.toData().steps[0].state).toBe("approved");
    });
});

describe("Review.reject", () => {
    it("keeps the rejecting step and its owner as current", () => {
        const review = createStartedReview();

        const result = review.reject(decision(reviewer, "Needs another pass."));

        expect(result.isOk()).toBe(true);
        review.prepareForSave();
        expect(review.pullFacts()).toEqual([
            {
                type: "stepRejected",
                occurredOn: LATER,
                actor: reviewer,
                change: { stepId: "legal", fromState: "inReview", toState: "rejected" },
                comment: "Needs another pass."
            }
        ]);
        expect(review.toData()).toMatchObject({
            state: "rejected",
            isActive: true,
            currentStepId: "legal",
            currentStepState: "rejected",
            currentOwnerId: reviewer.id,
            lastChangedOn: LATER
        });
        expect(review.getSystemWorkflow()).toEqual({
            workflowId: "workflow-1",
            reviewState: "rejected",
            stepId: "legal",
            stepName: "Legal review",
            stepState: "rejected"
        });
        expect(review.getStepToReach()).toBeNull();
        expect(review.approve(decision(reviewer)).isFail()).toBe(true);
        expect(review.cancel({ actor: requester, now: LATER }).error.code).toBe(
            "Workflows/Review/InvalidState"
        );
    });
});

describe("Review.cancel", () => {
    it("clears the current-step fields on cancel", () => {
        const review = createStartedReview();

        const result = review.cancel({ actor: requester, now: LATER });

        expect(result.isOk()).toBe(true);
        review.prepareForSave();
        expect(review.toData()).toMatchObject({
            state: "cancelled",
            isActive: false,
            currentStepId: null,
            currentStepState: null,
            currentOwnerId: null,
            currentCandidateTeamIds: [],
            lastChangedOn: LATER
        });
        expect(review.toData().steps[0].owner).toEqual(reviewer);
        expect(review.getSystemWorkflow()).toBeNull();
        expect(review.pullFacts()).toEqual([
            {
                type: "cancelled",
                occurredOn: LATER,
                actor: requester,
                stepId: "legal",
                stepState: "inReview"
            }
        ]);
    });

    it("cannot cancel a cancelled review", () => {
        const review = createStartedReview();
        review.cancel({ actor: requester, now: LATER });

        const result = review.cancel({ actor: requester, now: LATER });

        expect(result.isFail()).toBe(true);
        expect(result.error.data).toMatchObject({ transition: "cancel", reviewState: "cancelled" });
    });
});

describe("Review.prepareForSave", () => {
    it("sets lastChangedOn from the newest fact and refreshes the current step", () => {
        const review = createRequestedReview();
        review.start({ actor: reviewer, actorTeamIds: [REVIEW_TEAM_ID], now: LATER });

        review.prepareForSave();

        expect(review.toData()).toMatchObject({
            lastChangedOn: LATER,
            currentStepId: "legal",
            currentStepState: "inReview",
            currentOwnerId: reviewer.id,
            currentCandidateTeamIds: [REVIEW_TEAM_ID]
        });
        expect(review.getSystemWorkflow()).toEqual({
            workflowId: "workflow-1",
            reviewState: "inProgress",
            stepId: "legal",
            stepName: "Legal review",
            stepState: "inReview"
        });
    });

    it("keeps lastChangedOn when no review event happened", () => {
        const review = createRequestedReview();
        review.prepareForSave();
        review.pullFacts();
        const reloaded = Review.fromData({ ...review.toData(), lastChangedOn: NOW });

        reloaded.prepareForSave();

        expect(reloaded.toData().lastChangedOn).toBe(NOW);
    });

    it("never sets currentOwnerId for an AI owner", () => {
        const review = requestWithOwner(aiActor);

        review.prepareForSave();

        expect(review.toData()).toMatchObject({
            currentStepId: "legal",
            currentStepState: "inReview",
            currentOwnerId: null
        });
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/domain/Review.decisions.test.ts 2>&1 | tail -50`
Expected: FAIL, `review.approve is not a function` (and the same for `reject`, `cancel`, `prepareForSave`).

- [ ] **Step 3: Add the decisions, cancel and save preparation**

In `packages/api-workflows/src/domain/review/Review.ts`:

Replace the import block from `./types.js` and `./errors.js` with:

```ts
import type {
    Actor,
    ReviewData,
    ReviewPick,
    ReviewState,
    ReviewStep,
    ReviewSystemWorkflow,
    StepAssignmentResolution,
    StepState,
    TargetContext
} from "./types.js";
import type { ReviewFact } from "./facts.js";
import {
    ReviewAlreadyOwnerError,
    ReviewInvalidStateError,
    ReviewNotCandidateError,
    ReviewNotOwnerError,
    ReviewRequesterCannotReviewError,
    ReviewStepNotTakeableError,
    type ReviewTransitionName,
    ReviewValidationError
} from "./errors.js";
```

After the `ReviewActorParams` interface, add:

```ts
export interface ReviewDecisionParams extends ReviewActorParams {
    comment: string | null;
}

export interface ReviewCancelParams {
    actor: Actor;
    now: string;
}
```

After the `ReviewTakeOverError` type, add:

```ts
export type ReviewDecisionError = ReviewInvalidStateError | ReviewNotOwnerError;
```

Inside `class Review`, add these public methods after `takeOver`:

```ts
    /** Owner (user, AI or automation) approves; the next step is reached by the caller (D6). */
    public approve(params: ReviewDecisionParams): Result<void, ReviewDecisionError> {
        const current = this.getOwnedStep("approve", params.actor);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;

        step.state = "approved";
        step.comment = params.comment;
        step.finishedOn = params.now;
        this.facts.push({
            type: "stepApproved",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "inReview", toState: "approved" },
            comment: params.comment
        });

        if (this.data.steps.every(item => item.state === "approved")) {
            this.data.state = "approved";
            this.facts.push({ type: "approved", occurredOn: params.now, actor: { ...params.actor } });
        }
        return Result.ok();
    }

    /** Owner rejects; reject is final for the revision (D10). */
    public reject(params: ReviewDecisionParams): Result<void, ReviewDecisionError> {
        const current = this.getOwnedStep("reject", params.actor);
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;

        step.state = "rejected";
        step.comment = params.comment;
        step.finishedOn = params.now;
        this.data.state = "rejected";
        this.facts.push({
            type: "stepRejected",
            occurredOn: params.now,
            actor: { ...params.actor },
            change: { stepId: step.id, fromState: "inReview", toState: "rejected" },
            comment: params.comment
        });
        return Result.ok();
    }

    /** Allowed while the review is in progress (D25, D75). Who may cancel is checked in 1b. */
    public cancel(params: ReviewCancelParams): Result<void, ReviewInvalidStateError> {
        const step = this.findCurrentStep();
        if (this.data.state !== "inProgress") {
            return Result.fail(
                new ReviewInvalidStateError({
                    reviewId: this.data.id,
                    transition: "cancel",
                    reviewState: this.data.state,
                    stepId: step?.id ?? null,
                    stepState: step?.state ?? null
                })
            );
        }

        this.data.state = "cancelled";
        this.facts.push({
            type: "cancelled",
            occurredOn: params.now,
            actor: { ...params.actor },
            stepId: step?.id ?? null,
            stepState: step?.state ?? null
        });
        return Result.ok();
    }

    /**
     * Called by the single save path before persisting (D19). Derives the review-level fields from
     * the steps; `lastChangedOn` moves only when a review event happened (D119).
     */
    public prepareForSave(): void {
        const lastFact = this.facts[this.facts.length - 1];
        if (lastFact) {
            this.data.lastChangedOn = lastFact.occurredOn;
        }

        if (this.data.state === "cancelled") {
            this.data.isActive = false;
            this.data.currentStepId = null;
            this.data.currentStepState = null;
            this.data.currentOwnerId = null;
            this.data.currentCandidateTeamIds = [];
            return;
        }

        // After approve the last step stays current; after reject the rejecting step (D75).
        const current = this.findCurrentStep() ?? this.data.steps.at(-1);
        if (!current) {
            return;
        }
        this.data.isActive = true;
        this.data.state = Review.deriveState(current);
        this.data.currentStepId = current.id;
        this.data.currentStepState = current.state;
        this.data.currentOwnerId = current.owner?.type === "user" ? current.owner.id : null;
        this.data.currentCandidateTeamIds = [...current.candidateTeamIds];
    }

    /** `system.workflow` for the target revision (spec 4.5); read after `prepareForSave`. */
    public getSystemWorkflow(): ReviewSystemWorkflow | null {
        if (this.data.state === "cancelled" || !this.data.currentStepId) {
            return null;
        }
        const step = this.data.steps.find(item => item.id === this.data.currentStepId);
        if (!step) {
            return null;
        }
        return {
            workflowId: this.data.workflowId,
            reviewState: this.data.state,
            stepId: step.id,
            stepName: step.title,
            stepState: step.state
        };
    }
```

Inside `class Review`, add these private members after `checkReviewer`:

```ts
    private getOwnedStep(
        transition: ReviewTransitionName,
        actor: Actor
    ): Result<ReviewStep, ReviewDecisionError> {
        const current = this.getCurrentStepIn(transition, "inReview");
        if (current.isFail()) {
            return Result.fail(current.error);
        }
        const step = current.value;
        const owner = step.owner;
        if (!owner || owner.type !== actor.type || owner.id !== actor.id) {
            return Result.fail(new ReviewNotOwnerError({ reviewId: this.data.id, stepId: step.id }));
        }
        return Result.ok(step);
    }

    private static deriveState(current: ReviewStep): ReviewState {
        if (current.state === "rejected") {
            return "rejected";
        }
        if (current.state === "approved") {
            return "approved";
        }
        return "inProgress";
    }
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/domain 2>&1 | tail -50`
Expected: PASS (`WorkflowValidator.test.ts`, `Review.request.test.ts`, `Review.decisions.test.ts` with 11 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 5: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add approve, reject and cancel to the review aggregate

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 6: Review model and repository; block workflow delete while reviews run

**Files:**
- Modify: `packages/api-workflows/src/constants.ts`
- Create: `packages/api-workflows/src/domain/review/review.model.ts`
- Create: `packages/api-workflows/src/domain/review/abstractions/ReviewModelProvider.ts`
- Create: `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`
- Create: `packages/api-workflows/src/features/shared/toIsoString.ts`
- Create: `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`
- Create: `packages/api-workflows/src/features/review/shared/ReviewModelProvider.ts`
- Create: `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`
- Create: `packages/api-workflows/src/features/review/shared/feature.ts`
- Modify: `packages/api-workflows/src/domain/workflow/errors.ts` (append `WorkflowHasActiveReviewsError`)
- Modify: `packages/api-workflows/src/features/workflow/DeleteWorkflow/abstractions.ts`, `packages/api-workflows/src/features/workflow/DeleteWorkflow/DeleteWorkflowUseCase.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/fixtures.ts` (add `toSaveData`)
- Create: `packages/api-workflows/__tests__/review/ReviewRepository.test.ts`
- Create: `packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts`

**Interfaces:**
- Consumes: `ReviewData` and errors (Task 4), `Review` (Tasks 4-5), CMS entry use cases, `GetModelUseCase`, `ModelFactory`, `StoreWorkflowUseCase`, `DeleteWorkflowUseCase` (Task 3).
- Produces:
  - `REVIEW_MODEL_ID = "wbyWorkflowReview"`; `ReviewModel` (`ModelFactory` implementation).
  - `ReviewModelProvider.Interface { get(): Promise<CmsModel> }`.
  - `ReviewRepository.Interface`:
    - `get(id: string): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>>`
    - `getActiveByTarget(params: { model: string; targetRevisionId: string }): Promise<Result<ReviewData | null, ReviewPersistenceError>>`
    - `countInProgressByWorkflow(workflowId: string): Promise<Result<number, ReviewPersistenceError>>`
    - `save(review: ReviewData): Promise<Result<ReviewData, ReviewPersistenceError>>` (create or update; the only review write path)
  - `toIsoString(value: unknown): string | null`.
  - `WorkflowHasActiveReviewsError` (`Workflows/Workflow/HasActiveReviews`, data `{ count }`); `DeleteWorkflowUseCase` returns it.

- [ ] **Step 1: Add the fixture helper**

In `packages/api-workflows/__tests__/__helpers/fixtures.ts`, change the type import from `~/domain/review/types.js` to:

```ts
import type {
    Actor,
    ReviewData,
    ReviewPick,
    StepAssignmentResolution,
    TargetContext
} from "~/domain/review/types.js";
```

and append at the end of the file:

```ts
/** What the save path persists: prepared for save, facts discarded. */
export const toSaveData = (review: Review): ReviewData => {
    review.prepareForSave();
    review.pullFacts();
    return review.toData();
};
```

- [ ] **Step 2: Write the failing tests**

Create `packages/api-workflows/__tests__/review/ReviewRepository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    createWorkflow,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { Review } from "~/domain/review/Review.js";

const LATER = "2026-10-09T11:00:00.000Z";

const createRepository = async () => {
    const { context } = await createContextHandler();
    return context.container.resolve(ReviewRepository);
};

describe("ReviewRepository", () => {
    it("saves a new review and reads it back unchanged", async () => {
        const repository = await createRepository();
        const data = toSaveData(createRequestedReview());

        const saved = await repository.save(data);

        expect(saved.isOk()).toBe(true);
        expect(saved.value).toEqual({
            ...data,
            createdOn: saved.value.createdOn,
            savedOn: saved.value.savedOn
        });
        const read = await repository.get(data.id);
        expect(read.value).toEqual(saved.value);
    });

    it("updates an existing review in place", async () => {
        const repository = await createRepository();
        const saved = await repository.save(toSaveData(createRequestedReview()));
        const review = Review.fromData(saved.value);
        review.start({ actor: reviewer, actorTeamIds: [REVIEW_TEAM_ID], now: LATER });

        const updated = await repository.save(toSaveData(review));

        expect(updated.isOk()).toBe(true);
        const read = await repository.get(saved.value.id);
        expect(read.value).toMatchObject({
            currentStepState: "inReview",
            currentOwnerId: reviewer.id,
            lastChangedOn: LATER
        });
        expect(read.value.steps[0].owner).toEqual(reviewer);
    });

    it("finds the active review of a target revision", async () => {
        const repository = await createRepository();
        const first = await repository.save(
            toSaveData(createRequestedReview({ id: "review-1", targetRevisionId: "article-1#0001" }))
        );
        await repository.save(
            toSaveData(createRequestedReview({ id: "review-2", targetRevisionId: "article-2#0001" }))
        );

        const active = await repository.getActiveByTarget({
            model: ARTICLE_MODEL,
            targetRevisionId: "article-1#0001"
        });
        expect(active.value?.id).toBe("review-1");

        const cancelled = Review.fromData(first.value);
        cancelled.cancel({ actor: requester, now: LATER });
        await repository.save(toSaveData(cancelled));

        const afterCancel = await repository.getActiveByTarget({
            model: ARTICLE_MODEL,
            targetRevisionId: "article-1#0001"
        });
        expect(afterCancel.value).toBeNull();
    });

    it("counts in-progress reviews of a workflow", async () => {
        const repository = await createRepository();
        await repository.save(
            toSaveData(createRequestedReview({ id: "review-1", targetRevisionId: "article-1#0001" }))
        );
        await repository.save(
            toSaveData(createRequestedReview({ id: "review-2", targetRevisionId: "article-2#0001" }))
        );
        const cancelled = createRequestedReview({
            id: "review-3",
            targetRevisionId: "article-3#0001"
        });
        cancelled.cancel({ actor: requester, now: NOW });
        await repository.save(toSaveData(cancelled));
        await repository.save(
            toSaveData(
                createRequestedReview({
                    id: "review-4",
                    targetRevisionId: "article-4#0001",
                    workflow: createWorkflow({ id: "workflow-2" })
                })
            )
        );

        const count = await repository.countInProgressByWorkflow("workflow-1");

        expect(count.isOk()).toBe(true);
        expect(count.value).toBe(2);
    });

    it("returns NotFound for an unknown review", async () => {
        const repository = await createRepository();

        const result = await repository.get("missing");

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(result.error.data).toEqual({ id: "missing" });
    });
});
```

Create `packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createRequestedReview,
    createStartedReview,
    createWorkflowValues,
    requester,
    REVIEW_TEAM_ID,
    reviewer,
    toSaveData
} from "~tests/__helpers/fixtures.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

describe("Delete workflow with reviews", () => {
    it("blocks deleting a workflow while reviews are in progress", async () => {
        const { context } = await createContextHandler();
        const stored = await context.container
            .resolve(StoreWorkflowUseCase)
            .execute({ workflow: createWorkflowValues() });
        const workflow = stored.value;
        const repository = context.container.resolve(ReviewRepository);
        const deleteWorkflow = context.container.resolve(DeleteWorkflowUseCase);

        const first = createRequestedReview({ id: "review-1", workflow });
        await repository.save(toSaveData(first));
        const second = createStartedReview({
            id: "review-2",
            targetRevisionId: "article-2#0001",
            workflow
        });
        await repository.save(toSaveData(second));

        const blocked = await deleteWorkflow.execute({ id: workflow.id });

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Workflow/HasActiveReviews");
        expect(blocked.error.data).toEqual({ count: 2 });

        // Finished reviews (cancelled, rejected) do not block the delete (D81).
        first.cancel({ actor: requester, now: LATER });
        await repository.save(toSaveData(first));
        second.reject({
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID],
            comment: "Not this time.",
            now: LATER
        });
        await repository.save(toSaveData(second));

        const deleted = await deleteWorkflow.execute({ id: workflow.id });

        expect(deleted.isOk()).toBe(true);
    });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewRepository.test.ts packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/review/abstractions/ReviewRepository.js`.

- [ ] **Step 4: Add the model id, model and abstractions**

Replace `packages/api-workflows/src/constants.ts` with:

```ts
export const WORKFLOW_MODEL_ID = "wbyWorkflow";
export const REVIEW_MODEL_ID = "wbyWorkflowReview";
export const WORKFLOWS_PERMISSION = "workflows";
```

Create `packages/api-workflows/src/domain/review/review.model.ts`:

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { REVIEW_MODEL_ID } from "~/constants.js";

/**
 * Private model for reviews (spec 4.2). Current-step fields are top-level so lists and least-loaded
 * can query them (D19); `targetContext` is an object so lists can filter by folder (phase 3).
 * The requester is stored as `requester` because `createdBy` is a reserved CMS field id.
 */
class ReviewModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: REVIEW_MODEL_ID,
                    name: "Workflow Review"
                })
                .fields(fields => ({
                    workflowId: fields.text().label("Workflow ID"),
                    model: fields.text().label("Model"),
                    targetId: fields.text().label("Target ID"),
                    targetRevisionId: fields.text().label("Target revision ID"),
                    title: fields.text().label("Title"),
                    isActive: fields.boolean().label("Is active"),
                    state: fields.text().label("State"),
                    currentStepId: fields.text().label("Current step ID"),
                    currentStepState: fields.text().label("Current step state"),
                    currentOwnerId: fields.text().label("Current owner ID"),
                    currentCandidateTeamIds: fields
                        .text()
                        .label("Current candidate team IDs")
                        .list(),
                    targetContext: fields
                        .object()
                        .label("Target context")
                        .fields(contextFields => ({
                            folder: contextFields
                                .object()
                                .label("Folder")
                                .fields(folderFields => ({
                                    id: folderFields.text().label("ID"),
                                    type: folderFields.text().label("Type")
                                })),
                            modelId: contextFields.text().label("Model ID"),
                            title: contextFields.text().label("Title"),
                            author: contextFields
                                .object()
                                .label("Author")
                                .fields(authorFields => ({
                                    id: authorFields.text().label("ID"),
                                    displayName: authorFields.text().label("Display name")
                                }))
                        })),
                    workflow: fields
                        .object()
                        .label("Workflow")
                        .fields(workflowFields => ({
                            name: workflowFields.text().label("Name"),
                            models: workflowFields.text().label("Models").list()
                        })),
                    steps: fields
                        .object()
                        .label("Steps")
                        .list()
                        .fields(stepFields => ({
                            id: stepFields.text().label("ID"),
                            title: stepFields.text().label("Title"),
                            color: stepFields.text().label("Color"),
                            description: stepFields.longText().label("Description"),
                            type: stepFields.text().label("Type"),
                            notifications: stepFields
                                .object()
                                .label("Notifications")
                                .list()
                                .fields(notificationFields => ({
                                    id: notificationFields.text().label("ID")
                                })),
                            config: stepFields.json().label("Config"),
                            state: stepFields.text().label("State"),
                            owner: stepFields
                                .object()
                                .label("Owner")
                                .fields(ownerFields => ({
                                    type: ownerFields.text().label("Type"),
                                    id: ownerFields.text().label("ID"),
                                    displayName: ownerFields.text().label("Display name"),
                                    identityType: ownerFields.text().label("Identity type")
                                })),
                            comment: stepFields.longText().label("Comment"),
                            pickedUserId: stepFields.text().label("Picked user ID"),
                            candidateTeamIds: stepFields.text().label("Candidate team IDs").list(),
                            assignmentSource: stepFields.text().label("Assignment source"),
                            assignment: stepFields
                                .object()
                                .label("Assignment")
                                .fields(assignmentFields => ({
                                    source: assignmentFields.text().label("Source"),
                                    ruleId: assignmentFields.text().label("Rule ID"),
                                    reason: assignmentFields.longText().label("Reason"),
                                    by: assignmentFields
                                        .object()
                                        .label("By")
                                        .fields(byFields => ({
                                            type: byFields.text().label("Type"),
                                            id: byFields.text().label("ID"),
                                            displayName: byFields.text().label("Display name"),
                                            identityType: byFields.text().label("Identity type")
                                        }))
                                })),
                            reachedOn: stepFields.datetime().label("Reached on").withoutTimezone(),
                            startedOn: stepFields.datetime().label("Started on").withoutTimezone(),
                            finishedOn: stepFields.datetime().label("Finished on").withoutTimezone()
                        })),
                    requester: fields
                        .object()
                        .label("Requester")
                        .fields(requesterFields => ({
                            type: requesterFields.text().label("Type"),
                            id: requesterFields.text().label("ID"),
                            displayName: requesterFields.text().label("Display name"),
                            identityType: requesterFields.text().label("Identity type")
                        })),
                    lastChangedOn: fields.datetime().label("Last changed on").withoutTimezone()
                }))
        ];
    }
}

export const ReviewModel = ModelFactory.createImplementation({
    implementation: ReviewModelImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/domain/review/abstractions/ReviewModelProvider.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IReviewModelProvider {
    get(): Promise<CmsModel>;
}

/** Provides the tenant's `wbyWorkflowReview` model on demand. */
export const ReviewModelProvider = createAbstraction<IReviewModelProvider>("ReviewModelProvider");

export namespace ReviewModelProvider {
    export type Interface = IReviewModelProvider;
}
```

Create `packages/api-workflows/src/domain/review/abstractions/ReviewRepository.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "../types.js";
import type { ReviewNotFoundError, ReviewPersistenceError } from "../errors.js";

export interface ReviewRepositoryActiveByTargetParams {
    model: string;
    targetRevisionId: string;
}

export interface IReviewRepository {
    get(id: string): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>>;
    /** At most one active review per target revision (D23). */
    getActiveByTarget(
        params: ReviewRepositoryActiveByTargetParams
    ): Promise<Result<ReviewData | null, ReviewPersistenceError>>;
    countInProgressByWorkflow(workflowId: string): Promise<Result<number, ReviewPersistenceError>>;
    /** Create or update. Only `ReviewSaver` (the single save path) calls this. */
    save(review: ReviewData): Promise<Result<ReviewData, ReviewPersistenceError>>;
}

/** Reads and writes reviews (entries of the private `wbyWorkflowReview` model, revision 1). */
export const ReviewRepository = createAbstraction<IReviewRepository>("ReviewRepository");

export namespace ReviewRepository {
    export type Interface = IReviewRepository;
    export type ActiveByTargetParams = ReviewRepositoryActiveByTargetParams;
}
```

- [ ] **Step 5: Add the mapper, provider, repository and shared feature**

Create `packages/api-workflows/src/features/shared/toIsoString.ts`:

```ts
/** CMS returns `datetime` values as `Date` when read from storage and as strings on write. */
export const toIsoString = (value: unknown): string | null => {
    if (value instanceof Date) {
        return value.toISOString();
    }
    if (typeof value === "string" && value.length > 0) {
        return value;
    }
    return null;
};
```

Create `packages/api-workflows/src/features/review/shared/ReviewEntryMapper.ts`:

```ts
import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { WorkflowStepNotification } from "~/domain/workflow/types.js";
import type {
    Actor,
    ActorType,
    ReviewData,
    ReviewState,
    ReviewStep,
    ReviewStepAssignment,
    StepState,
    TargetContextAuthor,
    TargetContextFolder
} from "~/domain/review/types.js";
import { toIsoString } from "~/features/shared/toIsoString.js";

export interface ReviewEntryActor {
    type: string;
    id: string;
    displayName: string;
    identityType: string | null;
}

export interface ReviewEntryStepAssignment {
    source: string;
    ruleId: string | null;
    reason: string | null;
    by: ReviewEntryActor | null;
}

export interface ReviewEntryStep {
    id: string;
    title: string;
    color: string | null;
    description: string | null;
    type: string;
    notifications: WorkflowStepNotification[] | null;
    config: unknown;
    state: string;
    owner: ReviewEntryActor | null;
    comment: string | null;
    pickedUserId: string | null;
    candidateTeamIds: string[] | null;
    assignmentSource: string | null;
    assignment: ReviewEntryStepAssignment | null;
    reachedOn: string | Date | null;
    startedOn: string | Date | null;
    finishedOn: string | Date | null;
}

export interface ReviewEntryTargetContext {
    folder: TargetContextFolder | null;
    modelId: string;
    title: string;
    author: TargetContextAuthor | null;
}

export interface ReviewEntryWorkflow {
    name: string;
    models: string[] | null;
}

export interface ReviewEntryValues {
    workflowId: string;
    model: string;
    targetId: string;
    targetRevisionId: string;
    title: string;
    isActive: boolean;
    state: string;
    currentStepId: string | null;
    currentStepState: string | null;
    currentOwnerId: string | null;
    currentCandidateTeamIds: string[] | null;
    targetContext: ReviewEntryTargetContext | null;
    workflow: ReviewEntryWorkflow | null;
    steps: ReviewEntryStep[] | null;
    requester: ReviewEntryActor | null;
    lastChangedOn: string | Date | null;
}

const toEntryActor = (actor: Actor): ReviewEntryActor => {
    return {
        type: actor.type,
        id: actor.id,
        displayName: actor.displayName,
        identityType: actor.identityType ?? null
    };
};

const fromEntryActor = (value: ReviewEntryActor | null | undefined): Actor | null => {
    if (!value?.id) {
        return null;
    }
    return {
        type: value.type as ActorType,
        id: value.id,
        displayName: value.displayName ?? "",
        ...(value.identityType ? { identityType: value.identityType } : {})
    };
};

/** Maps reviews to and from `wbyWorkflowReview` entries; nulls in storage become absent optionals. */
export class ReviewEntryMapper {
    public static toValues(review: ReviewData): ReviewEntryValues {
        return {
            workflowId: review.workflowId,
            model: review.model,
            targetId: review.targetId,
            targetRevisionId: review.targetRevisionId,
            title: review.title,
            isActive: review.isActive,
            state: review.state,
            currentStepId: review.currentStepId,
            currentStepState: review.currentStepState,
            currentOwnerId: review.currentOwnerId,
            currentCandidateTeamIds: [...review.currentCandidateTeamIds],
            targetContext: {
                folder: review.targetContext.folder ? { ...review.targetContext.folder } : null,
                modelId: review.targetContext.modelId,
                title: review.targetContext.title,
                author: { ...review.targetContext.author }
            },
            workflow: {
                name: review.workflow.name,
                models: [...review.workflow.models]
            },
            steps: review.steps.map(step => ReviewEntryMapper.stepToEntry(step)),
            requester: toEntryActor(review.createdBy),
            lastChangedOn: review.lastChangedOn
        };
    }

    public static fromEntry(entry: CmsEntry<ReviewEntryValues>): ReviewData {
        const { id } = parseIdentifier(entry.id);
        const values = entry.values;
        const folder = values.targetContext?.folder;
        return {
            id,
            workflowId: values.workflowId,
            model: values.model,
            targetId: values.targetId,
            targetRevisionId: values.targetRevisionId,
            title: values.title,
            isActive: values.isActive === true,
            state: values.state as ReviewState,
            currentStepId: values.currentStepId ?? null,
            currentStepState: (values.currentStepState ?? null) as StepState | null,
            currentOwnerId: values.currentOwnerId ?? null,
            currentCandidateTeamIds: values.currentCandidateTeamIds ?? [],
            targetContext: {
                folder: folder?.id ? { id: folder.id, type: folder.type } : null,
                modelId: values.targetContext?.modelId ?? "",
                title: values.targetContext?.title ?? "",
                author: {
                    id: values.targetContext?.author?.id ?? "",
                    displayName: values.targetContext?.author?.displayName ?? ""
                }
            },
            workflow: {
                name: values.workflow?.name ?? "",
                models: values.workflow?.models ?? []
            },
            steps: (values.steps ?? []).map(step => ReviewEntryMapper.stepFromEntry(step)),
            createdBy: fromEntryActor(values.requester) ?? {
                type: "user",
                id: "",
                displayName: ""
            },
            createdOn: entry.createdOn,
            savedOn: entry.savedOn,
            lastChangedOn: toIsoString(values.lastChangedOn) ?? entry.savedOn
        };
    }

    private static stepToEntry(step: ReviewStep): ReviewEntryStep {
        return {
            id: step.id,
            title: step.title,
            color: step.color,
            description: step.description ?? null,
            type: step.type,
            notifications: step.notifications.map(notification => ({ id: notification.id })),
            config: step.config,
            state: step.state,
            owner: step.owner ? toEntryActor(step.owner) : null,
            comment: step.comment,
            pickedUserId: step.pickedUserId,
            candidateTeamIds: [...step.candidateTeamIds],
            assignmentSource: step.assignmentSource,
            assignment: step.assignment
                ? {
                      source: step.assignment.source,
                      ruleId: step.assignment.ruleId ?? null,
                      reason: step.assignment.reason ?? null,
                      by: step.assignment.by ? toEntryActor(step.assignment.by) : null
                  }
                : null,
            reachedOn: step.reachedOn,
            startedOn: step.startedOn,
            finishedOn: step.finishedOn
        };
    }

    private static stepFromEntry(step: ReviewEntryStep): ReviewStep {
        return {
            id: step.id,
            title: step.title,
            color: step.color ?? "",
            ...(step.description ? { description: step.description } : {}),
            type: step.type,
            notifications: (step.notifications ?? []).map(notification => ({
                id: notification.id
            })),
            config: step.config ?? null,
            state: step.state as StepState,
            owner: fromEntryActor(step.owner),
            comment: step.comment ?? null,
            pickedUserId: step.pickedUserId ?? null,
            candidateTeamIds: step.candidateTeamIds ?? [],
            assignmentSource: step.assignmentSource ?? null,
            assignment: ReviewEntryMapper.assignmentFromEntry(step.assignment),
            reachedOn: toIsoString(step.reachedOn),
            startedOn: toIsoString(step.startedOn),
            finishedOn: toIsoString(step.finishedOn)
        };
    }

    private static assignmentFromEntry(
        value: ReviewEntryStepAssignment | null | undefined
    ): ReviewStepAssignment | null {
        if (!value?.source) {
            return null;
        }
        const by = fromEntryActor(value.by);
        return {
            source: value.source,
            ...(value.ruleId ? { ruleId: value.ruleId } : {}),
            ...(value.reason ? { reason: value.reason } : {}),
            ...(by ? { by } : {})
        };
    }
}
```

Create `packages/api-workflows/src/features/review/shared/ReviewModelProvider.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ReviewModelProvider as Abstraction } from "~/domain/review/abstractions/ReviewModelProvider.js";
import { REVIEW_MODEL_ID } from "~/constants.js";

/** Same contract as `WorkflowModelProvider`: no memoization, no `withoutAuthorization`. */
class ReviewModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(REVIEW_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const ReviewModelProvider = Abstraction.createImplementation({
    implementation: ReviewModelProviderImpl,
    dependencies: [GetModelUseCase]
});
```

Create `packages/api-workflows/src/features/review/shared/ReviewRepository.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { ReviewModelProvider } from "~/domain/review/abstractions/ReviewModelProvider.js";
import { ReviewRepository as Abstraction } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewNotFoundError, ReviewPersistenceError } from "~/domain/review/errors.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewEntryMapper, type ReviewEntryValues } from "./ReviewEntryMapper.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";

class ReviewRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: ReviewModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async get(id: string): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.getEntryById.execute<ReviewEntryValues>(
            model,
            createIdentifier({ id, version: 1 })
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.fail(new ReviewNotFoundError({ id }));
            }
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        return Result.ok(ReviewEntryMapper.fromEntry(result.value));
    }

    async getActiveByTarget(
        params: Abstraction.ActiveByTargetParams
    ): Promise<Result<ReviewData | null, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.listLatestEntries.execute<ReviewEntryValues>(model, {
            where: {
                values: {
                    model: params.model,
                    targetRevisionId: params.targetRevisionId,
                    isActive: true
                }
            },
            sort: ["createdOn_DESC"],
            limit: 1
        });
        if (result.isFail()) {
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        const [entry] = result.value.entries;
        return Result.ok(entry ? ReviewEntryMapper.fromEntry(entry) : null);
    }

    async countInProgressByWorkflow(
        workflowId: string
    ): Promise<Result<number, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.listLatestEntries.execute<ReviewEntryValues>(model, {
            where: {
                values: {
                    workflowId,
                    state: "inProgress"
                }
            },
            limit: 1
        });
        if (result.isFail()) {
            return Result.fail(new ReviewPersistenceError(result.error));
        }
        return Result.ok(result.value.meta.totalCount);
    }

    async save(review: ReviewData): Promise<Result<ReviewData, ReviewPersistenceError>> {
        const model = await this.modelProvider.get();
        const id = createIdentifier({ id: review.id, version: 1 });
        const values = ReviewEntryMapper.toValues(review);

        const existing = await this.getEntryById.execute<ReviewEntryValues>(model, id);
        if (existing.isFail() && existing.error.code !== ENTRY_NOT_FOUND) {
            return Result.fail(new ReviewPersistenceError(existing.error));
        }

        if (existing.isOk()) {
            const updated = await this.updateEntry.execute<ReviewEntryValues>(model, id, {
                values
            });
            if (updated.isFail()) {
                return Result.fail(new ReviewPersistenceError(updated.error));
            }
            return Result.ok(ReviewEntryMapper.fromEntry(updated.value));
        }

        const created = await this.createEntry.execute<ReviewEntryValues>(model, {
            id: review.id,
            values
        });
        if (created.isFail()) {
            return Result.fail(new ReviewPersistenceError(created.error));
        }
        return Result.ok(ReviewEntryMapper.fromEntry(created.value));
    }
}

export const ReviewRepository = Abstraction.createImplementation({
    implementation: ReviewRepositoryImpl,
    dependencies: [
        ReviewModelProvider,
        GetEntryByIdUseCase,
        ListLatestEntriesUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase
    ]
});
```

Create `packages/api-workflows/src/features/review/shared/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ReviewModelProvider } from "./ReviewModelProvider.js";
import { ReviewRepository } from "./ReviewRepository.js";

export const ReviewSharedFeature = createFeature({
    name: "Workflows/ReviewShared",
    register(container) {
        container.register(ReviewModelProvider);
        container.register(ReviewRepository).inSingletonScope();
    }
});
```

- [ ] **Step 6: Block workflow delete while reviews run**

Append to `packages/api-workflows/src/domain/workflow/errors.ts`:

```ts
export interface WorkflowHasActiveReviewsErrorData {
    count: number;
}

/** D81. Phase 3 adds up to 5 readable blocking reviews to the data (D115). */
export class WorkflowHasActiveReviewsError extends BaseError<WorkflowHasActiveReviewsErrorData> {
    override readonly code = "Workflows/Workflow/HasActiveReviews" as const;

    constructor(data: WorkflowHasActiveReviewsErrorData) {
        super({
            message: `The workflow cannot be deleted while ${data.count} review(s) are in progress.`,
            data
        });
    }
}
```

Replace `packages/api-workflows/src/features/workflow/DeleteWorkflow/abstractions.ts` with:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Workflow } from "~/domain/workflow/types.js";
import type {
    WorkflowHasActiveReviewsError,
    WorkflowNotFoundError,
    WorkflowPersistenceError
} from "~/domain/workflow/errors.js";

export interface DeleteWorkflowInput {
    id: string;
}

export interface IDeleteWorkflowUseCaseErrors {
    notFound: WorkflowNotFoundError;
    hasActiveReviews: WorkflowHasActiveReviewsError;
    persistence: WorkflowPersistenceError;
}

type UseCaseError = IDeleteWorkflowUseCaseErrors[keyof IDeleteWorkflowUseCaseErrors];

export interface IDeleteWorkflowUseCase {
    execute(input: DeleteWorkflowInput): Promise<Result<Workflow, UseCaseError>>;
}

/** Delete a workflow unless any of its reviews is in progress. No permission check in 1a. */
export const DeleteWorkflowUseCase =
    createAbstraction<IDeleteWorkflowUseCase>("DeleteWorkflowUseCase");

export namespace DeleteWorkflowUseCase {
    export type Interface = IDeleteWorkflowUseCase;
    export type Input = DeleteWorkflowInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<Workflow, UseCaseError>>;
}
```

Replace `packages/api-workflows/src/features/workflow/DeleteWorkflow/DeleteWorkflowUseCase.ts` with:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import {
    WorkflowHasActiveReviewsError,
    WorkflowPersistenceError
} from "~/domain/workflow/errors.js";
import { WorkflowAfterDeleteEvent, WorkflowBeforeDeleteEvent } from "../events.js";
import { DeleteWorkflowUseCase as UseCase } from "./abstractions.js";

class DeleteWorkflowUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: WorkflowRepository.Interface,
        private reviewRepository: ReviewRepository.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const existing = await this.repository.get(input.id);
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }
        const workflow = existing.value;

        // Finished reviews keep their snapshot and do not block the delete (D81).
        const inProgress = await this.reviewRepository.countInProgressByWorkflow(workflow.id);
        if (inProgress.isFail()) {
            return Result.fail(new WorkflowPersistenceError(inProgress.error));
        }
        if (inProgress.value > 0) {
            return Result.fail(new WorkflowHasActiveReviewsError({ count: inProgress.value }));
        }

        await this.eventPublisher.publish(new WorkflowBeforeDeleteEvent({ workflow }));

        const result = await this.repository.delete(workflow.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(new WorkflowAfterDeleteEvent({ workflow }));
        return Result.ok(workflow);
    }
}

export const DeleteWorkflowUseCase = UseCase.createImplementation({
    implementation: DeleteWorkflowUseCaseImpl,
    dependencies: [WorkflowRepository, ReviewRepository, EventPublisher]
});
```

- [ ] **Step 7: Register the review model and repository**

Replace `packages/api-workflows/src/WorkflowsFeature.ts` with:

```ts
import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowModel } from "~/domain/workflow/workflow.model.js";
import { ReviewModel } from "~/domain/review/review.model.js";
import { ListNotificationTypesFeature } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransportFeature } from "~/features/notifications/NotificationTransport/index.js";
import { WorkflowSharedFeature } from "~/features/workflow/shared/feature.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";
import { ReviewSharedFeature } from "~/features/review/shared/feature.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated. Check the effective flag at register time
        // (the license is refreshed pre-register) so nothing is wired up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Private CMS models, registered early so HeadlessCmsInitializerImpl picks them up when
        // it builds the model list during the enhance phase.
        container.register(WorkflowModel);
        container.register(ReviewModel);

        // Notifications (unchanged until phase 7)
        ListNotificationTypesFeature.register(container);
        NotificationTransportFeature.register(container);

        // Workflows
        WorkflowSharedFeature.register(container);
        GetWorkflowFeature.register(container);
        ListWorkflowsFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);

        // Reviews
        ReviewSharedFeature.register(container);
    }
});
```

- [ ] **Step 8: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewRepository.test.ts packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts 2>&1 | tail -50`
Expected: PASS (6 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS (the list queries in `getActiveByTarget` and `countInProgressByWorkflow` run against OpenSearch here).

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add review model and repository, block deleting workflows with active reviews

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 7: Review lifecycle collaborators — target loader, target sync, resolver, step reacher, single save path, events

**Files:**
- Create: `packages/api-workflows/src/features/review/ReviewTargetLoader/abstractions.ts`, `packages/api-workflows/src/features/review/ReviewTargetLoader/index.ts`
- Create: `packages/api-workflows/src/features/review/ReviewTargetSync/abstractions.ts`, `packages/api-workflows/src/features/review/ReviewTargetSync/NoopReviewTargetSync.ts`, `packages/api-workflows/src/features/review/ReviewTargetSync/index.ts`
- Create: `packages/api-workflows/src/features/review/StepAssignmentResolver/abstractions.ts`, `packages/api-workflows/src/features/review/StepAssignmentResolver/PoolStepAssignmentResolver.ts`, `packages/api-workflows/src/features/review/StepAssignmentResolver/index.ts`
- Create: `packages/api-workflows/src/features/review/ReviewStepReacher/abstractions.ts`, `packages/api-workflows/src/features/review/ReviewStepReacher/ReviewStepReacher.ts`
- Create: `packages/api-workflows/src/features/review/ReviewSaver/abstractions.ts`, `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`
- Create: `packages/api-workflows/src/features/review/events.ts`
- Create: `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts`
- Modify: `packages/api-workflows/src/types.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingReviewTargetSync.ts`
- Create: `packages/api-workflows/__tests__/review/ReviewSaver.test.ts`

**Interfaces:**
- Consumes: `Review`, `ReviewData`, `ReviewFact`, `ReviewSystemWorkflow`, `StepAssignmentResolution`, `TargetContext` (Tasks 4-5), `ReviewRepository` (Task 6), `parseReviewStepConfig` (Task 2), `EventPublisher`, `DomainEvent`, `IEventHandler`.
- Produces:
  - `ReviewTargetLoader.Interface { canLoad(model: string): boolean; load(params: { model; targetId; targetRevisionId }): Promise<{ title: string; context: TargetContext } | null> }` (no implementation in 1a).
  - `ReviewTargetSync.Interface { sync(params: { review: ReviewData; systemWorkflow: ReviewSystemWorkflow | null }): Promise<void> }`; default `NoopReviewTargetSync`.
  - `StepAssignmentResolver.Interface { resolve(params: { review: ReviewData; step: ReviewStep }): Promise<StepAssignmentResolution> }`; default `PoolStepAssignmentResolver`.
  - `ReviewStepReacher.Interface { reach(params: { review: Review; actor: Actor; now: string }): Promise<Result<void, ReviewInvalidStateError>> }`.
  - `ReviewSaver.Interface { save(review: Review): Promise<Result<ReviewData, ReviewPersistenceError>> }`.
  - Events in `@webiny/api-workflows/features/review/events.js`: `ReviewRequestedEvent`, `ReviewStepReachedEvent`, `ReviewStepStartedEvent`, `ReviewStepTakenOverEvent`, `ReviewStepApprovedEvent`, `ReviewStepRejectedEvent`, `ReviewCancelledEvent`, `ReviewApprovedEvent` (payload `ReviewEventPayload<TFact> { review: ReviewData; fact: TFact }`), handler abstractions `…EventHandler`, union `ReviewEvent`.
  - `ICmsEntrySystem.workflow?: ReviewSystemWorkflow | null` (module augmentation of `@webiny/api-headless-cms/types/types.js`).

- [ ] **Step 1: Write the sync recorder used by tests**

Create `packages/api-workflows/__tests__/__helpers/RecordingReviewTargetSync.ts`:

```ts
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";

/** Every `ReviewTargetSync.sync` call while the decorator is registered. Reset per test. */
export const recordedSyncs: ReviewTargetSync.Params[] = [];

class RecordingReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    constructor(private decoratee: ReviewTargetSync.Interface) {}

    async sync(params: ReviewTargetSync.Params): Promise<void> {
        recordedSyncs.push(structuredClone(params));
        await this.decoratee.sync(params);
    }
}

export const RecordingReviewTargetSync = ReviewTargetSync.createDecorator({
    decorator: RecordingReviewTargetSyncImpl,
    dependencies: []
});
```

- [ ] **Step 2: Write the failing test**

Create `packages/api-workflows/__tests__/review/ReviewSaver.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    ARTICLE_MODEL,
    createRequestedReview,
    createWorkflow,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import {
    RecordingReviewTargetSync,
    recordedSyncs
} from "~tests/__helpers/RecordingReviewTargetSync.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { ReviewStepReacher } from "~/features/review/ReviewStepReacher/abstractions.js";
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";
import { ReviewTargetLoader } from "~/features/review/ReviewTargetLoader/index.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/index.js";
import type { ReviewStepReachedEvent } from "~/features/review/events.js";

const LATER = "2026-10-09T11:00:00.000Z";

const createRecordingContext = async () => {
    recordedEvents.length = 0;
    recordedSyncs.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(RecordingReviewTargetSync);
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    return context;
};

describe("ReviewSaver", () => {
    it("persists the review, syncs system.workflow, then publishes one event per fact", async () => {
        const context = await createRecordingContext();
        const review = createRequestedReview();

        const result = await context.container.resolve(ReviewSaver).save(review);

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            currentStepId: "legal",
            currentStepState: "awaiting",
            currentCandidateTeamIds: [REVIEW_TEAM_ID],
            lastChangedOn: NOW
        });
        const stored = await context.container.resolve(ReviewRepository).get(review.id);
        expect(stored.value).toEqual(result.value);
        expect(recordedSyncs).toEqual([
            {
                review: result.value,
                systemWorkflow: {
                    workflowId: "workflow-1",
                    reviewState: "inProgress",
                    stepId: "legal",
                    stepName: "Legal review",
                    stepState: "awaiting"
                }
            }
        ]);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);
        const reached = recordedEvents.find(
            event => event.eventType === "Workflows/Review/StepReached"
        ) as ReviewStepReachedEvent;
        expect(reached.payload.review).toEqual(result.value);
        expect(reached.payload.fact).toEqual({
            type: "stepReached",
            occurredOn: NOW,
            actor: requester,
            change: { stepId: "legal", fromState: "pending", toState: "awaiting" },
            assignment: { source: "pool" }
        });
    });

    it("hands null to the target sync after cancel", async () => {
        const context = await createRecordingContext();
        const saver = context.container.resolve(ReviewSaver);
        const saved = await saver.save(createRequestedReview());
        recordedSyncs.length = 0;
        recordedEvents.length = 0;
        const review = Review.fromData(saved.value);
        review.cancel({ actor: requester, now: LATER });

        const result = await saver.save(review);

        expect(result.value).toMatchObject({
            state: "cancelled",
            isActive: false,
            currentStepId: null,
            lastChangedOn: LATER
        });
        expect(recordedSyncs.map(sync => sync.systemWorkflow)).toEqual([null]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/Cancelled"]);
    });
});

describe("Review lifecycle defaults", () => {
    it("ships a no-op target sync, no target loaders and a pool-only resolver", async () => {
        const { context } = await createContextHandler();
        const review = createRequestedReview({
            picks: [{ stepId: "legal", userId: "user-picked" }]
        }).toData();

        await expect(
            context.container.resolve(ReviewTargetSync).sync({ review, systemWorkflow: null })
        ).resolves.toBeUndefined();
        expect(context.container.resolveAll(ReviewTargetLoader)).toEqual([]);

        const resolution = await context.container
            .resolve(StepAssignmentResolver)
            .resolve({ review, step: review.steps[0] });

        expect(resolution).toEqual({
            owner: null,
            candidateTeamIds: [REVIEW_TEAM_ID],
            assignment: { source: "pool" }
        });
    });

    it("reaches the current pending step through the resolver once", async () => {
        const { context } = await createContextHandler();
        const review = Review.request({
            id: "review-1",
            workflow: createWorkflow(),
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article 1",
            targetContext,
            picks: [],
            requester,
            now: NOW
        }).value;
        const reacher = context.container.resolve(ReviewStepReacher);

        const first = await reacher.reach({ review, actor: requester, now: NOW });
        const second = await reacher.reach({ review, actor: requester, now: NOW });

        expect(first.isOk()).toBe(true);
        expect(second.isOk()).toBe(true);
        expect(review.toData().steps[0]).toMatchObject({
            state: "awaiting",
            candidateTeamIds: [REVIEW_TEAM_ID]
        });
        expect(review.pullFacts().filter(fact => fact.type === "stepReached")).toHaveLength(1);
    });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewSaver.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/review/ReviewTargetSync/index.js`.

- [ ] **Step 4: Add the extension points**

Create `packages/api-workflows/src/features/review/ReviewTargetLoader/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { TargetContext } from "~/domain/review/types.js";

export interface ReviewTargetLoadParams {
    model: string;
    targetId: string;
    targetRevisionId: string;
}

export interface ReviewTarget {
    title: string;
    context: TargetContext;
}

export interface IReviewTargetLoader {
    /** Whether this loader handles the namespace id, e.g. "cms.article" or "wb.page". */
    canLoad(model: string): boolean;
    /** The target revision's title and typed context; `null` when the revision does not exist. */
    load(params: ReviewTargetLoadParams): Promise<ReviewTarget | null>;
}

/**
 * Loads the content under review (spec 9.3). One implementation per namespace, registered by the
 * target adapters in phase 2; 1a ships none.
 */
export const ReviewTargetLoader = createAbstraction<IReviewTargetLoader>("ReviewTargetLoader");

export namespace ReviewTargetLoader {
    export type Interface = IReviewTargetLoader;
    export type LoadParams = ReviewTargetLoadParams;
    export type Target = ReviewTarget;
}
```

Create `packages/api-workflows/src/features/review/ReviewTargetLoader/index.ts`:

```ts
export { ReviewTargetLoader } from "./abstractions.js";
export type { ReviewTarget, ReviewTargetLoadParams } from "./abstractions.js";
```

Create `packages/api-workflows/src/features/review/ReviewTargetSync/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { ReviewData, ReviewSystemWorkflow } from "~/domain/review/types.js";

export interface ReviewTargetSyncParams {
    /** The review as persisted. */
    review: ReviewData;
    /** The new `system.workflow` value; `null` unlocks the target (cancel, D75). */
    systemWorkflow: ReviewSystemWorkflow | null;
}

export interface IReviewTargetSync {
    sync(params: ReviewTargetSyncParams): Promise<void>;
}

/**
 * Writes `system.workflow` on the target after every review save (spec 4.5, D52). 1a registers a
 * no-op; phase 2 registers the target adapters' implementation (`UpdateEntrySystemUseCase`).
 */
export const ReviewTargetSync = createAbstraction<IReviewTargetSync>("ReviewTargetSync");

export namespace ReviewTargetSync {
    export type Interface = IReviewTargetSync;
    export type Params = ReviewTargetSyncParams;
}
```

Create `packages/api-workflows/src/features/review/ReviewTargetSync/NoopReviewTargetSync.ts`:

```ts
import { ReviewTargetSync } from "./abstractions.js";

/** Default until phase 2 registers the target adapters' sync. */
class NoopReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    async sync(): Promise<void> {
        // Intentionally empty.
    }
}

export const NoopReviewTargetSync = ReviewTargetSync.createImplementation({
    implementation: NoopReviewTargetSyncImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/features/review/ReviewTargetSync/index.ts`:

```ts
export { ReviewTargetSync } from "./abstractions.js";
export type { ReviewTargetSyncParams } from "./abstractions.js";
```

Create `packages/api-workflows/src/features/review/StepAssignmentResolver/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type {
    ReviewData,
    ReviewStep,
    StepAssignmentResolution
} from "~/domain/review/types.js";

export interface StepAssignmentResolverParams {
    review: ReviewData;
    /** The review step being reached; carries `pickedUserId` and the step config. */
    step: ReviewStep;
}

export interface IStepAssignmentResolver {
    resolve(params: StepAssignmentResolverParams): Promise<StepAssignmentResolution>;
}

/**
 * Decides who holds a review step when it is reached (spec 5.2, 6). 1a registers a pool-only
 * resolver; phase 4 replaces it with picks, rules and strategies.
 */
export const StepAssignmentResolver =
    createAbstraction<IStepAssignmentResolver>("StepAssignmentResolver");

export namespace StepAssignmentResolver {
    export type Interface = IStepAssignmentResolver;
    export type Params = StepAssignmentResolverParams;
    export type Resolution = StepAssignmentResolution;
}
```

Create `packages/api-workflows/src/features/review/StepAssignmentResolver/PoolStepAssignmentResolver.ts`:

```ts
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import { StepAssignmentResolver } from "./abstractions.js";

/** Every review step goes to its teams' pool; picks are stored but ignored until phase 4 (R3). */
class PoolStepAssignmentResolverImpl implements StepAssignmentResolver.Interface {
    async resolve(params: StepAssignmentResolver.Params): Promise<StepAssignmentResolver.Resolution> {
        const config = parseReviewStepConfig(params.step.config);
        return {
            owner: null,
            candidateTeamIds: config ? [...config.teams] : [],
            assignment: { source: "pool" }
        };
    }
}

export const PoolStepAssignmentResolver = StepAssignmentResolver.createImplementation({
    implementation: PoolStepAssignmentResolverImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/features/review/StepAssignmentResolver/index.ts`:

```ts
export { StepAssignmentResolver } from "./abstractions.js";
export type { StepAssignmentResolverParams } from "./abstractions.js";
```

- [ ] **Step 5: Add the step reacher**

Create `packages/api-workflows/src/features/review/ReviewStepReacher/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Review } from "~/domain/review/Review.js";
import type { Actor } from "~/domain/review/types.js";
import type { ReviewInvalidStateError } from "~/domain/review/errors.js";

export interface ReviewStepReacherParams {
    review: Review;
    /** Who caused the step to be reached (requester, or approver of the previous step). */
    actor: Actor;
    now: string;
}

export interface IReviewStepReacher {
    reach(params: ReviewStepReacherParams): Promise<Result<void, ReviewInvalidStateError>>;
}

/**
 * The one code path for "step reached" (spec 5.2, D2, D6). No-op when the current step is not
 * pending. Phase 5 dispatches here by step type.
 */
export const ReviewStepReacher = createAbstraction<IReviewStepReacher>("ReviewStepReacher");

export namespace ReviewStepReacher {
    export type Interface = IReviewStepReacher;
    export type Params = ReviewStepReacherParams;
}
```

Create `packages/api-workflows/src/features/review/ReviewStepReacher/ReviewStepReacher.ts`:

```ts
import { Result } from "@webiny/feature/api";
import type { ReviewInvalidStateError } from "~/domain/review/errors.js";
import { StepAssignmentResolver } from "../StepAssignmentResolver/abstractions.js";
import { ReviewStepReacher as Abstraction } from "./abstractions.js";

class ReviewStepReacherImpl implements Abstraction.Interface {
    constructor(private resolver: StepAssignmentResolver.Interface) {}

    async reach(params: Abstraction.Params): Promise<Result<void, ReviewInvalidStateError>> {
        const step = params.review.getStepToReach();
        if (!step) {
            return Result.ok();
        }
        const resolution = await this.resolver.resolve({ review: params.review.toData(), step });
        return params.review.reach({ resolution, actor: params.actor, now: params.now });
    }
}

export const ReviewStepReacher = Abstraction.createImplementation({
    implementation: ReviewStepReacherImpl,
    dependencies: [StepAssignmentResolver]
});
```

- [ ] **Step 6: Add the review events**

Create `packages/api-workflows/src/features/review/events.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewApprovedFact,
    ReviewCancelledFact,
    ReviewFact,
    ReviewRequestedFact,
    ReviewStepApprovedFact,
    ReviewStepReachedFact,
    ReviewStepRejectedFact,
    ReviewStepStartedFact,
    ReviewStepTakenOverFact
} from "~/domain/review/facts.js";

/**
 * Every review event carries the persisted review (ids, workflow snapshot, steps) and the fact
 * (actor, step id, from/to state, comment), enough for a later "Workflows" audit app (spec 9.5).
 */
export interface ReviewEventPayload<TFact extends ReviewFact> {
    review: ReviewData;
    fact: TFact;
}

// ============================================================================
// Requested
// ============================================================================

export class ReviewRequestedEvent extends DomainEvent<ReviewEventPayload<ReviewRequestedFact>> {
    eventType = "Workflows/Review/Requested" as const;

    getHandlerAbstraction() {
        return ReviewRequestedEventHandler;
    }
}

export const ReviewRequestedEventHandler = createAbstraction<IEventHandler<ReviewRequestedEvent>>(
    "ReviewRequestedEventHandler"
);

export namespace ReviewRequestedEventHandler {
    export type Interface = IEventHandler<ReviewRequestedEvent>;
    export type Event = ReviewRequestedEvent;
}

// ============================================================================
// StepReached
// ============================================================================

export class ReviewStepReachedEvent extends DomainEvent<ReviewEventPayload<ReviewStepReachedFact>> {
    eventType = "Workflows/Review/StepReached" as const;

    getHandlerAbstraction() {
        return ReviewStepReachedEventHandler;
    }
}

export const ReviewStepReachedEventHandler = createAbstraction<
    IEventHandler<ReviewStepReachedEvent>
>("ReviewStepReachedEventHandler");

export namespace ReviewStepReachedEventHandler {
    export type Interface = IEventHandler<ReviewStepReachedEvent>;
    export type Event = ReviewStepReachedEvent;
}

// ============================================================================
// StepStarted
// ============================================================================

export class ReviewStepStartedEvent extends DomainEvent<ReviewEventPayload<ReviewStepStartedFact>> {
    eventType = "Workflows/Review/StepStarted" as const;

    getHandlerAbstraction() {
        return ReviewStepStartedEventHandler;
    }
}

export const ReviewStepStartedEventHandler = createAbstraction<
    IEventHandler<ReviewStepStartedEvent>
>("ReviewStepStartedEventHandler");

export namespace ReviewStepStartedEventHandler {
    export type Interface = IEventHandler<ReviewStepStartedEvent>;
    export type Event = ReviewStepStartedEvent;
}

// ============================================================================
// StepTakenOver
// ============================================================================

export class ReviewStepTakenOverEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepTakenOverFact>
> {
    eventType = "Workflows/Review/StepTakenOver" as const;

    getHandlerAbstraction() {
        return ReviewStepTakenOverEventHandler;
    }
}

export const ReviewStepTakenOverEventHandler = createAbstraction<
    IEventHandler<ReviewStepTakenOverEvent>
>("ReviewStepTakenOverEventHandler");

export namespace ReviewStepTakenOverEventHandler {
    export type Interface = IEventHandler<ReviewStepTakenOverEvent>;
    export type Event = ReviewStepTakenOverEvent;
}

// ============================================================================
// StepApproved
// ============================================================================

export class ReviewStepApprovedEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepApprovedFact>
> {
    eventType = "Workflows/Review/StepApproved" as const;

    getHandlerAbstraction() {
        return ReviewStepApprovedEventHandler;
    }
}

export const ReviewStepApprovedEventHandler = createAbstraction<
    IEventHandler<ReviewStepApprovedEvent>
>("ReviewStepApprovedEventHandler");

export namespace ReviewStepApprovedEventHandler {
    export type Interface = IEventHandler<ReviewStepApprovedEvent>;
    export type Event = ReviewStepApprovedEvent;
}

// ============================================================================
// StepRejected (the review is rejected with it, D10)
// ============================================================================

export class ReviewStepRejectedEvent extends DomainEvent<
    ReviewEventPayload<ReviewStepRejectedFact>
> {
    eventType = "Workflows/Review/StepRejected" as const;

    getHandlerAbstraction() {
        return ReviewStepRejectedEventHandler;
    }
}

export const ReviewStepRejectedEventHandler = createAbstraction<
    IEventHandler<ReviewStepRejectedEvent>
>("ReviewStepRejectedEventHandler");

export namespace ReviewStepRejectedEventHandler {
    export type Interface = IEventHandler<ReviewStepRejectedEvent>;
    export type Event = ReviewStepRejectedEvent;
}

// ============================================================================
// Cancelled
// ============================================================================

export class ReviewCancelledEvent extends DomainEvent<ReviewEventPayload<ReviewCancelledFact>> {
    eventType = "Workflows/Review/Cancelled" as const;

    getHandlerAbstraction() {
        return ReviewCancelledEventHandler;
    }
}

export const ReviewCancelledEventHandler = createAbstraction<IEventHandler<ReviewCancelledEvent>>(
    "ReviewCancelledEventHandler"
);

export namespace ReviewCancelledEventHandler {
    export type Interface = IEventHandler<ReviewCancelledEvent>;
    export type Event = ReviewCancelledEvent;
}

// ============================================================================
// Approved (the last step was approved)
// ============================================================================

export class ReviewApprovedEvent extends DomainEvent<ReviewEventPayload<ReviewApprovedFact>> {
    eventType = "Workflows/Review/Approved" as const;

    getHandlerAbstraction() {
        return ReviewApprovedEventHandler;
    }
}

export const ReviewApprovedEventHandler = createAbstraction<IEventHandler<ReviewApprovedEvent>>(
    "ReviewApprovedEventHandler"
);

export namespace ReviewApprovedEventHandler {
    export type Interface = IEventHandler<ReviewApprovedEvent>;
    export type Event = ReviewApprovedEvent;
}

export type ReviewEvent =
    | ReviewRequestedEvent
    | ReviewStepReachedEvent
    | ReviewStepStartedEvent
    | ReviewStepTakenOverEvent
    | ReviewStepApprovedEvent
    | ReviewStepRejectedEvent
    | ReviewCancelledEvent
    | ReviewApprovedEvent;
```

- [ ] **Step 7: Add the single save path**

Create `packages/api-workflows/src/features/review/ReviewSaver/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Review } from "~/domain/review/Review.js";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";

export interface IReviewSaver {
    save(review: Review): Promise<Result<ReviewData, ReviewPersistenceError>>;
}

/**
 * The single save path for reviews (R10, D19, D52): prepare the review-level fields, persist
 * (create or update), sync `system.workflow`, then publish one event per recorded fact.
 */
export const ReviewSaver = createAbstraction<IReviewSaver>("ReviewSaver");

export namespace ReviewSaver {
    export type Interface = IReviewSaver;
    export type Return = Promise<Result<ReviewData, ReviewPersistenceError>>;
}
```

Create `packages/api-workflows/src/features/review/ReviewSaver/ReviewSaver.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { Review } from "~/domain/review/Review.js";
import type { ReviewFact } from "~/domain/review/facts.js";
import type { ReviewData } from "~/domain/review/types.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewTargetSync } from "../ReviewTargetSync/abstractions.js";
import {
    ReviewApprovedEvent,
    ReviewCancelledEvent,
    type ReviewEvent,
    ReviewRequestedEvent,
    ReviewStepApprovedEvent,
    ReviewStepReachedEvent,
    ReviewStepRejectedEvent,
    ReviewStepStartedEvent,
    ReviewStepTakenOverEvent
} from "../events.js";
import { ReviewSaver as Abstraction } from "./abstractions.js";

class ReviewSaverImpl implements Abstraction.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private targetSync: ReviewTargetSync.Interface,
        private eventPublisher: EventPublisher.Interface
    ) {}

    async save(review: Review): Abstraction.Return {
        review.prepareForSave();
        const facts = review.pullFacts();

        // No optimistic locking on reviews (D27).
        const result = await this.repository.save(review.toData());
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        const saved = result.value;

        await this.targetSync.sync({
            review: saved,
            systemWorkflow: Review.fromData(saved).getSystemWorkflow()
        });

        for (const fact of facts) {
            await this.eventPublisher.publish(this.createEvent(saved, fact));
        }

        return Result.ok(saved);
    }

    private createEvent(review: ReviewData, fact: ReviewFact): ReviewEvent {
        switch (fact.type) {
            case "requested":
                return new ReviewRequestedEvent({ review, fact });
            case "stepReached":
                return new ReviewStepReachedEvent({ review, fact });
            case "stepStarted":
                return new ReviewStepStartedEvent({ review, fact });
            case "stepTakenOver":
                return new ReviewStepTakenOverEvent({ review, fact });
            case "stepApproved":
                return new ReviewStepApprovedEvent({ review, fact });
            case "stepRejected":
                return new ReviewStepRejectedEvent({ review, fact });
            case "cancelled":
                return new ReviewCancelledEvent({ review, fact });
            case "approved":
                return new ReviewApprovedEvent({ review, fact });
        }
    }
}

export const ReviewSaver = Abstraction.createImplementation({
    implementation: ReviewSaverImpl,
    dependencies: [ReviewRepository, ReviewTargetSync, EventPublisher]
});
```

Create `packages/api-workflows/src/features/review/ReviewLifecycleFeature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { NoopReviewTargetSync } from "./ReviewTargetSync/NoopReviewTargetSync.js";
import { PoolStepAssignmentResolver } from "./StepAssignmentResolver/PoolStepAssignmentResolver.js";
import { ReviewStepReacher } from "./ReviewStepReacher/ReviewStepReacher.js";
import { ReviewSaver } from "./ReviewSaver/ReviewSaver.js";

/**
 * Defaults for the review lifecycle. Later phases register their own `ReviewTargetSync` (2) and
 * `StepAssignmentResolver` (4) after `WorkflowsFeature`; the last registration wins on resolve.
 */
export const ReviewLifecycleFeature = createFeature({
    name: "Workflows/ReviewLifecycle",
    register(container) {
        container.register(NoopReviewTargetSync);
        container.register(PoolStepAssignmentResolver);
        container.register(ReviewStepReacher);
        container.register(ReviewSaver);
    }
});
```

- [ ] **Step 8: Type `system.workflow` on CMS entries**

Replace `packages/api-workflows/src/types.ts` with:

```ts
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ReviewSystemWorkflow } from "~/domain/review/types.js";

export interface IWorkflowsSecurityPermission extends SecurityPermission {
    editor: boolean;
}

declare module "@webiny/api-headless-cms/types/types.js" {
    export interface ICmsEntrySystem {
        /**
         * Review state of this revision (spec 4.5), written only through `ReviewTargetSync`.
         * Filterable via `CmsEntryListWhereSystemWorkflow` (phase 0).
         */
        workflow?: ReviewSystemWorkflow | null;
    }
}
```

- [ ] **Step 9: Register the lifecycle**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the import

```ts
import { ReviewLifecycleFeature } from "~/features/review/ReviewLifecycleFeature.js";
```

and replace the `// Reviews` block with:

```ts
        // Reviews
        ReviewSharedFeature.register(container);
        ReviewLifecycleFeature.register(container);
```

- [ ] **Step 10: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewSaver.test.ts 2>&1 | tail -50`
Expected: PASS (4 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 11: Build dependents**

Run: `yarn build -p @webiny/api-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-headless-cms-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-website-builder-workflows 2>&1 | tail -30`
Expected: all succeed (the `ICmsEntrySystem` augmentation type-checks against `api-headless-cms`).

- [ ] **Step 12: Commit**

Run the Global Constraints chain, then:

```bash
git commit -m "feat(api-workflows): add the single review save path, target and assignment extension points

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 8: Request and get review use cases

**Files:**
- Create: `packages/api-workflows/src/features/review/RequestReview/{abstractions.ts,RequestReviewUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/review/GetReview/{abstractions.ts,GetReviewUseCase.ts,feature.ts,index.ts}`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/FakeReviewTargetLoader.ts`
- Create: `packages/api-workflows/__tests__/__helpers/reviewContext.ts`
- Create: `packages/api-workflows/__tests__/review/RequestReview.test.ts`

**Interfaces:**
- Consumes: `WorkflowRepository` (Task 3), `ReviewRepository` (Task 6), `ReviewTargetLoader`, `ReviewStepReacher`, `ReviewSaver` (Task 7), `Review` (Tasks 4-5), `mdbid` (`@webiny/utils`).
- Produces:
  - `RequestReviewUseCase.execute(input: RequestReviewInput): Promise<Result<ReviewData, RequestReviewUseCase.Error>>` with `RequestReviewInput { model: string; targetId: string; targetRevisionId: string; picks?: ReviewPick[]; actor: Actor }`. Errors: `Workflows/Review/WorkflowNotFound`, `AlreadyActive`, `TargetNotFound`, `Validation`, `InvalidState`, `Persistence`.
  - `GetReviewUseCase.execute(input: { id: string }): Promise<Result<ReviewData, ReviewNotFoundError | ReviewPersistenceError>>`.
  - Test helpers: `FakeReviewTargetLoader`, `MISSING_TARGET_ID`, `createReviewContext(params?)`, `createRequestInput(overrides?)`.

- [ ] **Step 1: Write the test helpers**

Create `packages/api-workflows/__tests__/__helpers/FakeReviewTargetLoader.ts`:

```ts
import { ReviewTargetLoader } from "~/features/review/ReviewTargetLoader/index.js";
import { ARTICLE_MODEL, targetContext } from "./fixtures.js";

/** A target id the fake loader reports as missing. */
export const MISSING_TARGET_ID = "article-missing";

/** Loads "cms.article" targets only; title is "Article <targetId>". */
class FakeReviewTargetLoaderImpl implements ReviewTargetLoader.Interface {
    canLoad(model: string): boolean {
        return model === ARTICLE_MODEL;
    }

    async load(params: ReviewTargetLoader.LoadParams): Promise<ReviewTargetLoader.Target | null> {
        if (params.targetId === MISSING_TARGET_ID) {
            return null;
        }
        const title = `Article ${params.targetId}`;
        return {
            title,
            context: { ...targetContext, title }
        };
    }
}

export const FakeReviewTargetLoader = ReviewTargetLoader.createImplementation({
    implementation: FakeReviewTargetLoaderImpl,
    dependencies: []
});
```

Create `packages/api-workflows/__tests__/__helpers/reviewContext.ts`:

```ts
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import type { RequestReviewInput } from "~/features/review/RequestReview/index.js";
import { createContextHandler } from "./handler.js";
import { FakeReviewTargetLoader } from "./FakeReviewTargetLoader.js";
import { RecordingReviewTargetSync, recordedSyncs } from "./RecordingReviewTargetSync.js";
import { RecordingEventPublisher, recordedEvents } from "./RecordingEventPublisher.js";
import { ARTICLE_MODEL, createWorkflowValues, requester } from "./fixtures.js";

/**
 * Context with the fake target loader, the sync and event recorders, and the "Article review"
 * workflow stored. Recorders are empty when it returns.
 */
export const createReviewContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            container.register(FakeReviewTargetLoader);
            container.registerDecorator(RecordingReviewTargetSync);
            container.registerDecorator(RecordingEventPublisher);
            await params.setup?.(container);
        }
    });

    const stored = await context.container
        .resolve(StoreWorkflowUseCase)
        .execute({ workflow: createWorkflowValues() });
    if (stored.isFail()) {
        throw stored.error;
    }

    recordedSyncs.length = 0;
    recordedEvents.length = 0;

    return {
        context,
        workflow: stored.value
    };
};

export const createRequestInput = (
    overrides: Partial<RequestReviewInput> = {}
): RequestReviewInput => {
    return {
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        picks: [],
        actor: requester,
        ...overrides
    };
};
```

- [ ] **Step 2: Write the failing test**

Create `packages/api-workflows/__tests__/review/RequestReview.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { MISSING_TARGET_ID } from "~tests/__helpers/FakeReviewTargetLoader.js";
import { recordedSyncs } from "~tests/__helpers/RecordingReviewTargetSync.js";
import { workflowEventTypes } from "~tests/__helpers/RecordingEventPublisher.js";
import {
    ARTICLE_MODEL,
    createWorkflowValues,
    otherReviewer,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";

describe("RequestReviewUseCase", () => {
    it("requests a review and reaches the first step through the pool", async () => {
        const { context, workflow } = await createReviewContext();

        const result = await context.container
            .resolve(RequestReviewUseCase)
            .execute(createRequestInput());

        expect(result.isOk()).toBe(true);
        const review = result.value;
        expect(review).toMatchObject({
            workflowId: workflow.id,
            model: ARTICLE_MODEL,
            targetId: "article-1",
            targetRevisionId: "article-1#0001",
            title: "Article article-1",
            isActive: true,
            state: "inProgress",
            currentStepId: "legal",
            currentStepState: "awaiting",
            currentOwnerId: null,
            currentCandidateTeamIds: [REVIEW_TEAM_ID],
            createdBy: requester,
            workflow: { name: workflow.name, models: workflow.models }
        });
        expect(review.targetContext).toEqual({ ...targetContext, title: "Article article-1" });
        expect(review.steps.map(step => step.state)).toEqual(["awaiting", "pending"]);
        expect(review.steps[0].assignment).toEqual({ source: "pool" });
        expect(recordedSyncs.map(sync => sync.systemWorkflow)).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "inProgress",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "awaiting"
            }
        ]);
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/Requested",
            "Workflows/Review/StepReached"
        ]);

        const read = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(read.value).toEqual(review);
    });

    it("stores picks on the review steps; the default resolver leaves the step in the pool", async () => {
        const { context } = await createReviewContext();

        const result = await context.container.resolve(RequestReviewUseCase).execute(
            createRequestInput({ picks: [{ stepId: "legal", userId: otherReviewer.id }] })
        );

        expect(result.isOk()).toBe(true);
        expect(result.value.steps[0]).toMatchObject({
            pickedUserId: otherReviewer.id,
            state: "awaiting",
            owner: null
        });
    });

    it("rejects picks for unknown steps or steps without manual picks", async () => {
        const { context } = await createReviewContext();
        const requestReview = context.container.resolve(RequestReviewUseCase);

        const unknownStep = await requestReview.execute(
            createRequestInput({ picks: [{ stepId: "missing", userId: otherReviewer.id }] })
        );
        const noPicks = await requestReview.execute(
            createRequestInput({ picks: [{ stepId: "editorial", userId: otherReviewer.id }] })
        );

        expect(unknownStep.error.code).toBe("Workflows/Review/Validation");
        expect(noPicks.error.code).toBe("Workflows/Review/Validation");
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("allows one active review per target revision", async () => {
        const { context } = await createReviewContext();
        const requestReview = context.container.resolve(RequestReviewUseCase);
        const first = await requestReview.execute(createRequestInput());

        const second = await requestReview.execute(createRequestInput());

        expect(second.isFail()).toBe(true);
        expect(second.error.code).toBe("Workflows/Review/AlreadyActive");
        expect(second.error.data).toEqual({
            reviewId: first.value.id,
            targetRevisionId: "article-1#0001"
        });

        const otherRevision = await requestReview.execute(
            createRequestInput({ targetRevisionId: "article-1#0002" })
        );
        expect(otherRevision.isOk()).toBe(true);
    });

    it("fails with TargetNotFound when the target is missing or no loader handles the model", async () => {
        const { context } = await createReviewContext();
        const requestReview = context.container.resolve(RequestReviewUseCase);
        await context.container.resolve(StoreWorkflowUseCase).execute({
            workflow: createWorkflowValues({ id: "workflow-pages", models: ["wb.page"] })
        });

        const missing = await requestReview.execute(
            createRequestInput({
                targetId: MISSING_TARGET_ID,
                targetRevisionId: `${MISSING_TARGET_ID}#0001`
            })
        );
        const noLoader = await requestReview.execute(
            createRequestInput({ model: "wb.page", targetId: "page-1", targetRevisionId: "page-1#0001" })
        );

        expect(missing.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(missing.error.data).toEqual({
            model: ARTICLE_MODEL,
            targetRevisionId: `${MISSING_TARGET_ID}#0001`
        });
        expect(noLoader.error.code).toBe("Workflows/Review/TargetNotFound");
    });

    it("fails when no workflow is bound to the model", async () => {
        const { context } = await createReviewContext();

        const result = await context.container
            .resolve(RequestReviewUseCase)
            .execute(createRequestInput({ model: "cms.unbound" }));

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/WorkflowNotFound");
        expect(result.error.data).toEqual({ model: "cms.unbound" });
    });
});

describe("GetReviewUseCase", () => {
    it("returns NotFound for an unknown review", async () => {
        const { context } = await createReviewContext();

        const result = await context.container.resolve(GetReviewUseCase).execute({ id: "missing" });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotFound");
    });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/review/RequestReview.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/review/RequestReview/index.js`.

- [ ] **Step 4: Add `RequestReview`**

Create `packages/api-workflows/src/features/review/RequestReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewData, ReviewPick } from "~/domain/review/types.js";
import type {
    ReviewAlreadyActiveError,
    ReviewInvalidStateError,
    ReviewPersistenceError,
    ReviewTargetNotFoundError,
    ReviewValidationError,
    ReviewWorkflowNotFoundError
} from "~/domain/review/errors.js";

export interface RequestReviewInput {
    /** Namespace id of the target, e.g. "cms.article" (D15). */
    model: string;
    targetId: string;
    targetRevisionId: string;
    /** Reviewer picks per step (D22). Only malformed picks are rejected here (spec 6). */
    picks?: ReviewPick[];
    /** The requester. 1a takes it explicitly; phase 1b checks permissions and identity. */
    actor: Actor;
}

export interface IRequestReviewUseCaseErrors {
    workflowNotFound: ReviewWorkflowNotFoundError;
    alreadyActive: ReviewAlreadyActiveError;
    targetNotFound: ReviewTargetNotFoundError;
    validation: ReviewValidationError;
    invalidState: ReviewInvalidStateError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = IRequestReviewUseCaseErrors[keyof IRequestReviewUseCaseErrors];

export interface IRequestReviewUseCase {
    execute(input: RequestReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Start a review of a target revision with the workflow bound to its model (spec 5.1). */
export const RequestReviewUseCase =
    createAbstraction<IRequestReviewUseCase>("RequestReviewUseCase");

export namespace RequestReviewUseCase {
    export type Interface = IRequestReviewUseCase;
    export type Input = RequestReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/RequestReview/RequestReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { mdbid } from "@webiny/utils";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { Review } from "~/domain/review/Review.js";
import {
    ReviewAlreadyActiveError,
    ReviewPersistenceError,
    ReviewTargetNotFoundError,
    ReviewWorkflowNotFoundError
} from "~/domain/review/errors.js";
import { ReviewTargetLoader } from "../ReviewTargetLoader/abstractions.js";
import { ReviewStepReacher } from "../ReviewStepReacher/abstractions.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { RequestReviewUseCase as UseCase } from "./abstractions.js";

class RequestReviewUseCaseImpl implements UseCase.Interface {
    constructor(
        private workflowRepository: WorkflowRepository.Interface,
        private reviewRepository: ReviewRepository.Interface,
        private targetLoaders: ReviewTargetLoader.Interface[],
        private stepReacher: ReviewStepReacher.Interface,
        private reviewSaver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        // v1 binds at most one workflow to a model (D15).
        const workflows = await this.workflowRepository.list({
            where: { models_in: [input.model] },
            limit: 1
        });
        if (workflows.isFail()) {
            return Result.fail(new ReviewPersistenceError(workflows.error));
        }
        const [workflow] = workflows.value.items;
        if (!workflow) {
            return Result.fail(new ReviewWorkflowNotFoundError({ model: input.model }));
        }

        const active = await this.reviewRepository.getActiveByTarget({
            model: input.model,
            targetRevisionId: input.targetRevisionId
        });
        if (active.isFail()) {
            return Result.fail(active.error);
        }
        if (active.value) {
            return Result.fail(
                new ReviewAlreadyActiveError({
                    reviewId: active.value.id,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }

        const loader = this.targetLoaders.find(item => item.canLoad(input.model));
        const target = loader
            ? await loader.load({
                  model: input.model,
                  targetId: input.targetId,
                  targetRevisionId: input.targetRevisionId
              })
            : null;
        if (!target) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: input.model,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }

        const now = new Date().toISOString();
        const requested = Review.request({
            id: mdbid(),
            workflow,
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            title: target.title,
            targetContext: target.context,
            picks: input.picks ?? [],
            requester: input.actor,
            now
        });
        if (requested.isFail()) {
            return Result.fail(requested.error);
        }
        const review = requested.value;

        const reached = await this.stepReacher.reach({ review, actor: input.actor, now });
        if (reached.isFail()) {
            return Result.fail(reached.error);
        }

        return this.reviewSaver.save(review);
    }
}

export const RequestReviewUseCase = UseCase.createImplementation({
    implementation: RequestReviewUseCaseImpl,
    dependencies: [
        WorkflowRepository,
        ReviewRepository,
        [ReviewTargetLoader, { multiple: true }],
        ReviewStepReacher,
        ReviewSaver
    ]
});
```

Create `packages/api-workflows/src/features/review/RequestReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RequestReviewUseCase } from "./RequestReviewUseCase.js";

export const RequestReviewFeature = createFeature({
    name: "Workflows/RequestReview",
    register(container) {
        container.register(RequestReviewUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/RequestReview/index.ts`:

```ts
export { RequestReviewUseCase } from "./abstractions.js";
export type { RequestReviewInput } from "./abstractions.js";
```

- [ ] **Step 5: Add `GetReview`**

Create `packages/api-workflows/src/features/review/GetReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type { ReviewNotFoundError, ReviewPersistenceError } from "~/domain/review/errors.js";

export interface GetReviewInput {
    id: string;
}

export interface IGetReviewUseCaseErrors {
    notFound: ReviewNotFoundError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = IGetReviewUseCaseErrors[keyof IGetReviewUseCaseErrors];

export interface IGetReviewUseCase {
    execute(input: GetReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Get one review. Viewer flags and read permissions arrive in phase 1b. */
export const GetReviewUseCase = createAbstraction<IGetReviewUseCase>("GetReviewUseCase");

export namespace GetReviewUseCase {
    export type Interface = IGetReviewUseCase;
    export type Input = GetReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/GetReview/GetReviewUseCase.ts`:

```ts
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { GetReviewUseCase as UseCase } from "./abstractions.js";

class GetReviewUseCaseImpl implements UseCase.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        return this.repository.get(input.id);
    }
}

export const GetReviewUseCase = UseCase.createImplementation({
    implementation: GetReviewUseCaseImpl,
    dependencies: [ReviewRepository]
});
```

Create `packages/api-workflows/src/features/review/GetReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetReviewUseCase } from "./GetReviewUseCase.js";

export const GetReviewFeature = createFeature({
    name: "Workflows/GetReview",
    register(container) {
        container.register(GetReviewUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/GetReview/index.ts`:

```ts
export { GetReviewUseCase } from "./abstractions.js";
export type { GetReviewInput } from "./abstractions.js";
```

- [ ] **Step 6: Register the use cases**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the imports

```ts
import { RequestReviewFeature } from "~/features/review/RequestReview/feature.js";
import { GetReviewFeature } from "~/features/review/GetReview/feature.js";
```

and replace the `// Reviews` block with:

```ts
        // Reviews
        ReviewSharedFeature.register(container);
        ReviewLifecycleFeature.register(container);
        RequestReviewFeature.register(container);
        GetReviewFeature.register(container);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/review/RequestReview.test.ts 2>&1 | tail -50`
Expected: PASS (7 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add request and get review use cases

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: Start, take over, approve, reject and cancel use cases

**Files:**
- Create: `packages/api-workflows/src/features/review/shared/types.ts`
- Create: `packages/api-workflows/src/features/review/StartReviewStep/{abstractions.ts,StartReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/review/TakeOverReviewStep/{abstractions.ts,TakeOverReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/review/ApproveReviewStep/{abstractions.ts,ApproveReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/review/RejectReviewStep/{abstractions.ts,RejectReviewStepUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/review/CancelReview/{abstractions.ts,CancelReviewUseCase.ts,feature.ts,index.ts}`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/review/ReviewTransitions.test.ts`

**Interfaces:**
- Consumes: `ReviewRepository` (Task 6), `ReviewStepReacher`, `ReviewSaver` (Task 7), `Review` transitions (Tasks 4-5), test helpers (Task 8).
- Produces:
  - `ReviewActorInput { reviewId: string; actor: Actor; actorTeamIds: string[] }`, `ReviewDecisionInput extends ReviewActorInput { comment?: string | null }`, `CancelReviewInput { reviewId: string; actor: Actor }`.
  - `StartReviewStepUseCase.execute(input: ReviewActorInput)`, `TakeOverReviewStepUseCase.execute(input: ReviewActorInput)`, `ApproveReviewStepUseCase.execute(input: ReviewDecisionInput)`, `RejectReviewStepUseCase.execute(input: ReviewDecisionInput)`, `CancelReviewUseCase.execute(input: CancelReviewInput)`; each returns `Promise<Result<ReviewData, …>>` and persists only through `ReviewSaver`. None reads `IdentityContext` (R6).

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/review/ReviewTransitions.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRequestInput, createReviewContext } from "~tests/__helpers/reviewContext.js";
import { recordedSyncs } from "~tests/__helpers/RecordingReviewTargetSync.js";
import { recordedEvents, workflowEventTypes } from "~tests/__helpers/RecordingEventPublisher.js";
import {
    OTHER_TEAM_ID,
    otherReviewer,
    requester,
    REVIEW_TEAM_ID,
    reviewer
} from "~tests/__helpers/fixtures.js";
import type { Actor } from "~/domain/review/types.js";
import type {
    ReviewStepStartedEvent,
    ReviewStepTakenOverEvent
} from "~/features/review/events.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { TakeOverReviewStepUseCase } from "~/features/review/TakeOverReviewStep/index.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";

const resetRecorders = (): void => {
    recordedSyncs.length = 0;
    recordedEvents.length = 0;
};

const lastSyncedValue = () => {
    return recordedSyncs[recordedSyncs.length - 1]?.systemWorkflow;
};

const setup = async () => {
    const { context, workflow } = await createReviewContext();
    const requestReview = context.container.resolve(RequestReviewUseCase);
    const requested = await requestReview.execute(createRequestInput());
    if (requested.isFail()) {
        throw requested.error;
    }
    resetRecorders();
    const reviewId = requested.value.id;

    return {
        workflow,
        reviewId,
        requestReview,
        start: context.container.resolve(StartReviewStepUseCase),
        takeOver: context.container.resolve(TakeOverReviewStepUseCase),
        approve: context.container.resolve(ApproveReviewStepUseCase),
        reject: context.container.resolve(RejectReviewStepUseCase),
        cancel: context.container.resolve(CancelReviewUseCase),
        actorInput: (actor: Actor = reviewer) => ({ reviewId, actor, actorTeamIds: [REVIEW_TEAM_ID] })
    };
};

describe("Review transitions", () => {
    it("starts the awaiting step and syncs the new step state", async () => {
        const { start, actorInput, workflow } = await setup();

        const result = await start.execute(actorInput());

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            currentStepState: "inReview",
            currentOwnerId: reviewer.id
        });
        expect(result.value.steps[0]).toMatchObject({
            owner: reviewer,
            assignment: { source: "poolStart" }
        });
        expect(recordedSyncs.map(sync => sync.systemWorkflow)).toEqual([
            {
                workflowId: workflow.id,
                reviewState: "inProgress",
                stepId: "legal",
                stepName: "Legal review",
                stepState: "inReview"
            }
        ]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepStarted"]);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepStarted"
        ) as ReviewStepStartedEvent;
        expect(event.payload.fact.actor).toEqual(reviewer);
        expect(event.payload.review).toEqual(result.value);
    });

    it("does not let the requester or a non-member start the step", async () => {
        const { start, actorInput, reviewId } = await setup();

        const byRequester = await start.execute(actorInput(requester));
        const byOutsider = await start.execute({
            reviewId,
            actor: reviewer,
            actorTeamIds: [OTHER_TEAM_ID]
        });

        expect(byRequester.error.code).toBe("Workflows/Review/RequesterCannotReview");
        expect(byOutsider.error.code).toBe("Workflows/Review/NotCandidate");
        expect(recordedSyncs).toEqual([]);
        expect(workflowEventTypes()).toEqual([]);
    });

    it("takes over a step from its owner", async () => {
        const { start, takeOver, actorInput } = await setup();
        await start.execute(actorInput());
        resetRecorders();

        const result = await takeOver.execute(actorInput(otherReviewer));

        expect(result.isOk()).toBe(true);
        expect(result.value.currentOwnerId).toBe(otherReviewer.id);
        expect(result.value.steps[0].assignment).toEqual({
            source: "takeOver",
            by: otherReviewer
        });
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepTakenOver"]);
        const event = recordedEvents.find(
            item => item.eventType === "Workflows/Review/StepTakenOver"
        ) as ReviewStepTakenOverEvent;
        expect(event.payload.fact.previousOwner).toEqual(reviewer);

        const again = await takeOver.execute(actorInput(otherReviewer));
        expect(again.error.code).toBe("Workflows/Review/AlreadyOwner");
    });

    it("approving a step reaches the next one", async () => {
        const { start, approve, actorInput, workflow } = await setup();
        await start.execute(actorInput());
        const notOwner = await approve.execute({ ...actorInput(otherReviewer), comment: "Fine." });
        expect(notOwner.error.code).toBe("Workflows/Review/NotOwner");
        resetRecorders();

        const result = await approve.execute({ ...actorInput(), comment: "Looks good." });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "inProgress",
            currentStepId: "editorial",
            currentStepState: "awaiting",
            currentOwnerId: null
        });
        expect(result.value.steps[0]).toMatchObject({ state: "approved", comment: "Looks good." });
        expect(lastSyncedValue()).toEqual({
            workflowId: workflow.id,
            reviewState: "inProgress",
            stepId: "editorial",
            stepName: "Editorial review",
            stepState: "awaiting"
        });
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/StepReached"
        ]);
    });

    it("approving the last step approves the review", async () => {
        const { start, approve, cancel, actorInput, reviewId, workflow } = await setup();
        await start.execute(actorInput());
        await approve.execute(actorInput());
        await start.execute(actorInput());
        resetRecorders();

        const result = await approve.execute(actorInput());

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "approved",
            isActive: true,
            currentStepId: "editorial",
            currentStepState: "approved",
            currentOwnerId: reviewer.id
        });
        expect(lastSyncedValue()).toEqual({
            workflowId: workflow.id,
            reviewState: "approved",
            stepId: "editorial",
            stepName: "Editorial review",
            stepState: "approved"
        });
        expect(workflowEventTypes()).toEqual([
            "Workflows/Review/StepApproved",
            "Workflows/Review/Approved"
        ]);

        const cancelled = await cancel.execute({ reviewId, actor: requester });
        expect(cancelled.error.code).toBe("Workflows/Review/InvalidState");
    });

    it("rejecting a step rejects the review for good", async () => {
        const { start, reject, approve, cancel, actorInput, reviewId, workflow } = await setup();
        await start.execute(actorInput());
        resetRecorders();

        const result = await reject.execute({ ...actorInput(), comment: "Needs another pass." });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "rejected",
            isActive: true,
            currentStepId: "legal",
            currentStepState: "rejected",
            currentOwnerId: reviewer.id
        });
        expect(lastSyncedValue()).toEqual({
            workflowId: workflow.id,
            reviewState: "rejected",
            stepId: "legal",
            stepName: "Legal review",
            stepState: "rejected"
        });
        expect(workflowEventTypes()).toEqual(["Workflows/Review/StepRejected"]);
        expect((await approve.execute(actorInput())).error.code).toBe("Workflows/Review/InvalidState");
        expect((await cancel.execute({ reviewId, actor: requester })).error.code).toBe(
            "Workflows/Review/InvalidState"
        );
    });

    it("cancelling clears the current step, unlocks the target and allows a new request", async () => {
        const { start, cancel, actorInput, reviewId, requestReview } = await setup();
        await start.execute(actorInput());
        resetRecorders();

        const result = await cancel.execute({ reviewId, actor: requester });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            state: "cancelled",
            isActive: false,
            currentStepId: null,
            currentStepState: null,
            currentOwnerId: null,
            currentCandidateTeamIds: []
        });
        expect(recordedSyncs.map(sync => sync.systemWorkflow)).toEqual([null]);
        expect(workflowEventTypes()).toEqual(["Workflows/Review/Cancelled"]);

        const again = await requestReview.execute(createRequestInput());
        expect(again.isOk()).toBe(true);
        expect(again.value.id).not.toBe(reviewId);
    });

    it("returns NotFound for an unknown review", async () => {
        const { start } = await setup();

        const result = await start.execute({
            reviewId: "missing",
            actor: reviewer,
            actorTeamIds: [REVIEW_TEAM_ID]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Review/NotFound");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/review/StartReviewStep/index.js`.

- [ ] **Step 3: Add the shared input types**

Create `packages/api-workflows/src/features/review/shared/types.ts`:

```ts
import type { Actor } from "~/domain/review/types.js";

/** Input of human step transitions. 1a takes the actor explicitly; 1b adds permission checks. */
export interface ReviewActorInput {
    reviewId: string;
    actor: Actor;
    /** The actor's teams, checked against the step's `candidateTeamIds`. */
    actorTeamIds: string[];
}

export interface ReviewDecisionInput extends ReviewActorInput {
    comment?: string | null;
}
```

- [ ] **Step 4: Add `StartReviewStep`**

Create `packages/api-workflows/src/features/review/StartReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewInvalidStateError,
    ReviewNotCandidateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewRequesterCannotReviewError
} from "~/domain/review/errors.js";
import type { ReviewActorInput } from "../shared/types.js";

export interface IStartReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    requesterCannotReview: ReviewRequesterCannotReviewError;
    notCandidate: ReviewNotCandidateError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = IStartReviewStepUseCaseErrors[keyof IStartReviewStepUseCaseErrors];

export interface IStartReviewStepUseCase {
    execute(input: ReviewActorInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** A candidate takes an awaiting step from the pool (spec 5.1 "start"). */
export const StartReviewStepUseCase =
    createAbstraction<IStartReviewStepUseCase>("StartReviewStepUseCase");

export namespace StartReviewStepUseCase {
    export type Interface = IStartReviewStepUseCase;
    export type Input = ReviewActorInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/StartReviewStep/StartReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { StartReviewStepUseCase as UseCase } from "./abstractions.js";

class StartReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);

        const started = review.start({
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            now: new Date().toISOString()
        });
        if (started.isFail()) {
            return Result.fail(started.error);
        }

        return this.saver.save(review);
    }
}

export const StartReviewStepUseCase = UseCase.createImplementation({
    implementation: StartReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/StartReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { StartReviewStepUseCase } from "./StartReviewStepUseCase.js";

export const StartReviewStepFeature = createFeature({
    name: "Workflows/StartReviewStep",
    register(container) {
        container.register(StartReviewStepUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/StartReviewStep/index.ts`:

```ts
export { StartReviewStepUseCase } from "./abstractions.js";
export type { ReviewActorInput } from "../shared/types.js";
```

- [ ] **Step 5: Add `TakeOverReviewStep`**

Create `packages/api-workflows/src/features/review/TakeOverReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewAlreadyOwnerError,
    ReviewInvalidStateError,
    ReviewNotCandidateError,
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewRequesterCannotReviewError,
    ReviewStepNotTakeableError
} from "~/domain/review/errors.js";
import type { ReviewActorInput } from "../shared/types.js";

export interface ITakeOverReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    requesterCannotReview: ReviewRequesterCannotReviewError;
    notCandidate: ReviewNotCandidateError;
    alreadyOwner: ReviewAlreadyOwnerError;
    stepNotTakeable: ReviewStepNotTakeableError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = ITakeOverReviewStepUseCaseErrors[keyof ITakeOverReviewStepUseCaseErrors];

export interface ITakeOverReviewStepUseCase {
    execute(input: ReviewActorInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Another candidate takes a human step in review (spec 5.1 "take over", D32, D9). */
export const TakeOverReviewStepUseCase = createAbstraction<ITakeOverReviewStepUseCase>(
    "TakeOverReviewStepUseCase"
);

export namespace TakeOverReviewStepUseCase {
    export type Interface = ITakeOverReviewStepUseCase;
    export type Input = ReviewActorInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/TakeOverReviewStep/TakeOverReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { TakeOverReviewStepUseCase as UseCase } from "./abstractions.js";

class TakeOverReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);

        const takenOver = review.takeOver({
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            now: new Date().toISOString()
        });
        if (takenOver.isFail()) {
            return Result.fail(takenOver.error);
        }

        return this.saver.save(review);
    }
}

export const TakeOverReviewStepUseCase = UseCase.createImplementation({
    implementation: TakeOverReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/TakeOverReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { TakeOverReviewStepUseCase } from "./TakeOverReviewStepUseCase.js";

export const TakeOverReviewStepFeature = createFeature({
    name: "Workflows/TakeOverReviewStep",
    register(container) {
        container.register(TakeOverReviewStepUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/TakeOverReviewStep/index.ts`:

```ts
export { TakeOverReviewStepUseCase } from "./abstractions.js";
export type { ReviewActorInput } from "../shared/types.js";
```

- [ ] **Step 6: Add `ApproveReviewStep`**

Create `packages/api-workflows/src/features/review/ApproveReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewNotOwnerError,
    ReviewPersistenceError
} from "~/domain/review/errors.js";
import type { ReviewDecisionInput } from "../shared/types.js";

export interface IApproveReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    notOwner: ReviewNotOwnerError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = IApproveReviewStepUseCaseErrors[keyof IApproveReviewStepUseCaseErrors];

export interface IApproveReviewStepUseCase {
    execute(input: ReviewDecisionInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** The owner approves the current step; the next step is reached, or the review is approved. */
export const ApproveReviewStepUseCase =
    createAbstraction<IApproveReviewStepUseCase>("ApproveReviewStepUseCase");

export namespace ApproveReviewStepUseCase {
    export type Interface = IApproveReviewStepUseCase;
    export type Input = ReviewDecisionInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/ApproveReviewStep/ApproveReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewStepReacher } from "../ReviewStepReacher/abstractions.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { ApproveReviewStepUseCase as UseCase } from "./abstractions.js";

class ApproveReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private stepReacher: ReviewStepReacher.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);
        const now = new Date().toISOString();

        const approved = review.approve({
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            comment: input.comment ?? null,
            now
        });
        if (approved.isFail()) {
            return Result.fail(approved.error);
        }

        // The next step goes through the same step-reached path as step 1 (D6).
        const reached = await this.stepReacher.reach({ review, actor: input.actor, now });
        if (reached.isFail()) {
            return Result.fail(reached.error);
        }

        return this.saver.save(review);
    }
}

export const ApproveReviewStepUseCase = UseCase.createImplementation({
    implementation: ApproveReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewStepReacher, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/ApproveReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ApproveReviewStepUseCase } from "./ApproveReviewStepUseCase.js";

export const ApproveReviewStepFeature = createFeature({
    name: "Workflows/ApproveReviewStep",
    register(container) {
        container.register(ApproveReviewStepUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/ApproveReviewStep/index.ts`:

```ts
export { ApproveReviewStepUseCase } from "./abstractions.js";
export type { ReviewDecisionInput } from "../shared/types.js";
```

- [ ] **Step 7: Add `RejectReviewStep`**

Create `packages/api-workflows/src/features/review/RejectReviewStep/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "~/domain/review/types.js";
import type {
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewNotOwnerError,
    ReviewPersistenceError
} from "~/domain/review/errors.js";
import type { ReviewDecisionInput } from "../shared/types.js";

export interface IRejectReviewStepUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    notOwner: ReviewNotOwnerError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = IRejectReviewStepUseCaseErrors[keyof IRejectReviewStepUseCaseErrors];

export interface IRejectReviewStepUseCase {
    execute(input: ReviewDecisionInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** The owner rejects the current step; the review is rejected for this revision (D10). */
export const RejectReviewStepUseCase =
    createAbstraction<IRejectReviewStepUseCase>("RejectReviewStepUseCase");

export namespace RejectReviewStepUseCase {
    export type Interface = IRejectReviewStepUseCase;
    export type Input = ReviewDecisionInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/RejectReviewStep/RejectReviewStepUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { RejectReviewStepUseCase as UseCase } from "./abstractions.js";

class RejectReviewStepUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);

        const rejected = review.reject({
            actor: input.actor,
            actorTeamIds: input.actorTeamIds,
            comment: input.comment ?? null,
            now: new Date().toISOString()
        });
        if (rejected.isFail()) {
            return Result.fail(rejected.error);
        }

        return this.saver.save(review);
    }
}

export const RejectReviewStepUseCase = UseCase.createImplementation({
    implementation: RejectReviewStepUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/RejectReviewStep/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { RejectReviewStepUseCase } from "./RejectReviewStepUseCase.js";

export const RejectReviewStepFeature = createFeature({
    name: "Workflows/RejectReviewStep",
    register(container) {
        container.register(RejectReviewStepUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/RejectReviewStep/index.ts`:

```ts
export { RejectReviewStepUseCase } from "./abstractions.js";
export type { ReviewDecisionInput } from "../shared/types.js";
```

- [ ] **Step 8: Add `CancelReview`**

Create `packages/api-workflows/src/features/review/CancelReview/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Actor, ReviewData } from "~/domain/review/types.js";
import type {
    ReviewInvalidStateError,
    ReviewNotFoundError,
    ReviewPersistenceError
} from "~/domain/review/errors.js";

export interface CancelReviewInput {
    reviewId: string;
    /** Requester or a user with `workflows.reassign`; checked in phase 1b. */
    actor: Actor;
}

export interface ICancelReviewUseCaseErrors {
    notFound: ReviewNotFoundError;
    invalidState: ReviewInvalidStateError;
    persistence: ReviewPersistenceError;
}

type UseCaseError = ICancelReviewUseCaseErrors[keyof ICancelReviewUseCaseErrors];

export interface ICancelReviewUseCase {
    execute(input: CancelReviewInput): Promise<Result<ReviewData, UseCaseError>>;
}

/** Cancel an in-progress review; the target is unlocked (D25, D75). */
export const CancelReviewUseCase = createAbstraction<ICancelReviewUseCase>("CancelReviewUseCase");

export namespace CancelReviewUseCase {
    export type Interface = ICancelReviewUseCase;
    export type Input = CancelReviewInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/review/CancelReview/CancelReviewUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "../ReviewSaver/abstractions.js";
import { CancelReviewUseCase as UseCase } from "./abstractions.js";

class CancelReviewUseCaseImpl implements UseCase.Interface {
    constructor(
        private repository: ReviewRepository.Interface,
        private saver: ReviewSaver.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const loaded = await this.repository.get(input.reviewId);
        if (loaded.isFail()) {
            return Result.fail(loaded.error);
        }
        const review = Review.fromData(loaded.value);

        const cancelled = review.cancel({ actor: input.actor, now: new Date().toISOString() });
        if (cancelled.isFail()) {
            return Result.fail(cancelled.error);
        }

        return this.saver.save(review);
    }
}

export const CancelReviewUseCase = UseCase.createImplementation({
    implementation: CancelReviewUseCaseImpl,
    dependencies: [ReviewRepository, ReviewSaver]
});
```

Create `packages/api-workflows/src/features/review/CancelReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CancelReviewUseCase } from "./CancelReviewUseCase.js";

export const CancelReviewFeature = createFeature({
    name: "Workflows/CancelReview",
    register(container) {
        container.register(CancelReviewUseCase);
    }
});
```

Create `packages/api-workflows/src/features/review/CancelReview/index.ts`:

```ts
export { CancelReviewUseCase } from "./abstractions.js";
export type { CancelReviewInput } from "./abstractions.js";
```

- [ ] **Step 9: Register the use cases**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the imports

```ts
import { StartReviewStepFeature } from "~/features/review/StartReviewStep/feature.js";
import { TakeOverReviewStepFeature } from "~/features/review/TakeOverReviewStep/feature.js";
import { ApproveReviewStepFeature } from "~/features/review/ApproveReviewStep/feature.js";
import { RejectReviewStepFeature } from "~/features/review/RejectReviewStep/feature.js";
import { CancelReviewFeature } from "~/features/review/CancelReview/feature.js";
```

and replace the `// Reviews` block with:

```ts
        // Reviews
        ReviewSharedFeature.register(container);
        ReviewLifecycleFeature.register(container);
        RequestReviewFeature.register(container);
        GetReviewFeature.register(container);
        StartReviewStepFeature.register(container);
        TakeOverReviewStepFeature.register(container);
        ApproveReviewStepFeature.register(container);
        RejectReviewStepFeature.register(container);
        CancelReviewFeature.register(container);
```

- [ ] **Step 10: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/review/ReviewTransitions.test.ts 2>&1 | tail -50`
Expected: PASS (8 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 11: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add start, take over, approve, reject and cancel review use cases

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 10: Assignment log model and repository

**Files:**
- Modify: `packages/api-workflows/src/constants.ts`
- Create: `packages/api-workflows/src/domain/assignment/types.ts`
- Create: `packages/api-workflows/src/domain/assignment/errors.ts`
- Create: `packages/api-workflows/src/domain/assignment/assignment.model.ts`
- Create: `packages/api-workflows/src/domain/assignment/abstractions/AssignmentModelProvider.ts`
- Create: `packages/api-workflows/src/domain/assignment/abstractions/AssignmentRepository.ts`
- Create: `packages/api-workflows/src/features/assignment/shared/AssignmentEntryMapper.ts`
- Create: `packages/api-workflows/src/features/assignment/shared/AssignmentModelProvider.ts`
- Create: `packages/api-workflows/src/features/assignment/shared/AssignmentRepository.ts`
- Create: `packages/api-workflows/src/features/assignment/shared/feature.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts`

**Interfaces:**
- Consumes: `Actor` (Task 4), `toIsoString` (Task 6), CMS `CreateEntryUseCase`, `ListLatestEntriesUseCase`, `GetModelUseCase`, `ModelFactory`.
- Produces:
  - `ASSIGNMENT_MODEL_ID = "wbyWorkflowAssignment"`; `AssignmentModel`.
  - `AssignmentRecordValues { reviewId; workflowId; stepId; userId: string | null; assignedOn: string; source: string; by: Actor | null; reason: string | null }`, `AssignmentRecord extends AssignmentRecordValues { id: string }`.
  - `AssignmentRepository.Interface { create(values: AssignmentRecordValues): Promise<Result<AssignmentRecord, AssignmentPersistenceError>>; list(params: { where: { reviewId?; workflowId?; stepId? }; limit?: number }): Promise<Result<AssignmentRecord[], AssignmentPersistenceError>> }` (newest `assignedOn` first).
  - `AssignmentPersistenceError` (`Workflows/Assignment/Persistence`).
  - Nothing outside this task's test writes records in 1a (R3); phase 4 does.

- [ ] **Step 1: Write the failing test**

Create `packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { otherReviewer, reviewer } from "~tests/__helpers/fixtures.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";

const createRepository = async () => {
    const { context } = await createContextHandler();
    return context.container.resolve(AssignmentRepository);
};

describe("AssignmentRepository", () => {
    it("records assignment decisions and lists them newest first", async () => {
        const repository = await createRepository();

        const pool = await repository.create({
            reviewId: "review-1",
            workflowId: "workflow-1",
            stepId: "legal",
            userId: null,
            assignedOn: "2026-10-09T10:00:00.000Z",
            source: "pool",
            by: null,
            reason: "No eligible candidates."
        });
        await repository.create({
            reviewId: "review-1",
            workflowId: "workflow-1",
            stepId: "legal",
            userId: otherReviewer.id,
            assignedOn: "2026-10-09T11:00:00.000Z",
            source: "takeOver",
            by: otherReviewer,
            reason: null
        });
        await repository.create({
            reviewId: "review-2",
            workflowId: "workflow-1",
            stepId: "editorial",
            userId: reviewer.id,
            assignedOn: "2026-10-09T12:00:00.000Z",
            source: "picked",
            by: null,
            reason: null
        });

        expect(pool.isOk()).toBe(true);
        expect(pool.value).toEqual({
            id: expect.any(String),
            reviewId: "review-1",
            workflowId: "workflow-1",
            stepId: "legal",
            userId: null,
            assignedOn: "2026-10-09T10:00:00.000Z",
            source: "pool",
            by: null,
            reason: "No eligible candidates."
        });

        const byReview = await repository.list({ where: { reviewId: "review-1" } });
        expect(byReview.isOk()).toBe(true);
        expect(byReview.value.map(record => record.source)).toEqual(["takeOver", "pool"]);
        expect(byReview.value[0].by).toEqual(otherReviewer);

        const byStep = await repository.list({
            where: { workflowId: "workflow-1", stepId: "editorial" }
        });
        expect(byStep.value.map(record => record.userId)).toEqual([reviewer.id]);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/assignment/abstractions/AssignmentRepository.js`.

- [ ] **Step 3: Add the assignment domain**

Replace `packages/api-workflows/src/constants.ts` with:

```ts
export const WORKFLOW_MODEL_ID = "wbyWorkflow";
export const REVIEW_MODEL_ID = "wbyWorkflowReview";
export const ASSIGNMENT_MODEL_ID = "wbyWorkflowAssignment";
export const WORKFLOWS_PERMISSION = "workflows";
```

Create `packages/api-workflows/src/domain/assignment/types.ts`:

```ts
import type { Actor } from "~/domain/review/types.js";

/** One assignment decision (spec 4.3, D20, D45, D127). Written from phase 4. */
export interface AssignmentRecordValues {
    reviewId: string;
    workflowId: string;
    stepId: string;
    /** `null` for a pool fall-through. */
    userId: string | null;
    assignedOn: string;
    /** Rule id, "strategy", "picked", "reassign", "pool", "poolStart" or "takeOver". */
    source: string;
    /** Who acted, for reassign and take over. */
    by: Actor | null;
    /** For skips and fall-through, e.g. "pick excluded". */
    reason: string | null;
}

export interface AssignmentRecord extends AssignmentRecordValues {
    id: string;
}
```

Create `packages/api-workflows/src/domain/assignment/errors.ts`:

```ts
import { BaseError } from "@webiny/feature/api";

export class AssignmentPersistenceError extends BaseError {
    override readonly code = "Workflows/Assignment/Persistence" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}
```

Create `packages/api-workflows/src/domain/assignment/assignment.model.ts`:

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { ASSIGNMENT_MODEL_ID } from "~/constants.js";

/** Private model for the assignment log (spec 4.3). Deleted with its review (phase 2). */
class AssignmentModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: ASSIGNMENT_MODEL_ID,
                    name: "Workflow Assignment"
                })
                .fields(fields => ({
                    reviewId: fields.text().label("Review ID"),
                    workflowId: fields.text().label("Workflow ID"),
                    stepId: fields.text().label("Step ID"),
                    userId: fields.text().label("User ID"),
                    assignedOn: fields.datetime().label("Assigned on").withoutTimezone(),
                    source: fields.text().label("Source"),
                    by: fields
                        .object()
                        .label("By")
                        .fields(byFields => ({
                            type: byFields.text().label("Type"),
                            id: byFields.text().label("ID"),
                            displayName: byFields.text().label("Display name"),
                            identityType: byFields.text().label("Identity type")
                        })),
                    reason: fields.longText().label("Reason")
                }))
        ];
    }
}

export const AssignmentModel = ModelFactory.createImplementation({
    implementation: AssignmentModelImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/domain/assignment/abstractions/AssignmentModelProvider.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IAssignmentModelProvider {
    get(): Promise<CmsModel>;
}

/** Provides the tenant's `wbyWorkflowAssignment` model on demand. */
export const AssignmentModelProvider =
    createAbstraction<IAssignmentModelProvider>("AssignmentModelProvider");

export namespace AssignmentModelProvider {
    export type Interface = IAssignmentModelProvider;
}
```

Create `packages/api-workflows/src/domain/assignment/abstractions/AssignmentRepository.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { AssignmentRecord, AssignmentRecordValues } from "../types.js";
import type { AssignmentPersistenceError } from "../errors.js";

export interface AssignmentRepositoryListWhere {
    reviewId?: string;
    workflowId?: string;
    stepId?: string;
}

export interface AssignmentRepositoryListParams {
    where: AssignmentRepositoryListWhere;
    limit?: number;
}

export interface IAssignmentRepository {
    create(
        values: AssignmentRecordValues
    ): Promise<Result<AssignmentRecord, AssignmentPersistenceError>>;
    /** Newest `assignedOn` first. */
    list(
        params: AssignmentRepositoryListParams
    ): Promise<Result<AssignmentRecord[], AssignmentPersistenceError>>;
}

/** The assignment log (`wbyWorkflowAssignment`). */
export const AssignmentRepository =
    createAbstraction<IAssignmentRepository>("AssignmentRepository");

export namespace AssignmentRepository {
    export type Interface = IAssignmentRepository;
    export type ListParams = AssignmentRepositoryListParams;
    export type ListWhere = AssignmentRepositoryListWhere;
}
```

- [ ] **Step 4: Add the mapper, provider, repository and feature**

Create `packages/api-workflows/src/features/assignment/shared/AssignmentEntryMapper.ts`:

```ts
import { parseIdentifier } from "@webiny/utils";
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { Actor, ActorType } from "~/domain/review/types.js";
import type { AssignmentRecord, AssignmentRecordValues } from "~/domain/assignment/types.js";
import { toIsoString } from "~/features/shared/toIsoString.js";

export interface AssignmentEntryActor {
    type: string;
    id: string;
    displayName: string;
    identityType: string | null;
}

export interface AssignmentEntryValues {
    reviewId: string;
    workflowId: string;
    stepId: string;
    userId: string | null;
    assignedOn: string | Date | null;
    source: string;
    by: AssignmentEntryActor | null;
    reason: string | null;
}

const toEntryActor = (actor: Actor | null): AssignmentEntryActor | null => {
    if (!actor) {
        return null;
    }
    return {
        type: actor.type,
        id: actor.id,
        displayName: actor.displayName,
        identityType: actor.identityType ?? null
    };
};

const fromEntryActor = (value: AssignmentEntryActor | null | undefined): Actor | null => {
    if (!value?.id) {
        return null;
    }
    return {
        type: value.type as ActorType,
        id: value.id,
        displayName: value.displayName ?? "",
        ...(value.identityType ? { identityType: value.identityType } : {})
    };
};

export class AssignmentEntryMapper {
    public static toValues(values: AssignmentRecordValues): AssignmentEntryValues {
        return {
            reviewId: values.reviewId,
            workflowId: values.workflowId,
            stepId: values.stepId,
            userId: values.userId,
            assignedOn: values.assignedOn,
            source: values.source,
            by: toEntryActor(values.by),
            reason: values.reason
        };
    }

    public static fromEntry(entry: CmsEntry<AssignmentEntryValues>): AssignmentRecord {
        const { id } = parseIdentifier(entry.id);
        return {
            id,
            reviewId: entry.values.reviewId,
            workflowId: entry.values.workflowId,
            stepId: entry.values.stepId,
            userId: entry.values.userId ?? null,
            assignedOn: toIsoString(entry.values.assignedOn) ?? entry.createdOn,
            source: entry.values.source,
            by: fromEntryActor(entry.values.by),
            reason: entry.values.reason ?? null
        };
    }
}
```

Create `packages/api-workflows/src/features/assignment/shared/AssignmentModelProvider.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { AssignmentModelProvider as Abstraction } from "~/domain/assignment/abstractions/AssignmentModelProvider.js";
import { ASSIGNMENT_MODEL_ID } from "~/constants.js";

/** Same contract as `WorkflowModelProvider`: no memoization, no `withoutAuthorization`. */
class AssignmentModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(ASSIGNMENT_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const AssignmentModelProvider = Abstraction.createImplementation({
    implementation: AssignmentModelProviderImpl,
    dependencies: [GetModelUseCase]
});
```

Create `packages/api-workflows/src/features/assignment/shared/AssignmentRepository.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { AssignmentModelProvider } from "~/domain/assignment/abstractions/AssignmentModelProvider.js";
import { AssignmentRepository as Abstraction } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { AssignmentPersistenceError } from "~/domain/assignment/errors.js";
import type { AssignmentRecord, AssignmentRecordValues } from "~/domain/assignment/types.js";
import { AssignmentEntryMapper, type AssignmentEntryValues } from "./AssignmentEntryMapper.js";

type WhereValues = Record<string, string>;

class AssignmentRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: AssignmentModelProvider.Interface,
        private listLatestEntries: ListLatestEntriesUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface
    ) {}

    async create(
        values: AssignmentRecordValues
    ): Promise<Result<AssignmentRecord, AssignmentPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.createEntry.execute<AssignmentEntryValues>(model, {
            values: AssignmentEntryMapper.toValues(values)
        });
        if (result.isFail()) {
            return Result.fail(new AssignmentPersistenceError(result.error));
        }
        return Result.ok(AssignmentEntryMapper.fromEntry(result.value));
    }

    async list(
        params: Abstraction.ListParams
    ): Promise<Result<AssignmentRecord[], AssignmentPersistenceError>> {
        const model = await this.modelProvider.get();
        const values: WhereValues = {};
        if (params.where.reviewId) {
            values.reviewId = params.where.reviewId;
        }
        if (params.where.workflowId) {
            values.workflowId = params.where.workflowId;
        }
        if (params.where.stepId) {
            values.stepId = params.where.stepId;
        }

        const result = await this.listLatestEntries.execute<AssignmentEntryValues>(model, {
            where: { values },
            sort: ["createdOn_DESC"],
            limit: params.limit ?? 100
        });
        if (result.isFail()) {
            return Result.fail(new AssignmentPersistenceError(result.error));
        }

        const records = result.value.entries.map(entry => AssignmentEntryMapper.fromEntry(entry));
        records.sort((a, b) => b.assignedOn.localeCompare(a.assignedOn));
        return Result.ok(records);
    }
}

export const AssignmentRepository = Abstraction.createImplementation({
    implementation: AssignmentRepositoryImpl,
    dependencies: [AssignmentModelProvider, ListLatestEntriesUseCase, CreateEntryUseCase]
});
```

Create `packages/api-workflows/src/features/assignment/shared/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { AssignmentModelProvider } from "./AssignmentModelProvider.js";
import { AssignmentRepository } from "./AssignmentRepository.js";

export const AssignmentSharedFeature = createFeature({
    name: "Workflows/AssignmentShared",
    register(container) {
        container.register(AssignmentModelProvider);
        container.register(AssignmentRepository).inSingletonScope();
    }
});
```

- [ ] **Step 5: Register the model and repository**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add the imports

```ts
import { AssignmentModel } from "~/domain/assignment/assignment.model.js";
import { AssignmentSharedFeature } from "~/features/assignment/shared/feature.js";
```

add `container.register(AssignmentModel);` after `container.register(ReviewModel);`, and append after the `// Reviews` block:

```ts

        // Assignment log (written from phase 4)
        AssignmentSharedFeature.register(container);
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/assignment/AssignmentRepository.test.ts 2>&1 | tail -50`
Expected: PASS (1 test).
Run: `yarn test packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`), then:

```bash
git commit -m "feat(api-workflows): add the assignment log model and repository

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Workflow settings model and use cases

**Files:**
- Modify: `packages/api-workflows/src/constants.ts`
- Create: `packages/api-workflows/src/domain/settings/types.ts`
- Create: `packages/api-workflows/src/domain/settings/errors.ts`
- Create: `packages/api-workflows/src/domain/settings/settings.model.ts`
- Create: `packages/api-workflows/src/domain/settings/WorkflowSettingsValidator.ts`
- Create: `packages/api-workflows/src/domain/settings/filterActiveExclusions.ts`
- Create: `packages/api-workflows/src/domain/settings/abstractions/WorkflowSettingsModelProvider.ts`
- Create: `packages/api-workflows/src/domain/settings/abstractions/WorkflowSettingsRepository.ts`
- Create: `packages/api-workflows/src/features/settings/shared/WorkflowSettingsEntryMapper.ts`
- Create: `packages/api-workflows/src/features/settings/shared/WorkflowSettingsModelProvider.ts`
- Create: `packages/api-workflows/src/features/settings/shared/WorkflowSettingsRepository.ts`
- Create: `packages/api-workflows/src/features/settings/shared/feature.ts`
- Create: `packages/api-workflows/src/features/settings/GetWorkflowSettings/{abstractions.ts,GetWorkflowSettingsUseCase.ts,feature.ts,index.ts}`
- Create: `packages/api-workflows/src/features/settings/SaveWorkflowSettings/{abstractions.ts,SaveWorkflowSettingsUseCase.ts,feature.ts,index.ts}`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/domain/WorkflowSettingsValidator.test.ts`
- Create: `packages/api-workflows/__tests__/settings/WorkflowSettings.test.ts`

**Interfaces:**
- Consumes: `toIsoString` (Task 6), CMS entry use cases, `GetModelUseCase`, `ModelFactory`, `createIdentifier` (`@webiny/utils`).
- Produces:
  - `WORKFLOW_SETTINGS_MODEL_ID = "wbyWorkflowSettings"`, `WORKFLOW_SETTINGS_ENTRY_ID = "settings"` (one entry per tenant; CMS entries are tenant-scoped).
  - `WorkflowExclusion { userId: string; reason?: string; endsOn?: string }`, `WorkflowSettings { exclusions: WorkflowExclusion[] }`.
  - `WorkflowSettingsValidator.validate(settings: WorkflowSettings): Result<WorkflowSettings, WorkflowSettingsValidationError>`; `filterActiveExclusions(exclusions: WorkflowExclusion[], now: Date): WorkflowExclusion[]`.
  - `WorkflowSettingsValidationError` (`Workflows/Settings/Validation`, data `{ userId }`), `WorkflowSettingsPersistenceError` (`Workflows/Settings/Persistence`).
  - `GetWorkflowSettingsUseCase.execute(input?: { includeExpired?: boolean })`, `SaveWorkflowSettingsUseCase.execute(input: WorkflowSettings)`; both return `Promise<Result<WorkflowSettings, …>>`. No `editor` check in 1a (phase 1b).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/domain/WorkflowSettingsValidator.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { WorkflowSettingsValidator } from "~/domain/settings/WorkflowSettingsValidator.js";
import { filterActiveExclusions } from "~/domain/settings/filterActiveExclusions.js";

describe("WorkflowSettingsValidator", () => {
    it("normalizes end dates to UTC and drops empty optionals", () => {
        const result = WorkflowSettingsValidator.validate({
            exclusions: [
                { userId: "user-a", reason: "On leave", endsOn: "2026-10-09T23:59:59+02:00" },
                { userId: "user-b", reason: "" }
            ]
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            exclusions: [
                { userId: "user-a", reason: "On leave", endsOn: "2026-10-09T21:59:59.000Z" },
                { userId: "user-b" }
            ]
        });
    });

    it("rejects a second entry for the same user", () => {
        const result = WorkflowSettingsValidator.validate({
            exclusions: [{ userId: "user-a" }, { userId: "user-a", reason: "Again" }]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Settings/Validation");
        expect(result.error.message).toBe("This user is already in the list. Edit it instead.");
        expect(result.error.data).toEqual({ userId: "user-a" });
    });

    it("rejects an entry without a user or with an invalid end date", () => {
        const noUser = WorkflowSettingsValidator.validate({ exclusions: [{ userId: " " }] });
        const badDate = WorkflowSettingsValidator.validate({
            exclusions: [{ userId: "user-a", endsOn: "next week" }]
        });

        expect(noUser.error.message).toBe("Every exclusion needs a user.");
        expect(badDate.error.message).toBe('The end date "next week" is not a valid date.');
    });
});

describe("filterActiveExclusions", () => {
    it("keeps entries without an end date and entries that end later", () => {
        const now = new Date("2026-10-09T10:00:00.000Z");

        const active = filterActiveExclusions(
            [
                { userId: "user-a" },
                { userId: "user-b", endsOn: "2026-10-09T09:59:59.000Z" },
                { userId: "user-c", endsOn: "2026-10-09T10:00:00.001Z" }
            ],
            now
        );

        expect(active.map(exclusion => exclusion.userId)).toEqual(["user-a", "user-c"]);
    });
});
```

Create `packages/api-workflows/__tests__/settings/WorkflowSettings.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";

const FUTURE = "2999-01-01T00:00:00.000Z";
const PAST = "2000-01-01T00:00:00.000Z";

const createUseCases = async () => {
    const { context } = await createContextHandler();
    return {
        getSettings: context.container.resolve(GetWorkflowSettingsUseCase),
        saveSettings: context.container.resolve(SaveWorkflowSettingsUseCase)
    };
};

describe("Workflow settings use cases", () => {
    it("returns no exclusions before anything is saved", async () => {
        const { getSettings } = await createUseCases();

        const result = await getSettings.execute();

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({ exclusions: [] });
    });

    it("saves exclusions and hides expired ones unless asked", async () => {
        const { getSettings, saveSettings } = await createUseCases();

        const saved = await saveSettings.execute({
            exclusions: [
                { userId: "user-a", reason: "On leave", endsOn: FUTURE },
                { userId: "user-b", endsOn: PAST },
                { userId: "user-c" }
            ]
        });
        expect(saved.isOk()).toBe(true);

        const active = await getSettings.execute();
        expect(active.value.exclusions).toEqual([
            { userId: "user-a", reason: "On leave", endsOn: FUTURE },
            { userId: "user-c" }
        ]);

        const all = await getSettings.execute({ includeExpired: true });
        expect(all.value.exclusions.map(exclusion => exclusion.userId)).toEqual([
            "user-a",
            "user-b",
            "user-c"
        ]);
    });

    it("rejects a second entry for the same user", async () => {
        const { saveSettings, getSettings } = await createUseCases();

        const result = await saveSettings.execute({
            exclusions: [{ userId: "user-a" }, { userId: "user-a", endsOn: FUTURE }]
        });

        expect(result.isFail()).toBe(true);
        expect(result.error.code).toBe("Workflows/Settings/Validation");
        expect((await getSettings.execute()).value).toEqual({ exclusions: [] });
    });

    it("lets the last save win", async () => {
        const { getSettings, saveSettings } = await createUseCases();
        await saveSettings.execute({ exclusions: [{ userId: "user-a" }] });

        await saveSettings.execute({ exclusions: [{ userId: "user-b", reason: "Training" }] });

        const result = await getSettings.execute({ includeExpired: true });
        expect(result.value).toEqual({ exclusions: [{ userId: "user-b", reason: "Training" }] });
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/domain/WorkflowSettingsValidator.test.ts packages/api-workflows/__tests__/settings/WorkflowSettings.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/domain/settings/WorkflowSettingsValidator.js`.

- [ ] **Step 3: Add the settings domain**

Replace `packages/api-workflows/src/constants.ts` with:

```ts
export const WORKFLOW_MODEL_ID = "wbyWorkflow";
export const REVIEW_MODEL_ID = "wbyWorkflowReview";
export const ASSIGNMENT_MODEL_ID = "wbyWorkflowAssignment";
export const WORKFLOW_SETTINGS_MODEL_ID = "wbyWorkflowSettings";
/** The one settings entry of a tenant (CMS entries are tenant-scoped). */
export const WORKFLOW_SETTINGS_ENTRY_ID = "settings";
export const WORKFLOWS_PERMISSION = "workflows";
```

Create `packages/api-workflows/src/domain/settings/types.ts`:

```ts
export interface WorkflowExclusion {
    userId: string;
    reason?: string;
    /** ISO datetime in UTC (D43, D110). */
    endsOn?: string;
}

/** Tenant workflow settings (spec 4.4, D16). */
export interface WorkflowSettings {
    exclusions: WorkflowExclusion[];
}
```

Create `packages/api-workflows/src/domain/settings/errors.ts`:

```ts
import { BaseError } from "@webiny/feature/api";

export interface WorkflowSettingsValidationErrorData {
    userId: string;
}

export class WorkflowSettingsValidationError extends BaseError<WorkflowSettingsValidationErrorData> {
    override readonly code = "Workflows/Settings/Validation" as const;

    constructor(message: string, data: WorkflowSettingsValidationErrorData) {
        super({ message, data });
    }
}

export class WorkflowSettingsPersistenceError extends BaseError {
    override readonly code = "Workflows/Settings/Persistence" as const;

    constructor(error: Error) {
        super({ message: error.message });
    }
}
```

Create `packages/api-workflows/src/domain/settings/WorkflowSettingsValidator.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowSettingsValidationError } from "./errors.js";
import type { WorkflowExclusion, WorkflowSettings } from "./types.js";

const fail = (message: string, userId: string) => {
    return Result.fail(new WorkflowSettingsValidationError(message, { userId }));
};

/** One entry per user (D105); end dates are stored as UTC instants (D43, D110). */
export class WorkflowSettingsValidator {
    public static validate(
        settings: WorkflowSettings
    ): Result<WorkflowSettings, WorkflowSettingsValidationError> {
        const userIds = new Set<string>();
        const exclusions: WorkflowExclusion[] = [];

        for (const exclusion of settings.exclusions) {
            const userId = (exclusion.userId ?? "").trim();
            if (!userId) {
                return fail("Every exclusion needs a user.", "");
            }
            if (userIds.has(userId)) {
                return fail("This user is already in the list. Edit it instead.", userId);
            }
            userIds.add(userId);

            let endsOn: string | undefined;
            if (exclusion.endsOn) {
                const time = Date.parse(exclusion.endsOn);
                if (Number.isNaN(time)) {
                    return fail(`The end date "${exclusion.endsOn}" is not a valid date.`, userId);
                }
                endsOn = new Date(time).toISOString();
            }

            exclusions.push({
                userId,
                ...(exclusion.reason ? { reason: exclusion.reason } : {}),
                ...(endsOn ? { endsOn } : {})
            });
        }

        return Result.ok({ exclusions });
    }
}
```

Create `packages/api-workflows/src/domain/settings/filterActiveExclusions.ts`:

```ts
import type { WorkflowExclusion } from "./types.js";

/** Expired entries stay stored until removed (D105) but are filtered on read (spec 4.4). */
export const filterActiveExclusions = (
    exclusions: WorkflowExclusion[],
    now: Date
): WorkflowExclusion[] => {
    return exclusions.filter(exclusion => {
        return !exclusion.endsOn || Date.parse(exclusion.endsOn) > now.getTime();
    });
};
```

Create `packages/api-workflows/src/domain/settings/settings.model.ts`:

```ts
import { ModelFactory } from "@webiny/api-headless-cms/features/modelBuilder/index.js";
import { WORKFLOW_SETTINGS_MODEL_ID } from "~/constants.js";

/** Private model for tenant workflow settings (spec 4.4); one entry per tenant. */
class WorkflowSettingsModelImpl implements ModelFactory.Interface {
    public async execute(builder: ModelFactory.Builder) {
        return [
            builder
                .private({
                    modelId: WORKFLOW_SETTINGS_MODEL_ID,
                    name: "Workflow Settings"
                })
                .fields(fields => ({
                    exclusions: fields
                        .object()
                        .label("Exclusions")
                        .list()
                        .fields(exclusionFields => ({
                            userId: exclusionFields.text().label("User ID"),
                            reason: exclusionFields.longText().label("Reason"),
                            endsOn: exclusionFields.datetime().label("Ends on").withoutTimezone()
                        }))
                }))
        ];
    }
}

export const WorkflowSettingsModel = ModelFactory.createImplementation({
    implementation: WorkflowSettingsModelImpl,
    dependencies: []
});
```

Create `packages/api-workflows/src/domain/settings/abstractions/WorkflowSettingsModelProvider.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";

export interface IWorkflowSettingsModelProvider {
    get(): Promise<CmsModel>;
}

/** Provides the tenant's `wbyWorkflowSettings` model on demand. */
export const WorkflowSettingsModelProvider = createAbstraction<IWorkflowSettingsModelProvider>(
    "WorkflowSettingsModelProvider"
);

export namespace WorkflowSettingsModelProvider {
    export type Interface = IWorkflowSettingsModelProvider;
}
```

Create `packages/api-workflows/src/domain/settings/abstractions/WorkflowSettingsRepository.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "../types.js";
import type { WorkflowSettingsPersistenceError } from "../errors.js";

export interface IWorkflowSettingsRepository {
    /** Stored settings, including expired exclusions; empty when nothing was saved yet. */
    get(): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>>;
    /** Writes the whole record; the last save wins (D106). */
    save(settings: WorkflowSettings): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>>;
}

export const WorkflowSettingsRepository = createAbstraction<IWorkflowSettingsRepository>(
    "WorkflowSettingsRepository"
);

export namespace WorkflowSettingsRepository {
    export type Interface = IWorkflowSettingsRepository;
}
```

- [ ] **Step 4: Add the mapper, provider, repository and shared feature**

Create `packages/api-workflows/src/features/settings/shared/WorkflowSettingsEntryMapper.ts`:

```ts
import type { CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import type { WorkflowExclusion, WorkflowSettings } from "~/domain/settings/types.js";
import { toIsoString } from "~/features/shared/toIsoString.js";

export interface WorkflowSettingsEntryExclusion {
    userId: string;
    reason: string | null;
    endsOn: string | Date | null;
}

export interface WorkflowSettingsEntryValues {
    exclusions: WorkflowSettingsEntryExclusion[] | null;
}

export class WorkflowSettingsEntryMapper {
    public static toValues(settings: WorkflowSettings): WorkflowSettingsEntryValues {
        return {
            exclusions: settings.exclusions.map(exclusion => ({
                userId: exclusion.userId,
                reason: exclusion.reason ?? null,
                endsOn: exclusion.endsOn ?? null
            }))
        };
    }

    public static fromEntry(entry: CmsEntry<WorkflowSettingsEntryValues>): WorkflowSettings {
        return {
            exclusions: (entry.values.exclusions ?? []).map(exclusion =>
                WorkflowSettingsEntryMapper.exclusionFromEntry(exclusion)
            )
        };
    }

    private static exclusionFromEntry(value: WorkflowSettingsEntryExclusion): WorkflowExclusion {
        const endsOn = toIsoString(value.endsOn);
        return {
            userId: value.userId,
            ...(value.reason ? { reason: value.reason } : {}),
            ...(endsOn ? { endsOn } : {})
        };
    }
}
```

Create `packages/api-workflows/src/features/settings/shared/WorkflowSettingsModelProvider.ts`:

```ts
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { WorkflowSettingsModelProvider as Abstraction } from "~/domain/settings/abstractions/WorkflowSettingsModelProvider.js";
import { WORKFLOW_SETTINGS_MODEL_ID } from "~/constants.js";

/** Same contract as `WorkflowModelProvider`: no memoization, no `withoutAuthorization`. */
class WorkflowSettingsModelProviderImpl implements Abstraction.Interface {
    constructor(private getModel: GetModelUseCase.Interface) {}

    async get(): Promise<CmsModel> {
        const result = await this.getModel.execute(WORKFLOW_SETTINGS_MODEL_ID);
        if (result.isFail()) {
            throw result.error;
        }
        return result.value;
    }
}

export const WorkflowSettingsModelProvider = Abstraction.createImplementation({
    implementation: WorkflowSettingsModelProviderImpl,
    dependencies: [GetModelUseCase]
});
```

Create `packages/api-workflows/src/features/settings/shared/WorkflowSettingsRepository.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { createIdentifier } from "@webiny/utils";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById/index.js";
import { WorkflowSettingsModelProvider } from "~/domain/settings/abstractions/WorkflowSettingsModelProvider.js";
import { WorkflowSettingsRepository as Abstraction } from "~/domain/settings/abstractions/WorkflowSettingsRepository.js";
import { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import { WORKFLOW_SETTINGS_ENTRY_ID } from "~/constants.js";
import {
    WorkflowSettingsEntryMapper,
    type WorkflowSettingsEntryValues
} from "./WorkflowSettingsEntryMapper.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";
const SETTINGS_REVISION_ID = createIdentifier({ id: WORKFLOW_SETTINGS_ENTRY_ID, version: 1 });

class WorkflowSettingsRepositoryImpl implements Abstraction.Interface {
    constructor(
        private modelProvider: WorkflowSettingsModelProvider.Interface,
        private getEntryById: GetEntryByIdUseCase.Interface,
        private createEntry: CreateEntryUseCase.Interface,
        private updateEntry: UpdateEntryUseCase.Interface
    ) {}

    async get(): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>> {
        const model = await this.modelProvider.get();
        const result = await this.getEntryById.execute<WorkflowSettingsEntryValues>(
            model,
            SETTINGS_REVISION_ID
        );
        if (result.isFail()) {
            if (result.error.code === ENTRY_NOT_FOUND) {
                return Result.ok({ exclusions: [] });
            }
            return Result.fail(new WorkflowSettingsPersistenceError(result.error));
        }
        return Result.ok(WorkflowSettingsEntryMapper.fromEntry(result.value));
    }

    async save(
        settings: WorkflowSettings
    ): Promise<Result<WorkflowSettings, WorkflowSettingsPersistenceError>> {
        const model = await this.modelProvider.get();
        const values = WorkflowSettingsEntryMapper.toValues(settings);

        const existing = await this.getEntryById.execute<WorkflowSettingsEntryValues>(
            model,
            SETTINGS_REVISION_ID
        );
        if (existing.isFail() && existing.error.code !== ENTRY_NOT_FOUND) {
            return Result.fail(new WorkflowSettingsPersistenceError(existing.error));
        }

        if (existing.isOk()) {
            const updated = await this.updateEntry.execute<WorkflowSettingsEntryValues>(
                model,
                SETTINGS_REVISION_ID,
                { values }
            );
            if (updated.isFail()) {
                return Result.fail(new WorkflowSettingsPersistenceError(updated.error));
            }
            return Result.ok(WorkflowSettingsEntryMapper.fromEntry(updated.value));
        }

        const created = await this.createEntry.execute<WorkflowSettingsEntryValues>(model, {
            id: WORKFLOW_SETTINGS_ENTRY_ID,
            values
        });
        if (created.isFail()) {
            return Result.fail(new WorkflowSettingsPersistenceError(created.error));
        }
        return Result.ok(WorkflowSettingsEntryMapper.fromEntry(created.value));
    }
}

export const WorkflowSettingsRepository = Abstraction.createImplementation({
    implementation: WorkflowSettingsRepositoryImpl,
    dependencies: [
        WorkflowSettingsModelProvider,
        GetEntryByIdUseCase,
        CreateEntryUseCase,
        UpdateEntryUseCase
    ]
});
```

Create `packages/api-workflows/src/features/settings/shared/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { WorkflowSettingsModelProvider } from "./WorkflowSettingsModelProvider.js";
import { WorkflowSettingsRepository } from "./WorkflowSettingsRepository.js";

export const WorkflowSettingsSharedFeature = createFeature({
    name: "Workflows/WorkflowSettingsShared",
    register(container) {
        container.register(WorkflowSettingsModelProvider);
        container.register(WorkflowSettingsRepository).inSingletonScope();
    }
});
```

- [ ] **Step 5: Add `GetWorkflowSettings`**

Create `packages/api-workflows/src/features/settings/GetWorkflowSettings/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import type { WorkflowSettingsPersistenceError } from "~/domain/settings/errors.js";

export interface GetWorkflowSettingsInput {
    /** Include expired exclusions. The settings page needs them so they can be edited (D105). */
    includeExpired?: boolean;
}

export interface IGetWorkflowSettingsUseCaseErrors {
    persistence: WorkflowSettingsPersistenceError;
}

type UseCaseError = IGetWorkflowSettingsUseCaseErrors[keyof IGetWorkflowSettingsUseCaseErrors];

export interface IGetWorkflowSettingsUseCase {
    execute(input?: GetWorkflowSettingsInput): Promise<Result<WorkflowSettings, UseCaseError>>;
}

/** Read the tenant's workflow settings. No `editor` check in 1a (phase 1b). */
export const GetWorkflowSettingsUseCase = createAbstraction<IGetWorkflowSettingsUseCase>(
    "GetWorkflowSettingsUseCase"
);

export namespace GetWorkflowSettingsUseCase {
    export type Interface = IGetWorkflowSettingsUseCase;
    export type Input = GetWorkflowSettingsInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowSettings, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/settings/GetWorkflowSettings/GetWorkflowSettingsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowSettingsRepository } from "~/domain/settings/abstractions/WorkflowSettingsRepository.js";
import { filterActiveExclusions } from "~/domain/settings/filterActiveExclusions.js";
import { GetWorkflowSettingsUseCase as UseCase } from "./abstractions.js";

class GetWorkflowSettingsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowSettingsRepository.Interface) {}

    async execute(input: UseCase.Input = {}): UseCase.Return {
        const result = await this.repository.get();
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        if (input.includeExpired) {
            return Result.ok(result.value);
        }
        return Result.ok({
            exclusions: filterActiveExclusions(result.value.exclusions, new Date())
        });
    }
}

export const GetWorkflowSettingsUseCase = UseCase.createImplementation({
    implementation: GetWorkflowSettingsUseCaseImpl,
    dependencies: [WorkflowSettingsRepository]
});
```

Create `packages/api-workflows/src/features/settings/GetWorkflowSettings/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { GetWorkflowSettingsUseCase } from "./GetWorkflowSettingsUseCase.js";

export const GetWorkflowSettingsFeature = createFeature({
    name: "Workflows/GetWorkflowSettings",
    register(container) {
        container.register(GetWorkflowSettingsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/settings/GetWorkflowSettings/index.ts`:

```ts
export { GetWorkflowSettingsUseCase } from "./abstractions.js";
export type { GetWorkflowSettingsInput } from "./abstractions.js";
```

- [ ] **Step 6: Add `SaveWorkflowSettings`**

Create `packages/api-workflows/src/features/settings/SaveWorkflowSettings/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { WorkflowSettings } from "~/domain/settings/types.js";
import type {
    WorkflowSettingsPersistenceError,
    WorkflowSettingsValidationError
} from "~/domain/settings/errors.js";

export interface ISaveWorkflowSettingsUseCaseErrors {
    validation: WorkflowSettingsValidationError;
    persistence: WorkflowSettingsPersistenceError;
}

type UseCaseError = ISaveWorkflowSettingsUseCaseErrors[keyof ISaveWorkflowSettingsUseCaseErrors];

export interface ISaveWorkflowSettingsUseCase {
    execute(input: WorkflowSettings): Promise<Result<WorkflowSettings, UseCaseError>>;
}

/** Save the whole settings record; last save wins (D106). No `editor` check in 1a (phase 1b). */
export const SaveWorkflowSettingsUseCase = createAbstraction<ISaveWorkflowSettingsUseCase>(
    "SaveWorkflowSettingsUseCase"
);

export namespace SaveWorkflowSettingsUseCase {
    export type Interface = ISaveWorkflowSettingsUseCase;
    export type Input = WorkflowSettings;
    export type Error = UseCaseError;
    export type Return = Promise<Result<WorkflowSettings, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/settings/SaveWorkflowSettings/SaveWorkflowSettingsUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowSettingsRepository } from "~/domain/settings/abstractions/WorkflowSettingsRepository.js";
import { WorkflowSettingsValidator } from "~/domain/settings/WorkflowSettingsValidator.js";
import { SaveWorkflowSettingsUseCase as UseCase } from "./abstractions.js";

class SaveWorkflowSettingsUseCaseImpl implements UseCase.Interface {
    constructor(private repository: WorkflowSettingsRepository.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const validation = WorkflowSettingsValidator.validate(input);
        if (validation.isFail()) {
            return Result.fail(validation.error);
        }
        return this.repository.save(validation.value);
    }
}

export const SaveWorkflowSettingsUseCase = UseCase.createImplementation({
    implementation: SaveWorkflowSettingsUseCaseImpl,
    dependencies: [WorkflowSettingsRepository]
});
```

Create `packages/api-workflows/src/features/settings/SaveWorkflowSettings/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { SaveWorkflowSettingsUseCase } from "./SaveWorkflowSettingsUseCase.js";

export const SaveWorkflowSettingsFeature = createFeature({
    name: "Workflows/SaveWorkflowSettings",
    register(container) {
        container.register(SaveWorkflowSettingsUseCase);
    }
});
```

Create `packages/api-workflows/src/features/settings/SaveWorkflowSettings/index.ts`:

```ts
export { SaveWorkflowSettingsUseCase } from "./abstractions.js";
```

- [ ] **Step 7: Register settings (final `WorkflowsFeature`)**

Replace `packages/api-workflows/src/WorkflowsFeature.ts` with:

```ts
import { type Container, createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowModel } from "~/domain/workflow/workflow.model.js";
import { ReviewModel } from "~/domain/review/review.model.js";
import { AssignmentModel } from "~/domain/assignment/assignment.model.js";
import { WorkflowSettingsModel } from "~/domain/settings/settings.model.js";
import { ListNotificationTypesFeature } from "~/features/notifications/ListNotificationTypes/index.js";
import { NotificationTransportFeature } from "~/features/notifications/NotificationTransport/index.js";
import { WorkflowSharedFeature } from "~/features/workflow/shared/feature.js";
import { GetWorkflowFeature } from "~/features/workflow/GetWorkflow/feature.js";
import { ListWorkflowsFeature } from "~/features/workflow/ListWorkflows/feature.js";
import { StoreWorkflowFeature } from "~/features/workflow/StoreWorkflow/feature.js";
import { DeleteWorkflowFeature } from "~/features/workflow/DeleteWorkflow/feature.js";
import { ReviewSharedFeature } from "~/features/review/shared/feature.js";
import { ReviewLifecycleFeature } from "~/features/review/ReviewLifecycleFeature.js";
import { RequestReviewFeature } from "~/features/review/RequestReview/feature.js";
import { GetReviewFeature } from "~/features/review/GetReview/feature.js";
import { StartReviewStepFeature } from "~/features/review/StartReviewStep/feature.js";
import { TakeOverReviewStepFeature } from "~/features/review/TakeOverReviewStep/feature.js";
import { ApproveReviewStepFeature } from "~/features/review/ApproveReviewStep/feature.js";
import { RejectReviewStepFeature } from "~/features/review/RejectReviewStep/feature.js";
import { CancelReviewFeature } from "~/features/review/CancelReview/feature.js";
import { AssignmentSharedFeature } from "~/features/assignment/shared/feature.js";
import { WorkflowSettingsSharedFeature } from "~/features/settings/shared/feature.js";
import { GetWorkflowSettingsFeature } from "~/features/settings/GetWorkflowSettings/feature.js";
import { SaveWorkflowSettingsFeature } from "~/features/settings/SaveWorkflowSettings/feature.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        // Advanced publishing workflow is license-gated. Check the effective flag at register time
        // (the license is refreshed pre-register) so nothing is wired up without the entitlement.
        if (!container.resolve(FeatureFlags).get().isEnabled("advancedPublishingWorkflow")) {
            return;
        }

        // Private CMS models, registered early so HeadlessCmsInitializerImpl picks them up when
        // it builds the model list during the enhance phase.
        container.register(WorkflowModel);
        container.register(ReviewModel);
        container.register(AssignmentModel);
        container.register(WorkflowSettingsModel);

        // Notifications (unchanged until phase 7)
        ListNotificationTypesFeature.register(container);
        NotificationTransportFeature.register(container);

        // Workflows
        WorkflowSharedFeature.register(container);
        GetWorkflowFeature.register(container);
        ListWorkflowsFeature.register(container);
        StoreWorkflowFeature.register(container);
        DeleteWorkflowFeature.register(container);

        // Reviews
        ReviewSharedFeature.register(container);
        ReviewLifecycleFeature.register(container);
        RequestReviewFeature.register(container);
        GetReviewFeature.register(container);
        StartReviewStepFeature.register(container);
        TakeOverReviewStepFeature.register(container);
        ApproveReviewStepFeature.register(container);
        RejectReviewStepFeature.register(container);
        CancelReviewFeature.register(container);

        // Assignment log (written from phase 4)
        AssignmentSharedFeature.register(container);

        // Settings
        WorkflowSettingsSharedFeature.register(container);
        GetWorkflowSettingsFeature.register(container);
        SaveWorkflowSettingsFeature.register(container);
    }
});
```

- [ ] **Step 8: Run every suite**

Run: `yarn test packages/api-workflows/__tests__/domain/WorkflowSettingsValidator.test.ts packages/api-workflows/__tests__/settings/WorkflowSettings.test.ts 2>&1 | tail -50`
Expected: PASS (8 tests).
Run: `yarn test packages/api-workflows 2>&1 | tail -50` and `yarn test:os packages/api-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` and `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50` and `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50`
Expected: PASS.
Run: `yarn build -p @webiny/api-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-headless-cms-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-website-builder-workflows 2>&1 | tail -30`, `yarn build -p @webiny/api-event-handler-core 2>&1 | tail -30`
Expected: all succeed.

- [ ] **Step 9: Commit**

Run the Global Constraints chain, then:

```bash
git commit -m "feat(api-workflows): add workflow settings with exclusion list

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

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
