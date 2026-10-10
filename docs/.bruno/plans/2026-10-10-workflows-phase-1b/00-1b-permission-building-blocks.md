# Workflows Phase 1b: Permission Building Blocks and Viewer Flags

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the shared building blocks the app wrappers of phase 2 use (D132): one checker of the `workflows` permission (`editor`, `reassign`, full access), the current user's team lookup, a viewer built from the identity, and viewer flags (spec 5.3) computed from the review aggregate's own rules. The api-workflows use cases stay an internal engine: explicit actor, no identity reads, no permission checks.

**Architecture:** Pure domain code first. The `Review` aggregate gets a pure `check*` twin for every transition (start, take over, approve, reject, cancel, plus the reassign step rule), running the same private guard as the transition, so flags cannot drift from what the transitions allow. `getReviewViewerFlags(review, viewer)` in `domain/review` combines those checks with the permission rules the aggregate does not own (cancel by requester or `reassign`, reassign by `reassign`). `canPickReviewer(step)` in `domain/workflow` is shared by the flag and `Review.request`. DI building blocks read the identity: `WorkflowsPermissions` (over `IdentityContext`), `CurrentUserTeams` (over api-core `ListUserTeamsUseCase`, cached per request) and `CurrentReviewViewer` (actor + team ids + permission set). None of them is called by an api-workflows use case. The CMS "model is bindable" handler stops depending on the caller's model read access.

**Tech Stack:** TypeScript, `@webiny/feature` DI (`createFeature`, `createAbstraction`, `createImplementation`), `IdentityContext` and `ListUserTeamsUseCase` from `@webiny/api-core`, `GetModelRepository` from `@webiny/api-headless-cms`, `BaseError` / `Result` from `@webiny/feature/api`, vitest, `@webiny/api-headless-cms-testing` (`createCmsTestHandler`, `permissions` and `setup` params).

**Spec:** `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` (sections 5.1 "who", 5.3, 8). Decisions: `docs/.bruno/workflows/decisions.md` (D5, D9, D22, D25, D32, D33, D34, D54, D58, D61, D74, D77, D78, D89, D132). Roadmap: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` (phase 1b row). Phase 1a end state and its shared rules: `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md` (R1-R28, A1-A12 keep applying; this plan continues the numbering with R29-R39 and A13-A17).

## Global Constraints

- DI conventions: one abstraction or implementation per file; implementation file named after its class (no `implementation.ts`); export name matches the abstraction; types via namespace (`X.Interface`); no inline object types (extract named interfaces); minimal barrel exports (only what external consumers need).
- Before every commit, run from the repo root, in order: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, build the changed packages (`yarn build -p <package> 2>&1 | tail -30`), `git add .`. If any step changes something or fails and you fix it, rerun the chain from the start.
- Commit messages use Conventional Commits and end with exactly these two lines:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
  ```
- Never push, never amend.
- Test commands (from repo root): `yarn test <path>` (default storage), `yarn test:ddb <path>`, `yarn test:os <path>`, `yarn test:sql <path>`, `yarn test:pg:os <path>`. Cap output with `2>&1 | tail -50`. Run every storage the package's `ci.config.json` lists (`api-workflows`: ddb and ddb-os). OpenSearch is not available locally: run `yarn test:os` anyway, and if it cannot run, record "not run" in the task report and leave it to CI (A9).
- Use CodeGraph (`codegraph explore "<symbols>"`) before reading files to confirm symbols and import paths.
- No new package dependencies: `api-workflows` already depends on `@webiny/api-core` and `@webiny/api-mailer` (test only here); `api-headless-cms-workflows` already depends on `@webiny/api-headless-cms`.

## Review Focus

1. **Flags drift from the transitions** (spec 5.3, D5). A flag that says "Approve" for a step the transition then refuses, or the reverse, is the bug this phase exists to prevent. Every check runs the transition's own private guard (R31). Pinned by Task 2 "returns the same error as the start transition" and the per-check tests, and by Task 3 "agrees with the transitions for every review and viewer" (6 reviews × 5 viewers, comparing flags with `Review.fromData(data).<transition>()`).
2. **A check that records a fact or changes the review.** A check that pushes a fact would publish a phantom event on the next save. Pinned by Task 2 "records nothing and changes nothing" and Task 3 "does not change the review it reads".
3. **`workflows.*` treated as no access** (D54). The removed `ensureManageAccess` copies, and the remaining one in `ListNotificationTypesUseCase`, accepted only `*` and `editor`, because `getPermissions("workflows")` does not match `workflows.*`. Pinned by Task 1 "treats workflows.* as full access (D54)" and "lists notification types for workflows.* (full access, D54)".
4. **Several roles, one flag lost.** Each role yields its own `workflows` permission; one with `editor: true` and another with `reassign: true` must grant both, and `false` must never grant. Pinned by Task 1 "merges actions from several workflows permissions (one per role)" and "does not grant an action whose flag is false".
5. **An AI actor counted as the requester** (D58). AI and automation owners carry the requester's id, so an id-only comparison would let an AI actor cancel as the requester, or make the requester look like the owner. Pinned by Task 2 "treats only the requesting user as the requester" and Task 3 "offers no take over or reassign on an AI step (D9, D33)".
6. **Reassign offered on an AI step or a finished review** (D33). Pinned by Task 2 "does not allow reassign on an AI step, a stale step or a finished review" and Task 3 "offers nothing on a %s review, not even restart".
7. **Team cache answers for the wrong identity or remembers a failure.** `withIdentity` can switch the identity mid-request; a failed lookup must not stick for the rest of the request. Pinned by Task 4 "keys the cache by identity", "returns no teams for a failed lookup and does not cache it" and "returns no teams for an anonymous identity without a lookup".
8. **The engine refuses a caller for a CMS permission it does not need** (D132, carry-over from the 1a review). Pinned by Task 5 "checks the model without the caller's model read access (D132)" and "binds a publishable model without the caller's model read access (D132)".

Not pinnable in 1b: target access. No flag includes read or write access to the target (R33); phase 2 wrappers must AND it. Reviewers of phase 2 must check every wrapper for it.

## Rulings

Binding for this plan. Where they refine the spec, the ruling wins for phase 1b.

- R29. **Checker shape.** `WorkflowsPermissions` is its own abstraction (`isFullAccess`, `canEdit`, `canReassign`, `getPermissionSet`) over `IdentityContext`, not `createPermissionsAbstraction` from api-core (used by `BackgroundTaskPermissions`, `WbPermissions`, and app-workflows' admin `WorkflowsPermissions`). Reason: the factory's interface is entity-based (`canEdit(entityId)` means `rwd` contains `w`, custom actions go through string-typed `canAction(action, entityId)`) and cannot answer "is this full access"; the `workflows` permission is one flat permission with custom boolean actions (spec 8). The folder layout (`features/permissions/WorkflowsPermissions/{abstractions,feature,index}.ts`) and the name follow those packages. Semantics mirror `SchemaPermissions`: full access when `getPermission("workflows.*")` matches (that also matches `*`, and returns `*` when authorization is disabled); an action is granted with full access or when any `workflows` permission has the flag `=== true`. Registered transient without a cache (`IdentityContext` caches permissions per identity; `withIdentity` can switch it). Permission shape: `{ name: "workflows", editor?: true, reassign?: true }`, full access `workflows.*`; phase 9c's admin schema must emit exactly this (today's admin schema has `fullAccess: { editor: true }` and no `reassign`).
- R30. The last copied check, `ListNotificationTypesUseCase.ensureAccess`, is replaced by `WorkflowsPermissions.canEdit()` (spec 8: one checker replaces the copies). Notifications otherwise stay untouched until phase 7.
- R31. **Flags reuse the aggregate's guards.** Each transition's guard is a private method returning the step it acts on; the transition and its public `check*` twin both call it, and the check drops the step. Rejected alternatives: running the transitions on a `Review.fromData` copy (needs a fake `now`, records facts, one clone per flag); extracting free predicate functions out of `Review.ts` (splits the rules from the state they read and still leaves two call sites per rule). `checkReassign` is added now for the flag; phase 4's reassign transition must use `guardReassign`.
- R32. **Who may cancel or reassign is a permission rule, not a domain rule.** The aggregate does not check it (engine, D132): cancel stays "any actor while in progress", reassign has no transition yet. `getReviewViewerFlags` applies it (cancel: requester or `reassign`, D25/D54; reassign: `reassign`, D33), and the app wrappers authorize cancel and reassign by `canCancel` / `canReassign` from the same function, so check and flag cannot drift. AI and automation callers (phase 5) skip it, per D132.
- R33. **Target access is not in the flags.** Spec 5.1 needs read access for start, take over, approve and reject, and write access for request (D77). That check belongs to the app wrappers (phase 2) and is ANDed into every flag and every action there. Documented on `ReviewViewerFlags`.
- R34. `canRestart` is always `false`: failed steps do not exist until phase 5. The flag stays in `ReviewViewerFlags` so the shape does not change; phase 5 sets it to "current step failed, and requester or `reassign`" (D34).
- R35. `canPick` is `canPickReviewer(step)`: a `review` step whose config has `allowManualPick: true`. It needs only the workflow. `Review.request` uses the same function for its pick check. Request-time conditions (write access to the target D77, which users may be picked D33/D61) are phase 2 and phase 4.
- R36. **Teams.** `CurrentUserTeams.getTeamIds()` over api-core `ListUserTeamsUseCase` (it runs without authorization), singleton in the request container like the removed `GetUserTeams`, cache keyed by identity id. Anonymous identity: `[]` without a lookup. Failed lookup: `[]` (fail closed: no teams, no review rights), not cached. Not gated on the `advancedAccessControlLayer.teams` flag (the old lookup was not; workflow steps always use teams).
- R37. **Viewer.** `CurrentReviewViewer.get()` returns `ReviewViewer { actor, teamIds, permissions }` with actor `{ type: "user", id, displayName, identityType: identity.type }`, or `Workflows/NotAuthenticated` for an anonymous identity. Wrappers use `actor` and `teamIds` as the input of the internal use cases and the whole viewer for flags. Not cached itself; its parts are.
- R38. **CMS bindable-model check reads through `GetModelRepository`** (exported from the CMS `GetModel` index; the repository `GetModelUseCase` delegates to, without `AccessControl`). Under D132 the engine does not depend on the caller's CMS permissions; `editor` is the wrapper's check. Same messages and codes; persistence errors still propagate. Rejected alternative: `identityContext.withoutAuthorization(() => getModel.execute(id))` (wider than needed, and hides the intent at the call site).
- R39. **`actor` on workflow events moves from 1b to phase 2** (1a R26 said 1b). Under D132 the wrappers build the actor; adding `actor` to `StoreWorkflowUseCase` / `DeleteWorkflowUseCase` input and their events belongs with them, and doing it now would touch every 1a workflow test without a caller. Task 6 updates R26 and the roadmap.

## Assumptions

Flag in review if wrong.

- A13. An identity whose authorization is disabled (`withoutAuthorization`) counts as full access in `WorkflowsPermissions` (the checker follows `IdentityContext.getPermission`). Internal callers that run without authorization are trusted.
- A14. The requester is always a user in v1, so `Review.isRequestedBy` is "`type === "user"` and the requester's id".
- A15. A caller with only `{ name: "workflows", editor: true }` reaches the CMS before-save handler through `StoreWorkflowUseCase` (the workflow model is private and skips model authorization). Task 5 step 2's expected failure (`Cms/Model/NotAuthorized` from the handler) proves it; any other failure there means the D132 premise needs a look before going on.
- A16. `ListUserTeamsUseCase` answers only for admin users; other identities (API keys) get `UserNotFound`, so `CurrentUserTeams` returns `[]` for them and they cannot review.
- A17. Phase 3 decides how D89 (assignment reasons only for `editor` or `reassign`) reads the permission set; 1b only provides `getPermissionSet()`.

## Task order

1. The permission checker first: Task 3's viewer type and Task 4's viewer need `WorkflowsPermissionSet`.
2. Aggregate checks: pure refactor of `Review.ts`, before anything reads them.
3. Viewer flags and the pick predicate: pure, on top of Task 2.
4. Team lookup and viewer: DI glue that needs Tasks 1 and 3.
5. The CMS carry-over fix: independent, in another package; placed after the api-workflows tasks so one build of `api-workflows` serves it.
6. Docs and comments last, so they describe what landed (incl. R39).

Every task leaves both packages building and green.

## File map

New and changed files in `packages/api-workflows`:

```
src/
  types.ts                                   IWorkflowsSecurityPermission: editor?, reassign? (Task 1)
  WorkflowsFeature.ts                        registers the building blocks (Tasks 1, 4)
  domain/
    permissions/  types.ts (Task 1)  errors.ts (Task 4)
    review/       Review.ts (Tasks 2, 3)  errors.ts (Task 2)  types.ts (Task 3)
                  getReviewViewerFlags.ts (Task 3)
    workflow/     canPickReviewer.ts (Task 3)
  features/
    permissions/WorkflowsPermissions/  abstractions.ts  WorkflowsPermissions.ts  feature.ts  index.ts (Task 1)
    identity/CurrentUserTeams/         abstractions.ts  CurrentUserTeams.ts  feature.ts  index.ts (Task 4)
    identity/CurrentReviewViewer/      abstractions.ts  CurrentReviewViewer.ts  feature.ts  index.ts (Task 4)
    notifications/ListNotificationTypes/ListNotificationTypesUseCase.ts (Task 1)
    settings/*, review/*, workflow/*   comment-only edits (Task 6)
__tests__/
  __helpers/FakeListUserTeams.ts (Task 4)
  permissions/WorkflowsPermissions.test.ts (Task 1)
  notifications/ListNotificationTypes.test.ts (Task 1)
  domain/Review.checks.test.ts (Task 2)
  domain/canPickReviewer.test.ts  domain/getReviewViewerFlags.test.ts (Task 3)
  identity/CurrentUserTeams.test.ts  identity/CurrentReviewViewer.test.ts (Task 4)
  registration.test.ts (Tasks 1, 4)  types.test.ts (Task 1)
```

In `packages/api-headless-cms-workflows`: `src/features/Workflows/assertModelsBindable.ts`, both `DisallowUnpublishableModelsOn*` handlers, `__tests__/workflows/disallowUnpublishableModels.test.ts` (Task 5).

Docs: `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md`, `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` (Task 6).

Exports for other packages (deep imports, as the CMS package already does for `StoreWorkflow`): `@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js`, `.../features/identity/CurrentUserTeams/index.js`, `.../features/identity/CurrentReviewViewer/index.js`, `.../domain/review/getReviewViewerFlags.js`, `.../domain/workflow/canPickReviewer.js`, types from `.../domain/review/types.js` and `.../domain/permissions/types.js`. Each `index.ts` exports only the abstraction; `WorkflowsFeature` imports `feature.ts` directly.

## Task files

| # | File | Title |
|---|---|---|
| 1 | `task-01-workflows-permissions.md` | Shared workflows permission checker |
| 2 | `task-02-review-transition-checks.md` | Review aggregate transition checks |
| 3 | `task-03-viewer-flags.md` | Viewer flags and the pick predicate |
| 4 | `task-04-current-user-teams-and-viewer.md` | Current user's teams and review viewer |
| 5 | `task-05-bindable-models-without-read-access.md` | Check bindable CMS models without the caller's model access |
| 6 | `task-06-align-docs-with-d132.md` | Align the 1a rules, the roadmap and code comments with D132 |

Executing: pass this file as `PLAN_FILE` and give each task file to `task-brief` with an explicit output path, e.g. `task-brief docs/.bruno/plans/2026-10-10-workflows-phase-1b/task-02-review-transition-checks.md 2 <workspace>/task-2-brief.md`. Reviewers get the Global Constraints, the Rulings relevant to the task and `../2026-10-09-workflows-phase-1a/00-shared.md` R6, R17, R26.

## Done when

All six tasks reviewed clean, a final review of the phase clean, `yarn test packages/api-workflows` and `yarn test packages/api-headless-cms-workflows` green, `yarn test:os` recorded as not run locally. Stop for the user.

---

## Self-review

### Spec coverage

| Spec requirement | Where |
|---|---|
| 8: one `workflows` permission with `editor`, `reassign`, full access (`*`, `workflows.*`) | Task 1 (`WorkflowsPermissions`, `IWorkflowsSecurityPermission`, R29) |
| 8: one shared checker replaces the copied `ensureManageAccess` functions | Task 1 (checker; last copy in `ListNotificationTypesUseCase` replaced, R30) |
| 8, D132: checker is a building block; checks run in the app wrappers | Tasks 1, 4 (no api-workflows use case calls them), Task 6 (rules and comments) |
| 5.1, D132: transitions take an explicit actor and never read identity | Task 2 (checks are pure; no `IdentityContext` in `domain/`) |
| D132: current user's team lookup | Task 4 (`CurrentUserTeams`, R36) |
| D132: viewer-flag computation from actor, teams, permissions and review | Task 3 (`getReviewViewerFlags`), Task 4 (`CurrentReviewViewer`, R37) |
| 5.3: `canStart`, start rules (member of `candidateTeamIds`, not requester, user) | Task 2 `checkStart`, Task 3 |
| 5.3, D32: `canTakeOver` (member, not requester, not current owner, human step only, D9) | Task 2 `checkTakeOver`, Task 3 |
| 5.3: `canApprove`, `canReject` (owner only) | Task 2 `checkApprove` / `checkReject`, Task 3 |
| 5.3, D25, D54: `canCancel` (requester or `reassign`, not on approved/rejected/cancelled) | Task 2 `checkCancel`, `isRequestedBy`; Task 3 (R32) |
| 5.3, D33: `canReassign` (`reassign`, step `awaiting` or human `inReview`) | Task 2 `checkReassign`, `ReviewStepNotReassignableError`; Task 3 |
| 5.3, D34: `canRestart` | Task 3 (always `false` until phase 5, R34) |
| 5.3, D22: `canPick` per step at submit | Task 3 (`canPickReviewer`, shared with `Review.request`, R35) |
| D58: AI and automation actors carry the requester's id but are not the requester | Task 2 (`isRequestedBy`), Task 3 |
| 1a review carry-over: `assertModelsBindable` throws `ModelNotAuthorized` for an editor without model read access | Task 5 (R38) |
| D132: 1a rules that read wrong ("checks in 1b", `actor` on workflow events in 1b) | Task 6 (R6, R26, Not in this phase; roadmap cross-phase rule; R39) |

### Not in this phase

- App wrapper use cases per app (CMS, Website Builder) that read the identity, build the actor and team ids, check `editor`, cancel and reassign by the flags, and check target access before calling the internal use cases (2).
- `actor` on the workflow use case input and events (2, R39).
- Target read and write access checks: start, take over, approve, reject need read access; request needs write access (D77); candidates must read the target (D61) (2 wrappers and adapters, 4 routing).
- GraphQL for every operation, including viewer flags on review reads and list rows, app-neutral operations (settings, `listUsers`, step types, notification transports) with their `editor` checks, query permissions (D78) and which assignment reasons a viewer sees (D89) (3).
- Routing, candidates, reassign transition (using `guardReassign`), pick validation against candidates and exclusions (D33, D61), `listStepCandidates` (D128) (4).
- Failed steps, restart and a real `canRestart` (5).
- Security admin UI for the "custom" workflows access level with `editor` and `reassign` checkboxes, matching R29's permission shape (9c).
