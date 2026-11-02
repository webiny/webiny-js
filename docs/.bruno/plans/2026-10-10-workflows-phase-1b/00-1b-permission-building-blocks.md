# Workflows Phase 1b: Permission Building Blocks and Viewer Flags

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Status note (after phase 2):** the app wrappers, target access checks, `actor` on workflow events and `canUserRead` landed in phase 2 (`docs/.bruno/plans/2026-10-11-workflows-phase-2/`); the "Not in this phase" items marked (2) are done there.

**Goal:** Ship the shared building blocks the app wrappers of phase 2 use (D132): one checker of the `workflows` permission (`editor`, `reassign`, full access), the current user's team lookup, a viewer built from the identity, and viewer flags (spec 5.3) computed from the review aggregate's own rules. The api-workflows use cases stay an internal engine: explicit actor, no identity reads, no permission checks.

**Architecture:** Pure domain code first. The `Review` aggregate gets a pure `check*` twin for every transition (start, take over, approve, reject, cancel, plus the reassign step rule), running the same private guard as the transition, so flags cannot drift from what the transitions allow. The permission rules the aggregate does not own are permission-only predicates in `domain/review`: `canCancelByPermission` (requester or `reassign`) and `canReassignByPermission` (`reassign`). The app wrappers authorize with them and leave state errors to the engine; `getReviewViewerFlags(review, viewer)` ANDs them with the aggregate's checks, so flag and wrapper share one rule. `canPickReviewer(step)` in `domain/workflow` is shared by the flag and `Review.request`. DI building blocks read the identity: `WorkflowsPermissions` (over `IdentityContext`), `CurrentUserTeams` (over api-core `ListUserTeamsUseCase`, cached per request) and `CurrentReviewViewer` (`getActor()` alone, or actor + team ids + permission set; API keys act as `user` actors, D133). None of them is called by an api-workflows use case, and after Task 1 no api-workflows use case reads identity: `ListNotificationTypesUseCase` loses its copied `editor` check (D133). The CMS "model is bindable" handler stops depending on the caller's model read access.

**Tech Stack:** TypeScript, `@webiny/feature` DI (`createFeature`, `createAbstraction`, `createImplementation`), `IdentityContext` and `ListUserTeamsUseCase` from `@webiny/api-core`, `GetModelRepository` from `@webiny/api-headless-cms`, `BaseError` / `Result` from `@webiny/feature/api`, vitest, `@webiny/api-headless-cms-testing` (`createCmsTestHandler`, `permissions` and `setup` params).

**Spec:** `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` (sections 5.1 "who", 5.3, 8). Decisions: `docs/.bruno/workflows/decisions.md` (D5, D9, D22, D25, D30, D32, D33, D34, D54, D58, D61, D74, D77, D78, D89, D132, D133). Roadmap: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` (phase 1b row). Phase 1a end state and its shared rules: `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md` (R1-R28, A1-A12 keep applying; this plan continues the numbering with R29-R44 and A13-A18).

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
3. **`workflows.*` treated as no access** (D54). The removed `ensureManageAccess` copies, and the last one in `ListNotificationTypesUseCase` (removed by Task 1, R40), accepted only `*` and `editor`, because `getPermissions("workflows")` does not match `workflows.*`. Pinned by Task 1 "treats workflows.* as full access (D54)".
4. **Several roles, one flag lost.** Each role yields its own `workflows` permission; one with `editor: true` and another with `reassign: true` must grant both, and `false` must never grant. Pinned by Task 1 "merges actions from several workflows permissions (one per role)" and "does not grant an action whose flag is false".
5. **An AI actor counted as the requester** (D58). AI and automation owners carry the requester's id, so an id-only comparison would let an AI actor cancel as the requester, or make the requester look like the owner. Pinned by Task 2 "treats only the requesting user as the requester" and Task 3 "offers no take over or reassign on an AI step (D9, D33)".
6. **Reassign offered on an AI step or a finished review** (D33). Pinned by Task 2 "does not allow reassign on an AI step, a stale step or a finished review" and Task 3 "offers nothing on a %s review, not even restart".
7. **Team cache answers for the wrong identity or remembers a failure.** `withIdentity` can switch the identity mid-request; a failed lookup must not stick for the rest of the request. Pinned by Task 4 "keys the cache by identity", "returns no teams for a failed lookup and does not cache it" and "returns no teams for an anonymous identity without a lookup".
8. **The engine throws or refuses a caller for a CMS permission it does not need** (D132, carry-over from the 1a review). Pinned by Task 5 "fails validation, not a throw, for a model the caller cannot access (R38)" and "maps a model access failure to a validation error (R38)". The same for the engine's own permission check: Task 1 "lists the registered transports without a workflows permission" (R40).
9. **A wrapper answers "not authorized" for a state error** (R41). Mixing permission and state in one predicate would hide the engine's `InvalidState` behind a permission error. Pinned by Task 3 "ignores the review state, which the engine reports (R41)" and "refuses other users, editors and AI actors carrying the requester's id (D58)".
10. **API keys refused, or given review rights they lack** (D133). Pinned by Task 4 "lets an API key act as a user actor without teams (D133)" and "fails for an anonymous identity".

Not pinnable in 1b: target access. No flag includes read or write access to the target (R33); phase 2 wrappers must AND it. Reviewers of phase 2 must check every wrapper for it, and each wrapper needs its own tests for "refuses cancel by a non-requester without `reassign`", "refuses cancel and restart without read access to the target" and "refuses every action for a user without read access to the target".

## Rulings

Binding for this plan. Where they refine the spec, the ruling wins for phase 1b.

- R29. **Checker shape.** `WorkflowsPermissions` is its own abstraction (`isFullAccess`, `canEdit`, `canReassign`, `getPermissionSet`) over `IdentityContext`, not `createPermissionsAbstraction` from api-core (used by `BackgroundTaskPermissions`, `WbPermissions`, and app-workflows' admin `WorkflowsPermissions`). Reason: the factory's interface is entity-based (`canEdit(entityId)` means `rwd` contains `w`, custom actions go through string-typed `canAction(action, entityId)`) and cannot answer "is this full access"; the `workflows` permission is one flat permission with custom boolean actions (spec 8). The folder layout (`features/permissions/WorkflowsPermissions/{abstractions,feature,index}.ts`) and the name follow those packages. Semantics mirror `SchemaPermissions`: full access when `getPermission("workflows.*")` matches (that also matches `*`, and returns `*` when authorization is disabled); an action is granted with full access or when any `workflows` permission has the flag `=== true`. Registered transient without a cache (`IdentityContext` caches permissions per identity; `withIdentity` can switch it). Permission shape: `{ name: "workflows", editor?: true, reassign?: true }`, full access `workflows.*`; phase 9c's admin schema must emit exactly this (today's admin schema has `fullAccess: { editor: true }` and no `reassign`).
- R30. Superseded by R40 (D133): the last copied check is removed, not replaced.
- R31. **Flags reuse the aggregate's guards.** Each transition's guard is a private method returning the step it acts on; the transition and its public `check*` twin both call it, and the check drops the step. Rejected alternatives: running the transitions on a `Review.fromData` copy (needs a fake `now`, records facts, one clone per flag); extracting free predicate functions out of `Review.ts` (splits the rules from the state they read and still leaves two call sites per rule). `checkReassign` is added now for the flag; phase 4's reassign transition must use `guardReassign`.
- R32. **Who may cancel or reassign is a permission rule, not a domain rule.** The aggregate does not check it (engine, D132): cancel stays "any actor while in progress", reassign has no transition yet. How the rule is shared between flags and wrappers: R41. AI and automation callers (phase 5) skip it, per D132.
- R33. **Target access is not in the flags.** Spec 5.1 needs read access for start, take over, approve, reject, cancel and restart (cancel and restart decided 2026-10-11), and write access for request (D77). That check belongs to the app wrappers (phase 2) and is ANDed into every flag and every action there. Documented on `ReviewViewerFlags`.
- R34. `canRestart` is always `false`: failed steps do not exist until phase 5. The flag stays in `ReviewViewerFlags` so the shape does not change; phase 5 sets it to "current step failed, and requester or `reassign`" (D34). Done in phase 5 (R131-R158).
- R35. `canPick` is `canPickReviewer(step)`: a `review` step whose config has `allowManualPick: true`. It needs only the workflow. `Review.request` uses the same function for its pick check. Request-time conditions (write access to the target D77, which users may be picked D33/D61) are phase 2 and phase 4.
- R36. **Teams.** `CurrentUserTeams.getTeamIds()` over api-core `ListUserTeamsUseCase` (it runs without authorization), singleton in the request container like the removed `GetUserTeams`, cache keyed by identity id. Anonymous identity: `[]` without a lookup. Failed lookup: `[]` (fail closed: no teams, no review rights), not cached. Not gated on the `advancedAccessControlLayer.teams` flag (the old lookup was not; workflow steps always use teams).
- R37. **Viewer** (refined by R42). `CurrentReviewViewer.get()` returns `ReviewViewer { actor, teamIds, permissions }` with actor `{ type: "user", id, displayName, identityType: identity.type }`, or `Workflows/NotAuthenticated` for an anonymous identity. Wrappers use `actor` and `teamIds` as the input of the internal use cases and the whole viewer for flags. Not cached itself; its parts are.
- R38. **CMS bindable-model check maps `NotAuthorized` to a validation error** (amended 2026-10-11: map NotAuthorized to validation, no elevation; binding requires model read access). `assertModelsBindable` keeps `GetModelUseCase` and turns `Cms/Model/NotAuthorized` into `WorkflowValidationError` (`You don't have access to the model "<id>".`), so nothing is thrown out of `StoreWorkflowUseCase`. Code-defined models the caller cannot access are hidden by the CMS and report as not found. Rejected: `GetModelRepository` (`ModelsFetcher` still filters plugin models by access, so it does not help) and `identityContext.withoutAuthorization(...)` (could fill the tenant-keyed CMS model cache with an unfiltered list). `editor` stays the wrapper's check.
- R39. **`actor` on workflow events moves from 1b to phase 2** (1a R26 said 1b). Under D132 the wrappers build the actor, and D133 makes workflow store and delete per-app wrappers (e.g. `StoreWebsiteBuilderPageWorkflow`) in phase 2; adding `actor` to `StoreWorkflowUseCase` / `DeleteWorkflowUseCase` input and their events belongs with them, and doing it now would touch every 1a workflow test without a caller. Task 6 updates R26; the roadmap's phase 2 row already says so.
- R40. **The engine drops its last permission check** (D133, supersedes R30). `ListNotificationTypesUseCase` loses its copied `editor` check instead of calling `WorkflowsPermissions`: under D132 no api-workflows use case reads identity or checks permissions. The shared transports operation (phase 3/7) checks `editor`. `NotificationAuthorizedError` and `IListNotificationTypesUseCaseErrors` go with the check (no other user). The use case has no caller today (1a R14 removed its GraphQL query), so nothing is opened up.
- R41. **Permission-only predicates** (supersedes R32's sharing rule). `canCancelByPermission(review, viewer)` (requesting user, or `reassign` / full access; D25, D54) and `canReassignByPermission(viewer)` (`reassign` / full access; D33) live in `domain/review`, take a `ReviewPermissionViewer` (actor + permission set, no teams) and never read the review's state. The app wrappers authorize cancel and reassign with them, then call the engine, which reports state errors (`Workflows/Review/InvalidState`, `StepNotReassignable`, `StepNotCurrent`). `getReviewViewerFlags` ANDs the same predicates with `checkCancel` / `checkReassign`, so flag and wrapper share one rule and a wrapper never turns a state error into "not authorized". Phase 5 adds the restart predicate on the same pattern (requester or `reassign`, D34). Rejected: wrappers authorizing with the `canCancel` / `canReassign` flags (mixes state into the permission answer).
- R42. **Viewer for every authenticated identity** (D133, refines R37). Every non-anonymous identity becomes a `user` actor with `identityType: identity.type`; for API keys that is `"api-key"` (api-core `ApiKeyAuthenticator` builds the identity with `type: "api-key"`). Only an anonymous identity gets `Workflows/NotAuthenticated`. `CurrentReviewViewer.getActor()` reads only the identity, for wrappers that need just the actor (request, workflow store and delete); `get()` adds team ids and the permission set. Decided: one abstraction with two methods rather than a lazy team list inside `ReviewViewer` (a lazy field would make the pure flag code async) or a separate actor abstraction (two places building the same actor). Wrappers that need actor and permissions without teams (cancel, reassign) may call `getActor()` plus `WorkflowsPermissions.getPermissionSet()`, or `get()` (the team lookup is cached per request).
- R43. **Scope of the wrappers under D133.** No cross-app reviews: each app's wrappers handle only that app's namespaces. The shared configuration operations (settings, `listUsers`, step types, notification transports, automation definitions, AI tools) are the only api-workflows operations exposed outside the backend and check `editor` alone with `WorkflowsPermissions`. `inspectRouting`, `folderExists` and `listStepCandidates` are per app. The engine touches identity only for candidates' read access through the app's target adapter (phase 4) and `withIdentity(requester)` around task triggers (phase 5). Task 6's comments follow this.
- R44. **Small consistency fixes.** `canPickReviewer` compares with `REVIEW_STEP_TYPE` (`domain/workflow/WorkflowValidator.ts`) instead of the literal `"review"`; `ReviewStepNotReassignableError` gets its own `ReviewStepNotReassignableErrorData` instead of reusing the take-over error's data type.

## Assumptions

Flag in review if wrong.

- A13. An identity whose authorization is disabled (`withoutAuthorization`) counts as full access in `WorkflowsPermissions` (the checker follows `IdentityContext.getPermission`). Internal callers that run without authorization are trusted.
- A14. The requester is always a user in v1, so `Review.isRequestedBy` is "`type === "user"` and the requester's id".
- A15. A caller with only `{ name: "workflows", editor: true }` reaches the CMS before-save handler through `StoreWorkflowUseCase` (the workflow model is private and skips model authorization). Confirmed in Task 5: the handler runs and the model lookup then reports not found for a code-defined model (amended 2026-10-11, R38).
- A19. The CMS `ModelsFetcher.fetchAll` caches the merged model list under a tenant-only key while the plugin part is filtered by the first caller's access. That pre-existing CMS issue is out of scope for phase 1b.
- A16. `ListUserTeamsUseCase` answers only for admin users; other identities (API keys) get `UserNotFound`, so `CurrentUserTeams` returns `[]` for them. Under D133 they still act as `user` actors: they cannot start or take over pool steps (no team), but can request, cancel their own review and act where `reassign` suffices.
- A17. Phase 3 decides how D89 (assignment reasons only for `editor` or `reassign`) reads the permission set; 1b only provides `getPermissionSet()`. Per D133 the engine returns full data and the wrapper redacts. Settled in phase 3: the get-review wrappers pass `viewer.permissions` to the pure `redactAssignmentRecords` (R96).
- A18. An API key identity has `type: "api-key"` (`packages/api-core/src/features/security/apiKeys/ApiKeyAuthenticator.ts`), so `identity.type` is the `identityType` D133 asks for; no mapping is needed.

## Task order

1. The permission checker first: Task 3's viewer types and Task 4's viewer need `WorkflowsPermissionSet`. Task 1 also removes the engine's last permission check (R40).
2. Aggregate checks: pure refactor of `Review.ts`, before anything reads them.
3. Permission-only predicates, viewer flags and the pick predicate: pure, on top of Task 2.
4. Team lookup and viewer: DI glue that needs Tasks 1 and 3.
5. The CMS carry-over fix: independent, in another package; placed after the api-workflows tasks so one build of `api-workflows` serves it.
6. Docs and comments last, so they describe what landed (incl. R39, R43).

Every task leaves both packages building and green.

## File map

New and changed files in `packages/api-workflows`:

```
src/
  types.ts                                   IWorkflowsSecurityPermission: editor?, reassign? (Task 1)
  WorkflowsFeature.ts                        registers the building blocks (Tasks 1, 4); comment (Task 6)
  domain/
    notifications/ errors.ts deleted (Task 1)
    permissions/  types.ts (Task 1)  errors.ts (Task 4; also `WorkflowsNotAuthorizedError`, final fix wave)
    review/       Review.ts (Tasks 2, 3)  errors.ts (Task 2)  types.ts (Task 3)
                  canCancelByPermission.ts  canReassignByPermission.ts  getReviewViewerFlags.ts (Task 3)
    workflow/     canPickReviewer.ts (Task 3)
  features/
    permissions/WorkflowsPermissions/  abstractions.ts  WorkflowsPermissions.ts  feature.ts  index.ts (Task 1)
    identity/CurrentUserTeams/         abstractions.ts  CurrentUserTeams.ts  feature.ts  index.ts (Task 4)
    identity/CurrentReviewViewer/      abstractions.ts  CurrentReviewViewer.ts  feature.ts  index.ts (Task 4)
    notifications/ListNotificationTypes/  ListNotificationTypesUseCase.ts  abstractions.ts  index.ts (Task 1)
    settings/*, review/*, workflow/*   comment-only edits (Task 6)
__tests__/
  __helpers/FakeListUserTeams.ts  fixtures.ts (Task 4)
  permissions/WorkflowsPermissions.test.ts (Task 1)
  notifications/ListNotificationTypes.test.ts (Task 1)
  domain/Review.checks.test.ts (Task 2)
  domain/canPickReviewer.test.ts  domain/reviewPermissionPredicates.test.ts
  domain/getReviewViewerFlags.test.ts (Task 3)
  identity/CurrentUserTeams.test.ts  identity/CurrentReviewViewer.test.ts (Task 4)
  registration.test.ts (Tasks 1, 4)  types.test.ts (Task 1)
```

In `packages/api-headless-cms-workflows`: `src/features/Workflows/assertModelsBindable.ts`, both `DisallowUnpublishableModelsOn*` handlers, `__tests__/workflows/disallowUnpublishableModels.test.ts` (Task 5); `src/CmsWorkflowsFeature.ts` comment (Task 6).

In `packages/api-website-builder-workflows`: `src/WebsiteBuilderWorkflowsFeature.ts` comment (Task 6).

Docs: `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md` (Task 6). The roadmap, spec, decision log and UI brief were aligned with D132 and D133 together with this plan.

Exports for other packages (deep imports, as the CMS package already does for `StoreWorkflow`): `@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js`, `.../features/identity/CurrentUserTeams/index.js`, `.../features/identity/CurrentReviewViewer/index.js`, `.../domain/review/getReviewViewerFlags.js`, `.../domain/review/canCancelByPermission.js`, `.../domain/review/canReassignByPermission.js`, `.../domain/workflow/canPickReviewer.js`, types from `.../domain/review/types.js` and `.../domain/permissions/types.js`. Each `index.ts` exports only the abstraction; `WorkflowsFeature` imports `feature.ts` directly.

## Task files

| # | File | Title |
|---|---|---|
| 1 | `task-01-workflows-permissions.md` | Shared workflows permission checker |
| 2 | `task-02-review-transition-checks.md` | Review aggregate transition checks |
| 3 | `task-03-viewer-flags.md` | Viewer flags and the pick predicate |
| 4 | `task-04-current-user-teams-and-viewer.md` | Current user's teams and review viewer |
| 5 | `task-05-bindable-models-without-read-access.md` | Map model access failures to a validation error |
| 6 | `task-06-align-docs-with-d132.md` | Align the 1a rules and code comments with D132 and D133 |

Executing: pass this file as `PLAN_FILE` and give each task file to `task-brief` with an explicit output path, e.g. `task-brief docs/.bruno/plans/2026-10-10-workflows-phase-1b/task-02-review-transition-checks.md 2 <workspace>/task-2-brief.md`. Reviewers get the Global Constraints, the Rulings relevant to the task and `../2026-10-09-workflows-phase-1a/00-shared.md` R6, R17, R26, plus D132 and D133 from the decision log.

## Done when

All six tasks reviewed clean, a final review of the phase clean, `yarn test packages/api-workflows` and `yarn test packages/api-headless-cms-workflows` green, `yarn test:os` recorded as not run locally. Stop for the user.

---

## Self-review

### Spec coverage

| Spec requirement | Where |
|---|---|
| 8: one `workflows` permission with `editor`, `reassign`, full access (`*`, `workflows.*`) | Task 1 (`WorkflowsPermissions`, `IWorkflowsSecurityPermission`, R29) |
| 8: one shared checker replaces the copied `ensureManageAccess` functions | Task 1 (checker; last copy in `ListNotificationTypesUseCase` removed, R40) |
| 8, D132: checker is a building block; checks run in the app wrappers | Tasks 1, 4 (no api-workflows use case calls them or reads identity), Task 6 (rules and comments) |
| D133 point 6: `ListNotificationTypesUseCase` drops its `editor` check | Task 1 (R40) |
| D133 point 5: API keys act as `user` actors with `identityType: "api-key"` | Task 4 (`CurrentReviewViewer`, R42, A16, A18) |
| D133 points 1-4: per-app wrappers, shared configuration operations, engine identity touch points | Task 6 (1a rules and comments, R43); roadmap, spec and UI brief updated with this plan |
| 5.1, D132: transitions take an explicit actor and never read identity | Task 2 (checks are pure; no `IdentityContext` in `domain/`) |
| D132: current user's team lookup | Task 4 (`CurrentUserTeams`, R36) |
| D132: viewer-flag computation from actor, teams, permissions and review | Task 3 (`getReviewViewerFlags`), Task 4 (`CurrentReviewViewer`, R37) |
| 5.3: `canStart`, start rules (member of `candidateTeamIds`, not requester, user) | Task 2 `checkStart`, Task 3 |
| 5.3, D32: `canTakeOver` (member, not requester, not current owner, human step only, D9) | Task 2 `checkTakeOver`, Task 3 |
| 5.3: `canApprove`, `canReject` (owner only) | Task 2 `checkApprove` / `checkReject`, Task 3 |
| 5.3, D25, D54: `canCancel` (requester or `reassign`, not on approved/rejected/cancelled) | Task 2 `checkCancel`, `isRequestedBy`; Task 3 (`canCancelByPermission`, R41) |
| 5.3, D33: `canReassign` (`reassign`, step `awaiting` or human `inReview`) | Task 2 `checkReassign`, `ReviewStepNotReassignableError`; Task 3 (`canReassignByPermission`, R41) |
| 5.1, D132: wrappers authorize cancel and reassign by permission and leave state errors to the engine | Task 3 (permission-only predicates, R41) |
| 5.3, D34: `canRestart` | Task 3 (always `false` until phase 5, R34); done in phase 5 (R131-R158). |
| 5.3, D22: `canPick` per step at submit | Task 3 (`canPickReviewer`, shared with `Review.request`, R35) |
| D58: AI and automation actors carry the requester's id but are not the requester | Task 2 (`isRequestedBy`), Task 3 |
| 1a review carry-over: `assertModelsBindable` throws `ModelNotAuthorized` for an editor without model read access | Task 5 (R38, amended: mapped to a validation error) |
| D132: 1a rules that read wrong ("checks in 1b", `actor` on workflow events in 1b) | Task 6 (R6, R14, R26, Review Focus 2, Not in this phase; R39) |

### Not in this phase

- App wrapper use cases per app (CMS, Website Builder) that read the identity, build the actor and team ids, check `editor`, authorize cancel and reassign with the permission-only predicates (R41), and check target access before calling the internal use cases, each with its own tests for refusing cancel by a non-requester without `reassign` and every action without target read access (2).
- Keeping workflow store and delete `editor`-gated in every app wrapper (2, 3).
- `actor` on the workflow use case input and events (2, R39).
- Target read and write access checks: start, take over, approve, reject, cancel, restart need read access; request needs write access (D77); candidates must read the target (D61) (2 wrappers and adapters, 4 routing).
- GraphQL for every operation: per-app operations with viewer flags on review reads and list rows, and the shared configuration operations (settings, `listUsers`, step types, notification transports, automation definitions, AI tools) with their `editor` check (D133); query permissions (D78) and which assignment reasons a viewer sees, redacted by the wrapper (D89) (3; transports also 7).
- Routing, candidates (read access through the app's target adapter, D61, D133), reassign transition (using `guardReassign`), pick validation against candidates and exclusions (D33, D61), per-app `listStepCandidates` (D128) (4). Done in phase 4 (R111, R112, R119, R120).
- Failed steps, restart (with its permission-only predicate, R41) and a real `canRestart`; `withIdentity(requester)` around task triggers (D87, D133) (5).
- Security admin UI for the "custom" workflows access level with `editor` and `reassign` checkboxes, matching R29's permission shape (9c).

### Review findings not applied

All findings of the D132 review of this plan were applied (R40-R44, Tasks 1, 2, 3, 4, 5 and 6); its open questions were answered by D133.
