# @webiny/api-headless-cms-workflows

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-headless-cms-workflows` is the license-gated integration package that wires `@webiny/api-workflows`' generic multi-step review process into `@webiny/api-headless-cms` content entries: it attaches/clears a `WorkflowState` snapshot on `entry.system.workflow` as review states are created/updated/cancelled/deleted, blocks moving an entry to bin while a review is active, and — the security-relevant piece — blocks publishing an entry whose current revision has an active, non-`done` `WorkflowState`. Security finding SEC-39 applies to this package (see private notes). Health is otherwise consistent with the repo's use-case/repository/DI pattern, small, and reasonably well factored, but test coverage is thin and the package registers two DI features under the same string name.

## Public API
- `CmsWorkflowsFeature` (`src/CmsWorkflowsFeature.ts:9`) — the only export from the package's barrel (`src/index.ts`). It gates all wiring on the `advancedPublishingWorkflow` feature flag, then registers `EntryWorkflowsFeature`, the local `WorkflowsFeature` (from `features/Workflows`), `@webiny/api-workflows`'s own `WorkflowsFeature`, and a `CmsGraphQLSchemaFactory` instance that extends `CmsEntrySystem` with a `workflow` field. Confirmed single external consumer: `packages/api-event-handler-core/src/registerApiRequestStack.ts`, the central per-request feature registration point for the whole backend.
- Everything else (the seven `EntryWorkflows/handlers/*`, the two decorators, and `Workflows/handlers/DisallowUnpublishableModelsOnBeforeCreate.ts`) is internal: each is a one-class-per-file event handler/decorator registered only from this package's own `feature.ts` files and consumed by `@webiny/api-workflows`'/`@webiny/api-headless-cms`'s event-handler abstractions, never imported directly by other packages.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/api-headless-cms-workflows/src/features/EntryWorkflows/handlers/ValidateWorkflowStateOnEntryBeforePublish.ts` | Security finding SEC-39 — see private notes. | — | high |

## Duplication
Four clones reported by jscpd, all within this package:
- `handlers/UpdateEntryOnWorkflowStateAfterCreate.ts:25-34` <-> `handlers/UpdateEntryOnWorkflowStateAfterUpdate.ts:23-32` (10 lines)
- `handlers/ClearEntryStateOnWorkflowStateCancel.ts:12-29` <-> `handlers/UpdateEntryOnWorkflowStateAfterUpdate.ts:15-32` (18 lines)
- `handlers/ClearEntryStateOnWorkflowStateAfterDelete.ts:14-37` <-> `handlers/UpdateEntryOnWorkflowStateAfterUpdate.ts:15-35` (24 lines)
- `handlers/BlockMoveOnActiveWorkflowState.ts:10-25` <-> `handlers/ValidateWorkflowStateOnEntryBeforePublish.ts:12-24` (16 lines)

All four are the same shape: resolve the model from `getModelIdFromAppName`/`isModelAllowed`, then either look up the target `WorkflowState` (Validate/BlockMove pair) or call `UpdateEntryUseCase.execute(model, state.targetRevisionId, { system: { workflow: ... } }, { skipValidation: true })` (the four state-sync handlers). None of the clones is itself buggy, but the repeated "get model → mutate `entry.system.workflow`" boilerplate would be a good candidate for one small shared helper in this package, and the repeated "get target workflow state, treat any failure as pass" shape (see Bugs/security notes) is exactly the pattern that produced the confirmed security gap — factoring it once would make it easier to fix in one place instead of two (this package and its website-builder sibling both reimplement the same lookup-and-guard logic independently).

## Dead code
None found. The package's only public export, `CmsWorkflowsFeature`, has a confirmed external consumer (`api-event-handler-core/registerApiRequestStack.ts`). Every handler and decorator is registered from one of the package's own `feature.ts` files (`EntryWorkflowsFeature`, the local `Workflows/feature.ts`), so nothing is unreferenced.

## Convention issues
- **Duplicate DI feature name.** `CmsWorkflowsFeature` (`src/CmsWorkflowsFeature.ts:9-10`, `name: "CmsWorkflows"`) and `features/Workflows/feature.ts`'s `WorkflowsFeature` (`name: "CmsWorkflows"`, line 5) register two entirely different features under the identical name string. This looks like a copy-paste leftover (the inner one likely should have been named something like `"DisallowUnpublishableModels"`, matching what it actually registers). `createFeature`'s `name` field (`packages/feature/src/api/createFeature.ts`) appears to be metadata only (used for logging/registry bookkeeping), so no functional break was confirmed, but the collision is confusing and worth fixing.

## Test gaps
Only five test files exist (`entrySystemSchema.test.ts`, `entry/entry.afterDelete.test.ts`, `entry/entry.beforePublish.test.ts`, `workflows/disallowUnpublishableModels.test.ts`, `state/state.onAfterCreate.test.ts`), and `entry.beforePublish.test.ts` has exactly one test case ("should remove workflow information when publishing an entry" — the `state.done === true` happy path). There is no test for:
- The actual blocking branch of `ValidateWorkflowStateOnEntryBeforePublish` (publish attempted while `state.done === false` should throw `WORKFLOW_STATE_NOT_COMPLETED`).
- Security finding SEC-39 has no regression test (see private notes).
- `BlockMoveOnActiveWorkflowState`, `ClearEntryStateOnWorkflowStateCancel`, `ClearEntryStateOnWorkflowStateAfterDelete`, `DeleteWorkflowStateOnEntryAfterDelete`, `DeleteWorkflowsOnModelAfterDelete`.
- `CmsWorkflowStateContextProvider`/`CmsWorkflowStateFilter`, the two FLP-aware decorators that gate which workflow states a caller can see/attach folder context to — security-adjacent logic with zero test coverage.

## Recommendations
1. Address security finding SEC-39 (see private notes).
2. Add regression tests for the blocking branch of `ValidateWorkflowStateOnEntryBeforePublish` (see private notes for the SEC-39 scenario).
3. Rename the colliding `"CmsWorkflows"` feature name in `features/Workflows/feature.ts` to something distinct (e.g. `"DisallowUnpublishableModels"`) to avoid ambiguity in DI/feature bookkeeping.
