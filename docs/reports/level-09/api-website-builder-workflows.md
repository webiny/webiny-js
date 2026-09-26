# @webiny/api-website-builder-workflows

> Level 9 · commit 19c9ca1b91 · audited 2026-09-26

## Summary
`@webiny/api-website-builder-workflows` is the website-builder sibling of `@webiny/api-headless-cms-workflows`: the same license-gated integration pattern (`advancedPublishingWorkflow` feature flag), wiring `@webiny/api-workflows`' review process into a single fixed "app" (`wb.page`, page publishing has no per-model concept, unlike CMS models) instead of per-content-model. It attaches/clears `page.system.workflow`, blocks moving a page to bin while a review is active, and blocks publishing a page whose current revision has an active, non-`done` `WorkflowState`. Because both packages independently reimplement the same "look up target workflow state, treat failure as pass" gate against the same shared `@webiny/api-workflows` repository, they have drifted: this package's before-publish handler has a genuine, distinct defect (an uncaught exception on certain lookup-failure codes) not present in the CMS version, and both are affected by security finding SEC-39 (see private notes). Test coverage here is thinner than the (already thin) CMS package's.

## Public API
- `WebsiteBuilderWorkflowsFeature` (`src/WebsiteBuilderWorkflowsFeature.ts:6`) — the package's only barrel export (`src/index.ts`). Gates on `advancedPublishingWorkflow`, then registers `PageWorkflowsFeature` and `WebsiteBuilderPageSchemaFactory` (extends `WbPage` with a `system: CmsEntrySystem` field). Confirmed single external consumer: `packages/api-event-handler-core/src/registerApiRequestStack.ts`, the same central registration point that consumes the CMS package's feature.
- Everything else (`PageWorkflows/handlers/*`, `PageWorkflows/decorators/*`) is internal, one class per file, registered only from `PageWorkflowsFeature` (`features/PageWorkflows/feature.ts`) and consumed via `@webiny/api-workflows`/`@webiny/api-website-builder`'s own event-handler abstractions.

## Bugs
| # | Severity | Location | Problem | Failure scenario | Confidence |
|---|---|---|---|---|---|
| 1 | high | `packages/api-website-builder-workflows/src/features/PageWorkflows/handlers/ValidateWorkflowStateOnPageBeforePublish.ts` | Security finding SEC-39 — see private notes. | — | high |
| 2 | medium | `packages/api-website-builder-workflows/src/features/PageWorkflows/handlers/ValidateWorkflowStateOnPageBeforePublish.ts:19-28` | The handler only returns early when the lookup's error code is exactly `"Workflows/State/NotFound"` (line 20). For any other failure code the `GetTargetWorkflowStateUseCase`/`GetTargetWorkflowStateRepository` can return (e.g. `MultipleWorkflowsFoundError`, `WorkflowStatePersistenceError`), execution falls through to `const state = stateResult.value` — but `Result.value` (`packages/feature/src/api/Result.ts:68-71`) throws `"Tried to get value from a failed Result."` whenever the result is a failure. | If two active `WorkflowState` rows ever exist for the same `app`/`targetRevisionId` (e.g. a race between two concurrent "Request Review" calls), or the underlying `ListLatestEntriesUseCase` lookup fails for any storage-layer reason, every subsequent publish attempt on that page throws an unhandled internal error instead of either a clean `WORKFLOW_STATE_NOT_COMPLETED` message or an intentional pass-through. This is a correctness bug (it fails closed, so it is not itself a bypass), but it is inconsistent with the CMS package's equivalent handler, which returns early for any failure. | high (the defect itself, from direct code + `Result` class reading); medium on how often the triggering condition (a non-`NotFound` failure) actually occurs in production |

## Duplication
One clone reported by jscpd, within this package: `handlers/ClearPageStateOnWorkflowStateAfterDelete.ts:10-25` <-> `handlers/ClearPageStateOnWorkflowStateCancel.ts:8-23` (16 lines) — both resolve `state.app !== WB_PAGE_APP` and then call `UpdatePageUseCase.execute(state.targetRevisionId, { system: { workflow: null } })`; low priority.

Cross-package duplication: this package and `@webiny/api-headless-cms-workflows` are parallel, independently-written implementations of the identical integration shape (validate-before-publish, block-move, clear/update-on-state-change, FLP-aware context/filter decorators) against the same `@webiny/api-workflows` abstractions, with no shared helper between them. This is why the two `ValidateWorkflowStateOn*BeforePublish` handlers have already drifted (see Bugs #2 and the security addendum) despite doing conceptually the same thing — a shared "before-publish workflow gate" helper living in `@webiny/api-workflows` itself would prevent this class of divergence.

The `WB_PAGE_APP = "wb.page"` string literal is independently defined in two places — `src/utils/appName.ts` here and `packages/app-website-builder-workflows/src/constants.ts` in the admin package — instead of being exported from one shared location; low severity today since the values match, but a rename in one place would silently break the other.

## Dead code
None found. `WebsiteBuilderWorkflowsFeature` has a confirmed external consumer; all handlers/decorators are registered from `PageWorkflowsFeature`.

## Convention issues
Structure closely follows the repo's one-class/one-abstraction-per-file convention (each handler and decorator is its own file with an `*Impl` class plus a `createImplementation`/`createDecorator` const), consistent with `api-headless-cms-workflows`. No barrel over-export issues — `src/index.ts` exports only `WebsiteBuilderWorkflowsFeature`. See the `WB_PAGE_APP` literal duplication noted above.

## Test gaps
Only one test file exists in the package (`__tests__/wbPageSystem.test.ts`), and it has a single test case exercising the `WbPage.system` GraphQL schema extension (that `system` is exposed when the license is active) — it does not touch the publish gate at all. There is no test coverage for:
- `ValidateWorkflowStateOnPageBeforePublish` — neither the blocking branch, the pass-through branch, nor the unhandled-exception bug (#2 above).
- `BlockMoveOnActiveWorkflowState`, `ClearPageStateOnWorkflowStateCancel`, `ClearPageStateOnWorkflowStateAfterDelete`, `DeleteWorkflowStateOnPageAfterDelete`, `UpdatePageOnWorkflowStateAfterCreate`/`AfterUpdate`.
- `WbWorkflowStateContextProvider`/`WbWorkflowStateFilter`, the FLP-aware decorators.
This is thinner than the already-thin CMS sibling package's test suite.

## Recommendations
1. Address security finding SEC-39 (see private notes).
2. Fix `ValidateWorkflowStateOnPageBeforePublish`'s error handling (bug #2): return early on `stateResult.isFail()` regardless of error code (matching, or improving on, the CMS handler), and add a test for a non-`NotFound` failure.
3. Add basic test coverage for the publish-block, move-block, and FLP-filter/context-provider decorators — currently only the GraphQL schema extension is tested.
