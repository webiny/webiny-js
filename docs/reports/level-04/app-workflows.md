# @webiny/app-workflows

> Level 4 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/app-workflows` is the admin-app front end for content review workflows: it lets teams
configure multi-step approval workflows (`WorkflowsEditor`), shows the current review state of a
piece of content (`WorkflowStateBar`, tooltip, overlay), lists in-progress reviews
(`WorkflowStateListView`), and drives the actual state transitions — start, approve, reject, take
over, cancel, request review — through a set of one-to-one UseCase→Gateway→GraphQL slices. It
follows the DI "feature" pattern used throughout the admin app (`createFeature`/`createAbstraction`
per slice) and mirrors a parallel `Workflow`/`WorkflowStep` and `WorkflowState`/`WorkflowStateStep`
domain-model pair built on MobX. Overall the code is uniform and readable, but it ships with zero
tests, and the dashboard-widget presenter has a confirmed total-count bug on the terminal
approve/reject transitions. Nothing here reimplements lower-level utilities from `form`, `utils`,
or `validation` — it consumes `@webiny/app`'s DI/GraphQL-client/event-publisher primitives and
`@webiny/app-admin`'s security/feature-flag hooks as intended.

## Public API

- `Components.ContentReview.{WorkflowStateBar, WorkflowStateTooltip, WorkflowStateOverlay}`, `Components.Admin.WorkflowsEditor`, `Components.Widget.{OwnWidget, RequestedWidget}`, `Components.Permissions.HasWorkflowsEditorPermission` (`src/index.tsx`) — composed into the admin app's content-editor screens; consumed by `app-headless-cms-workflows` and `app-website-builder-workflows` (per codegraph, ~13 call sites across `ContentEntryFormWorkflow.tsx`, `PageEditorLayout.tsx`, `PageEditorTopBarWorkflowsState`, etc.).
- `useWorkflowState`/`useWorkflowStatePresenter` (`src/presentation/workflowState/useWorkflowState.ts`) — codegraph reports 17 callers, all in `app-headless-cms-workflows` and `app-website-builder-workflows`; this is the package's most heavily used export and has no test coverage within 3 caller hops.
- `useCanUseWorkflows` (`src/hooks/canUseWorkflows.ts`) — thin wrapper over `app-admin`'s `useFeatureFlags`, gates all widgets/menus on the `advancedPublishingWorkflow` flag.
- `WorkflowsFeature`, `WorkflowStatePresenterFeature`, `WorkflowStateListPresenterFeature`, `WorkflowStatesWidgetPresenterFeature`, `WorkflowsEditorPresenterFeature`, `WorkflowsPermissionsFeature` (various `feature.ts` files) — DI registration entry points wired into the admin app composition root.
- `useWorkflowsPermission` / `WORKFLOWS_PERMISSIONS_SCHEMA` — permission-check hook and schema built on `app-admin`'s `createPermissionSchema`, consumed by `HasWorkflowsEditorPermission` and the editor screen.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|----------|----------------------|---------|-------------------|------------|
| 1 | medium | `src/presentation/workflowStatesWidget/WorkflowStatesWidgetPresenter.ts:122-147, 198-243` | `moveStepBetweenStates` moves an item between the per-state buckets used by the "Content Reviews" dashboard widget but only updates each bucket's `items` array, never its `total`; the two call sites that transition a step to a *terminal* state (`approveStateStep` when `result.state === approved`, `rejectStateStep` when `result.state === rejected`) never call `adjustTotal` for the destination bucket either (unlike `startStateStep`, which correctly calls `adjustTotal` on both the `pending` and `inReview` buckets, and unlike the `approveStateStep` branch for a non-final approval, which does call `adjustTotal(pending, 1)`). | A user approves the last step of a review (or rejects a step) from `WorkflowStatesOwnWidget`, which tracks `pending`/`inReview`/`approved`/`rejected` buckets (`WorkflowStatesOwnWidget.tsx:15-20`). The item is prepended to `_values.approved.items` (or `.rejected.items`) but `_values.approved.total` (shown as the widget's count) is left at its stale, pre-action value, so the rendered item count under-reports what's actually in the list until the widget is reloaded. | high |
| 2 | low | `src/presentation/workflowsEditor/WorkflowsEditorPresenter.ts:22` | `_app` is initialized as `{ id: "", name: "", icon: null as any }`, forcing a required `ReactElement` field to `null` via an `any` cast. | If any consumer reads `vm.app.icon` before `init()` resolves (e.g. a decorator rendered during the initial `loading` state), it renders `null` where a `ReactElement` is statically guaranteed, silently defeating the type check. Not observed to be hit by current templates, since `WorkflowsEditor` gates on `loading`, so this is a latent type-safety hole rather than a confirmed live bug. | low |

## Duplication

- `src/domain/WorkflowModel.ts` (addStep/updateStep/removeStep/findStep, lines 48-84) is a near-exact structural duplicate of `src/domain/WorkflowStateModel.ts` (lines 107-146) — same MobX `observable.array` + `runInAction` step-mutation methods, just parameterized over `WorkflowStepModel` vs. `WorkflowStateStepModel`. jscpd also flags a literal 16-line clone between `WorkflowModel.ts:64-79` and `WorkflowStateModel.ts:125-140`. A shared generic base/mixin would remove ~40 duplicated lines across the two model pairs.
- `src/presentation/workflowState/WorkflowStatePresenter.ts:206-334` — the five action methods (`requestReview`, `start`, `approve`, `reject`, `takeOver`) repeat the same `_executing = true → try/execute → setState/dialog → publishStateChanged → catch → set _error` shape almost verbatim (jscpd: 4 internal clones of 16 lines each, lines 216-336). Same pattern repeats, at smaller scale, between `WorkflowStateListPresenter.ts`'s `nextPage`/`executeList` (lines 64-120) and is echoed again in `WorkflowsEditorPresenter.ts`'s `init` (78-92, flagged by jscpd against `WorkflowStatePresenter.ts:166-180`). A shared `runAction`/`withLoadingState` helper would collapse this.
- `src/presentation/shared/Options/OptionItem/Approve.tsx` and `Reject.tsx` (jscpd: lines 11-26 vs 11-25) are identical except for the icon/label — same visibility guard (`state.state !== inReview || !step.canReview || !step.isOwner`) copy-pasted; likewise `StartSuccessDialog.tsx` and `TakeOverSuccessDialog.tsx` (lines 11-39) share the same success-dialog shell.
- Every Gateway (`ApproveStepGateway`, `GetTargetWorkflowStateGateway`, `ListWorkflowStatesGateway`, etc.) repeats the same "call `MainGraphQLClient.execute`, destructure `{ data, error }`, throw on error/missing data" boilerplate. This mirrors the established `app-admin`/`app` DI-feature convention rather than being package-specific duplication, so it's noted for completeness but not a real defect.

## Dead code

None found with high confidence. Codegraph shows every checked export (`WorkflowStateBar`, `canMoveStepUp`/`canMoveStepDown`, `WorkflowStateOptionsOpenInNewWindow`, `YouCanTrackAllContentReviewsHere`) has at least one live caller (the last is rendered from all four success dialogs; `WorkflowStateBar` has a single caller in `src/index.tsx`, which is its intended barrel re-export, not dead code).

## Convention issues

- No violations of the DI naming/one-per-file conventions found — every feature slice consistently uses `<Name>UseCaseImpl`/`<Name>GatewayImpl` classes exported under the abstraction's name, and `abstractions.ts` bundles only the UseCase+Gateway pair for that one feature slice (consistent with the pattern used across the rest of the admin app, not a violation of "one abstraction per file" in isolated terms).
- `WorkflowsEditorPresenterImpl._app` uses an inline `null as any` cast noted above (Bugs #2) instead of making `icon` optional on `IWorkflowApplication` or seeding a real placeholder value.

## Test gaps

- The package has **no `__tests__` directory and no test script at all** — every state-transition path (`requestReview`, `start`, `approve`, `reject`, `takeOver`, `cancel`), every presenter (`WorkflowStatePresenter`, `WorkflowStateListPresenter`, `WorkflowStatesWidgetPresenter`, `WorkflowsEditorPresenter`), and the domain models' `dirty`/`lastApproved`/`lastRejected` getters are completely untested. Codegraph confirms "no tests found within 3 caller hops" for both `useWorkflowState` and the backend `WorkflowState` domain type it renders.
- Given the confirmed bug in `WorkflowStatesWidgetPresenter.moveStepBetweenStates`/`adjustTotal`, a test asserting bucket `total` stays consistent with `items.length` after each of `startStateStep`/`approveStateStep`/`rejectStateStep`/`takeOverStateStep` would have caught issue #1 directly.

## Recommendations

1. Fix `WorkflowStatesWidgetPresenter.approveStateStep`/`rejectStateStep` (lines ~198-243) to call `adjustTotal` on the destination bucket (`approved`/`rejected`) exactly as `startStateStep` already does for `pending`/`inReview`, or fold the total adjustment into `moveStepBetweenStates` itself so callers can't forget it.
2. Add a test package for `app-workflows` (there is currently none) covering the five presenters' state-transition methods and the domain models' derived getters — this is the single highest-leverage gap given the package drives real approve/reject/publish decisions.
3. Extract the repeated MobX step-array mutation logic (`addStep`/`updateStep`/`removeStep`/`findStep`) shared by `WorkflowModel`/`WorkflowStateModel` into a common helper or generic base class, and likewise factor the `_executing`/try-catch-`_error` shape shared by `WorkflowStatePresenter`'s five action methods into one helper.
