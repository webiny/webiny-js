# @webiny/api-workflows

> Level 7 · commit 19c9ca1b91 · audited 2026-09-26

## Summary

`@webiny/api-workflows` is the backend for content-review workflows: it lets tenants define multi-step approval `Workflow`s (each step assigned to one or more teams), attaches a `WorkflowState` instance to a specific content-entry revision, and drives that instance through pending → in-review → approved/rejected transitions (start, take over, approve, reject, cancel) via a consistent use-case/repository/DI-feature pattern built on `@webiny/api-headless-cms`'s private-model storage. The core authorization logic — can this user act on this step — is enforced correctly and in the right place: `WorkflowState.approve()`/`reject()`/`start()`/`takeOver()` (`src/domain/workflowState/WorkflowState.ts`) re-derive `canReview`/`isStepOwner`/`canTakeOver` from the step's assigned teams, the caller's own team membership, and who currently "owns" the in-review step, and refuse the transition with a typed error if the check fails — this is a genuine domain-layer guard, not just a UI affordance. The package's biggest flaw is that the whole per-step notifications subsystem (a `NotificationTransport` abstraction, a `MailNotificationTransport` implementation, and a `notifications: [{id}]` field admins can set on every step) is completely unwired: nothing in the package (or in the two downstream packages that register `WorkflowsFeature`) ever calls `NotificationTransport.send()`, so reviewers configured to be emailed when a step needs them are never actually notified, with no error surfaced anywhere. Other packages should reuse this package's use-case→domain-model→repository→event-publish shape rather than re-deriving step-ownership/review-eligibility logic, since that logic already lives correctly in `WorkflowState`.

## Public API

- `WorkflowsFeature` (`src/WorkflowsFeature.ts:35`) — the composition root; registered from `@webiny/api-event-handler-core`'s `registerApiRequestStack.ts` into the per-request container, gated behind the `advancedPublishingWorkflow` license flag. This is the package's only barrel export (`src/index.ts`).
- `ApproveWorkflowStateStepUseCase`, `RejectWorkflowStateStepUseCase`, `StartWorkflowStateStepUseCase`, `TakeOverWorkflowStateStepUseCase`, `CreateWorkflowStateUseCase`, `GetTargetWorkflowStateUseCase` — internal DI use cases wired one-to-one to GraphQL mutations/resolvers in `src/graphql/workflowState.ts`; per codegraph, `GetTargetWorkflowStateUseCase`/`WorkflowState` are also the integration point consumed by `api-headless-cms-workflows` and `api-website-builder-workflows` (e.g. `DeleteWorkflowStateOnEntryAfterDelete.ts`, `DeleteWorkflowStateOnPageAfterDelete.ts`) to look up or cancel the workflow state tied to a content entry/page.
- `WorkflowState` (`src/domain/workflowState/WorkflowState.ts:33`) — the state-machine/permission-check domain object; constructed fresh per use case from the raw record, the caller's teams, and the caller's identity.
- GraphQL schema (`src/graphql/workflows.ts`, `src/graphql/workflowState.ts`) — `Query.workflows`/`Mutation.workflows` namespaces exposing `getWorkflow`/`listWorkflows`/`storeWorkflow`/`deleteWorkflow` and `startWorkflowStateStep`/`approveWorkflowStateStep`/`rejectWorkflowStateStep`/`takeOverWorkflowStateStep`; consumed by `app-workflows`'/`app-headless-cms-workflows`'s GraphQL gateways.

## Bugs

| # | Severity | Location (file:line) | Problem | Failure scenario | Confidence |
|---|----------|----------------------|---------|-------------------|------------|
| 1 | medium | `src/features/notifications/NotificationTransport/MailNotificationTransport.ts:15` (and `src/features/workflowState/StartWorkflowStateStep/events.ts`, `ApproveWorkflowStateStep/events.ts`, `RejectWorkflowStateStep/events.ts`) | The package defines `WorkflowStateStartStepHandler`/`WorkflowStateApproveStepHandler`-style event-handler abstractions and a working `MailNotificationTransport.send()`, and lets admins attach `notifications: [{id}]` to each step in the model (`src/domain/workflowState/stateModel.ts`), but no implementation of any of these handler abstractions is ever registered — a repo-wide grep for `NotificationTransport`/`.send(` outside this one file, and for the handler abstractions, turns up zero consumers in `api-workflows`, `api-headless-cms-workflows`, or `api-website-builder-workflows`. | An admin configures a workflow step to email the reviewing team when it becomes "in review" (or the requester when it's approved/rejected). The step transitions normally (event is published via `EventPublisher`), but because nothing subscribes to it and calls `transport.send()`, no e-mail is ever sent and no error or warning is logged anywhere — the feature silently does nothing. | high |
| 2 | low | `src/features/internal/GetUserTeams/GetUserTeamsUseCase.ts:16-23` | `execute()` calls `this.listUserTeams.execute(userId)` and reads `result.value` without checking `result.isFail()` first; it only special-cases failure inside an `if (result.isFail())` block that itself returns `Result.ok([])`, so the direct `.value` access on line "const teams = result.value.map(...)" is unreachable when failing today only because the current `ListUserTeamsUseCase` implementation never returns a failure. | If a future/alternate `ListUserTeamsUseCase` implementation (or a test double) ever returns `Result.fail(...)`, this code still executes `result.value.map(...)` after already having handled the fail branch above it in the same function — dead/contradictory branch, not exploitable today but a latent crash (`Cannot read properties of undefined`) if the invariant changes. | low |

## Duplication

jscpd reports 20 clones / 4.36% duplicated lines in this package, concentrated in two families:
- The four "act on the current step" use cases — `StartWorkflowStateStepUseCase.ts`, `ApproveWorkflowStateStepUseCase.ts`, `RejectWorkflowStateStepUseCase.ts`, `TakeOverWorkflowStateStepUseCase.ts` — repeat the same `getWorkflowState.execute → state.<transition>() → repository.execute(toRecord()) → eventPublisher.publish(...)` shape almost verbatim (jscpd flags pairwise clones of lines 8-36 across all four files). A shared `applyWorkflowStateTransition(id, fn, EventCtor)` helper would collapse this to one implementation.
- `CreateWorkflowUseCase.ts`/`UpdateWorkflowUseCase.ts` (and their `abstractions.ts`/repository counterparts) duplicate the same `ensureManageAccess()` permission check and repository-call shape (jscpd: lines 17-31 and 44-70); `DeleteWorkflowUseCase.ts:54-75` duplicates the same tail against `UpdateWorkflowUseCase.ts:51`.
- Within `src/domain/workflowState/WorkflowState.ts`, jscpd flags two internal near-clones (227-239 vs. 190, 280-287 vs. 212) — the `approveStep`/`rejectStep`/`updateStep` trio share near-identical `Object.assign(step, {...})` bodies that could be one parameterized helper.

## Dead code

None found beyond the unwired notifications path already covered in Bugs #1 (the abstractions/implementation exist and are registered in DI, so they aren't literally dead code — they're just never invoked at runtime).

## Convention issues

None of note — every feature folder consistently follows the repo's one-abstraction-per-file DI convention (`abstractions.ts` + `<Name>UseCase.ts`/`<Name>Repository.ts` + `feature.ts` + `index.ts`), and the top-level barrel (`src/index.ts`) exports only `WorkflowsFeature`, matching the minimal-barrel-export convention.

## Test gaps

- No test exercises the authorization boundary this audit specifically checked: there is no test asserting `WorkflowStateStepNotStepOwnerError` (a user who didn't start/take over the step tries to approve/reject it) or `WorkflowStateStepCannotReviewError` (a user not on any of the step's assigned teams tries to approve/reject/start/take over it) — `__tests__/WorkflowStateUseCases.test.ts` only covers the happy path and the "no step in review" failure. The logic reads as correct (see Summary), but the exact security-relevant branch has zero regression coverage.
- The notifications subsystem (`ListNotificationTypes`, `MailNotificationTransport`) has no test coverage at all, consistent with it never being invoked (Bugs #1).

## Recommendations

1. Wire an actual event handler (or remove the dead configuration surface) so that `notifications` configured on a workflow step actually triggers `NotificationTransport.send()` when a step starts/approves/rejects — right now the feature is configurable in the model but non-functional.
2. Add regression tests for `WorkflowStateStepNotStepOwnerError`/`WorkflowStateStepCannotReviewError` on `approve`/`reject`/`start`/`takeOver` — this is the exact authorization logic that prevents an unassigned user from approving/rejecting a step, and it currently has no test guarding against a future regression.
3. Extract the shared `get → transition → persist → publish` shape out of `Start/Approve/Reject/TakeOverWorkflowStateStepUseCase` into one helper to remove the ~4-way duplication flagged by jscpd.
