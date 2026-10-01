# Workflows: discovery overview

Starting point for refactoring Advanced Publishing Workflows (API + admin UI), implementing reviewer routing (`routing.md`), and adding automated and AI steps. Snapshot of 2026-10-01 on `bruno/refactor/workflows-flow`.

## Documents

- `routing.md`: product brief for reviewer routing (input, not discovery).
- `api.md`: `api-workflows` domain, lifecycle, persistence, GraphQL, permissions, tests, smells.
- `app.md`: `app-workflows` architecture, editor, review flows, GraphQL usage, bugs, smells.
- `integrations.md`: CMS and Website Builder packages (API + admin), how content binds to a workflow, publish blocking, available metadata.
- `infrastructure.md`: AI providers, ai-powerups capabilities, background tasks, ACO folders, teams/users, mailer, tenant settings, webhooks.

## Packages

| Package | Role | Size |
|---|---|---|
| `api-workflows` | Core domain, use cases, GraphQL | 160 files, ~6.3k LOC src |
| `app-workflows` | Core admin UI | 192 files, ~7.3k LOC, no tests |
| `api-headless-cms-workflows` | CMS entry binding | 22 files |
| `app-headless-cms-workflows` | CMS entry editor/list UI | 25 files |
| `api-website-builder-workflows` | WB page binding | 16 files |
| `app-website-builder-workflows` | WB page editor/list UI | 29 files |

All gated by the `advancedPublishingWorkflow` licence flag. Everything is already DI-native (`createFeature`, `createAbstraction`, MobX presenters on the admin side).

## How it works today

- A workflow belongs to an "app" (`cms.<modelId>` or `wb.page`). One workflow per app, enforced only at review creation.
- A workflow is an ordered list of steps. A step is `{id, title, color, description, teams, notifications}`. Every step is a human team review.
- Requesting a review creates a `WorkflowState` record (private CMS model `wbyWorkflowState`) for one target revision. Steps are snapshotted into it.
- Step lifecycle: `pending` → `inReview` (a team member clicks Start and becomes the step "owner" via `savedBy`) → `approved` or `rejected`. Others in the team can take over. Only the owner approves or rejects. The requester can never review.
- After approving a step, the next step waits `pending` until someone starts it. Reject is terminal; the requester must cancel and re-request.
- When all steps are approved, `done` is true and the editor may publish manually. While a review is open, publish is blocked by API handlers and UI decorators; moving the entry or page is blocked by API handlers only (no UI move block). The move block fails open when the state lookup fails.
- Integrations write a denormalised `system.workflow = {workflowId, stepId, stepName, state}` onto the entry/page for list views.

## Biggest problems found

Correctness:

1. `system.workflow` goes stale. Start/approve/reject/take-over persist through the repository directly, skipping `afterUpdate`, so the integrations' sync handlers never run (`api.md` §3).
2. Workflow-state operations have no permission checks (get, list, create, cancel, delete). Cancel does not check the caller is the requester (`api.md` §4).
3. `WorkflowsFeature` is registered twice in API and app. Verified effects: notification types listed twice, workflow models listed twice in `ModelsProvider`, SDL composed twice (merges without error) (`api.md` §1, `integrations.md` §6).
4. List resolvers push system fields into `where.values`; filtering by `createdBy`/`savedBy`/dates throws `FIELD_ERROR`. Nested step/team filters are stripped by zod; `listRequested` matches any step's team, not the current step (`api.md` §5).
5. State invariants leak: cancelled states can still be started/approved (no `isActive` check); completed states never deactivate; a failed active-state lookup lets a second state be created (`api.md` §3).
6. Admin: gateways drop error `code`/`data`, so error bars and invalid-field display never work; singleton widget presenter shared between two dashboard widgets (results overwrite, dialogs open twice); approve success dialog names the next step; fire-and-forget editor saves (`app.md` §7).
7. CMS and WB publish checks differ: WB crashes generically on lookup errors and does not clear `system.workflow` on done (`integrations.md` §6).

Structure:

1. Step shape is defined in 5 API places and 4 admin places with differing required-ness. Adding any step field touches ~10 files.
2. CMS and WB integrations duplicate about 9 handler pairs that differ only in "how to load the target and write `system.workflow`". A single target-adapter abstraction would collapse them.
3. Notifications are configured but never sent; the message abstractions are unused.
4. `targetContext` is an untyped `GenericRecord`, missing on the client type.
5. Singleton per-target presenters in the admin block concurrent contexts.

## Gap analysis: routing

What the brief needs versus what exists:

| Need | Today | Work |
|---|---|---|
| Assignee per step | Only `savedBy` (owner after Start) | New `assignee` on state step; decide relationship to owner |
| Evaluate at step activation | Steps become active only on manual Start; next step never auto-activates | Introduce an explicit "step activated" transition (on create for step 1, on approve for next) |
| Requester user / teams | `createdBy`; teams fetched after create | Fetch teams before evaluation |
| Folder with descendants | `targetContext.folderId` | Load folder ancestors (`GetAncestors`, includes the folder itself); match rule folder ids against the result. No descendant scan. Caveat: uses stored `path`, stale right after an ancestor move |
| Model | `cms.<modelId>` / `targetContext.modelId` | Typed context |
| Locale | CMS entries have no locale; WB has `page.properties.language` | Decide what "locale" means for CMS. Likely blocker |
| Team members (round-robin, least-loaded) | No "list team members" API; `ListUsers` filters only `id_in` | Add `teams_in` filter or load all tenant users |
| Least-loaded count | No assignee field to count | Count open assignments on `wbyWorkflowState` (needs queryable assignee field) or keep a counter |
| Exclusion list | None | Tenant-level storage (`KeyValueStore` or private CMS model) + settings UI |
| Notifications | Transport exists, nothing sends | Wire state events to `NotificationTransport`; resolve recipients |
| Reassign + permission | None | New use case, mutation, permission, audit entry |
| Manual pick at submit | `createWorkflowState(app, targetRevisionId, title)` only | Extend input; picker needs a users source (none exists in app-admin) |
| Rule inspector ("what if") | None | Dry-run query over the same evaluator |
| Folder deleted | No cascade. CMS folders with entries cannot be deleted. WB page folders are not content-checked and can be deleted with pages inside | Dangling folder id never matches; editor flags it. For WB, decide whether to add a content guard |
| Content moved mid-review | Moving the entry/page is blocked (API only, fails open on lookup error). Re-parenting its folder or any ancestor is not blocked | Ancestor chain can change mid-review. Matches brief: evaluate at step activation against current folder |

## Gap analysis: automated and AI steps

- Steps need a `type` (e.g. `review`, `check`, `ai`) and type-specific config. `teams` must become type-dependent (required only for `review`).
- State machine needs states for non-human steps: at least `running` and `failed` (or `error`) alongside `pending`, `inReview`, `approved`, `rejected`.
- Execution must leave the GraphQL request: background tasks (`TaskService.trigger`, supports `delay`). `api-scheduler` is a second deferred mechanism, useful for timeouts. `AiImageEnrichmentTask` in ai-powerups is the closest template (structured output, websocket notify on failure, `maxIterations: 1`).
- Step activation must be automatic so an automated step starts without a human clicking Start. Same transition routing needs.
- AI calls go through ai-powerups `ResolveAiCapabilityUseCase` (per-tenant connection, model role, enabled check) then `Ai.generateText` with `Output.object({schema})`. AI steps would need both `advancedPublishingWorkflow` and `aiPowerups` licences.
- AI calls must pass the inline connection from `ResolveAiCapabilityUseCase`; `Ai.generateText` without `connection` throws because no named connections are registered.
- Check steps calling external systems: `WebhookDeliver` already POSTs with timeout/retry and returns status and body. Missing: response evaluation, and an inbound callback endpoint if async checks are wanted (no inbound webhook route exists).
- Approve/reject/comment by a non-human actor needs an identity model for the system or AI actor (`savedBy` is a user identity).
- Admin: step editor is not type-aware; needs a step-type registry or decoratable field slots. Bar, tags, options and widgets assume human review.

## Suggested refactor direction (for discussion)

1. Fix correctness bugs first, behind tests: single persistence path for transitions (so events and sync fire), permission checks on state operations, double registration, list filters.
2. Introduce a step-type abstraction on both sides: one definition of the step schema per type, used by CMS model, GraphQL, zod and admin form. Kill the 9-place duplication.
3. Introduce an explicit step activation transition in the aggregate, with a pluggable "activator" per step type: review steps run assignment resolution; check/AI steps trigger a background task.
4. Introduce a `WorkflowTarget` adapter abstraction implemented by CMS and WB. It loads the target, produces a typed context (folder, ancestors, model, locale, author) and syncs `system.workflow`. Collapses the duplicated integration handlers.
5. Implement notifications on top of state events once activation and assignment exist.
6. Admin: split per-target presenters from singletons, fix error propagation, add a step-type registry for the editor, then add assignment UI, picker, reassign, exclusion settings.

## Open questions

1. Is changing the `wbyWorkflowState` / `wbyWorkflow` model shape free? Per the "next is unreleased" memory, yes for this branch, but these are released in 6.x as well. Confirm whether data migration from 6.x matters.
2. Should the next step auto-activate after approve (and step 1 on request)? Routing and automated steps both need it; it changes current UX where a reviewer clicks Start.
3. Assignee vs owner: is "assignee" the person expected to act, while "owner" (`savedBy`) stays "who started it"? Or do they merge (assigned step goes straight to `inReview` with the assignee as owner)?
4. Locale condition: CMS entries have no locale. Drop it, defer it, or map it to something?
5. What should an AI step decide: approve/reject only, or also leave comments and suggested edits? Does a human confirm AI rejections?
6. Check steps: synchronous HTTP with timeout inside a background task, or async callback? Which external systems are in scope?
7. Failure policy for automated steps: retry, fail the review, or fall back to a human team?
8. Should one app allow multiple workflows (e.g. per folder), or stay one-per-app with routing only choosing reviewers?
9. Where should the exclusion list live: `KeyValueStore` blob or private CMS model with one record per user?
10. Do we keep the GraphQL operation names and app public exports, or are breaking changes acceptable for the refactor?
