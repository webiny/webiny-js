# Workflows: decisions

Decisions taken while discussing the open questions in `README.md`. Newest at the bottom.

## D1. Stored shape is free to change

`wbyWorkflow` and `wbyWorkflowState` (and any new workflow models) can be rewritten freely. No data migration, no backward compatibility layer. Fields may be renamed, removed or restructured. The DDB key format is untouched because these stay CMS entries.

## D2. "Step reached" and start policy

"Step reached" = the system reacts when a step becomes current (step 1 on review request, later steps when the previous step is approved). It is not the same as starting the review.

What happens on step reached depends on how the reviewer resolves:

- Pool: notify the pool. Step waits until one person clicks Start. Only that person reviews.
- Routed or picked (user chosen by rule/strategy, or picked by the editor at submit): step starts immediately with that user as owner, same as if they clicked Start.
- AI: step starts immediately. AI acts like a user: starts, reviews, approves or rejects.
- Automation (e.g. API call whose result decides): same as AI.

A step whose pick, rules and strategy resolve nobody falls back to pool.

## D3. Owner is a typed actor

Step `owner: { type: "user" | "ai" | "automation", id, displayName }` replaces `savedBy`. Start, approve, reject and comment use one code path for every actor type. No separate branches for AI or automation. Audit and UI show which actor decided.

## D4. Step states

`pending` (not reached), `awaiting` (reached, no owner, in team pool), `inReview` (owned), `approved`, `rejected`, `failed` (AI or automation errored).

## D5. Transitions are identity-free

Domain transitions take an explicit actor and never read the current identity, so they run inside background tasks with no user request. Per-viewer flags (`canReview`, `canTakeOver`, `isOwner`) are computed separately, only when a user reads the review.

## D6. One task per automated step

Each AI or automation step runs in its own background task. A task only resolves its own step. The next step goes through the single "step reached" path (D2), whatever its type; if it is AI or automation, that path triggers a new task. No chaining of steps inside one task.

## D7. Stale-result guard

An automated step carries a run id. When the task finishes it reloads the review and applies its result only if the review is still active, the same step is still current, and the step's run id still matches. Otherwise the result is discarded. Covers cancel mid-run, take-over, and duplicate task runs.

## D8. AI and automation failure

No fallback team. Outcome is `rejected` (the AI or check decided no) or `failed` (technical error: provider down, timeout, bad response). The error text goes into the step comment. A user can restart a failed AI or automation step, which triggers a new run (new run id, D7). Who may restart: the requester and anyone with workflow editor permission. A `rejected` step (any actor) cannot be restarted: the target content must change and the whole workflow starts over.

## D9. Take-over

Assignment is a default, not a lock. A routed step owned by the assigned user can be taken over by another member of the step's team. AI and automation steps can never be taken over; on failure the only action is restart (D8).

## D10. Rejection is final for that revision

A rejected review is never cancelled or reopened. It stays as the permanent record on that target revision. To continue, someone creates a new revision of the entry or page, fixes the issue, and requests a new review on the new revision. Reviews are per revision.

## D11. Owner is the assignee

No separate `assignee` field. A routed step starts with the assigned user as owner (D2, D3). Owner must be stored so it is directly queryable (least-loaded counting, "assigned to me" lists).

## D12. No locale condition

Routing conditions exclude locale for now. CMS entries have no locale, and WB `properties.language` is untyped and only set on translated pages. Add the condition when CMS gains locales.

## D13. AI step capabilities

An AI step acts exactly like a human reviewer: approve or reject, with a comment giving the reason. (Editing revised by D39: allowed only via step-allowed tools.) No human confirmation of its decision (rejection is final, D10). Step config: reviewer instructions (prompt) plus ai-powerups capability and model role. Built in phase 6: D138-D148.

## D14. Automated steps are defined in code

Automated steps are code definitions, not UI-built. Webiny ships built-ins (e.g. send a webhook, pull an image from an external URL, create records). Users register their own via code.

_Superseded in phase 5 (user answers, R155): no automation ships with Webiny. Developers write every automation in code; a webhook automation is only an example of one._

- Each definition implements only its logic and returns the step outcome. The background task wrapping is framework-owned and invisible to the implementer.
- A definition declares its scope: global, per app, or (CMS) per model or set of models.
- A definition declares a config schema (zod) for per-step settings (e.g. webhook URL). The API exposes it to the admin (e.g. as JSON schema), and the step editor renders a form from it. The admin picks the automation from a list filtered by app or model scope. No schema, no form.

## D15. Workflow to model relation

Workflows bind to models, not "apps". Website Builder pages are a model too. Target design is many-to-many: one workflow for several models, several workflows on one model (v2). v1 ships 1:1, enforced on save, but data shape and code are built for many-to-many.
- Shape: workflow field `models: string[]` with namespaced ids, e.g. `["cms.model1", "cms.model2", "wb.page"]`. Replaces the single `app` string. Queryable (e.g. `models_in`).
- v1 validation on save: exactly one entry in `models`, and no other workflow already bound to it. v2 relaxes both and adds a rule for choosing between several workflows on one model.

## D16. Tenant workflow settings and exclusion list

One private singleton settings model per tenant (e.g. `wbyWorkflowSettings`), reusable for future workflow settings. Exclusion list is a field on it: `exclusions: [{ userId, reason?, endsOn? }]`. Expired entries are filtered in memory.

No artificial cap on the number of exclusions. Saving fails naturally if the record exceeds the DDB 400 KB item limit.

_Built in phase 9c (D178): Settings > Workflows > Reviewer exclusions edits the list for every app. The page reads with `getSettings(includeExpired: true)`, so expired entries are shown and kept, and every save sends the whole list._

## D17. Breaking changes allowed

GraphQL operations, types and inputs, and the public exports of `app-workflows` / `api-workflows`, may change without compatibility shims. CMS and WB workflow packages are updated in the same change. Admin and API deploy together.

## D18. Order of work

Go straight into the rewrite; it replaces most buggy code (persistence path, step shape, list filters, error propagation, presenters). Exception: fix the double registration of `WorkflowsFeature` (API and admin) first. Correctness fixes (permissions on review operations, list filters, single persistence path) are in scope of the rewrite.

## D19. Current-step fields on the review

Review record carries top-level `currentStepId`, `currentStepState`, `currentOwnerId`, copied from the current step and refreshed on every transition through the single persistence path. Least-loaded uses a live count per candidate (`currentOwnerId = X`, `currentStepState = inReview`, review active). No stored counters.

## D20. Assignment log model

Private model `wbyWorkflowAssignment`, one record per assignment: `reviewId`, `workflowId`, `stepId`, `userId`, `assignedOn`, `source` (rule id, strategy, picked, reassign). Round-robin takes the latest record for `workflowId` + `stepId` and picks the next team member in stable order. Least-loaded ties use the latest record per candidate. Doubles as the audit trail for why someone was assigned.

## D21. Candidate teams on the step

On step reached, resolved candidates are stored on the step as `candidateTeamIds` (default: the step's teams; narrowed by a team-target rule). Start, take-over and the pool list check `candidateTeamIds`, not the configured step teams.

## D22. Editor picks at submit

Editor picks are stored per step snapshot as `pickedUserId` at submit. On step reached the pick is validated (still a candidate, not excluded, not the requester). Invalid pick is skipped; resolution continues with rules, then strategy, then pool. The skip reason is recorded in the assignment log (D20).

## D23. Meaning of isActive

`isActive` marks the current review of a revision (at most one per revision). It becomes false only on cancel. Rejected stays active (revision blocked, D10). Done stays active (publish allowed). Failed stays active (restartable). Load counting and "assigned to me" filter on `currentStepState`, not `isActive`.

## D24. New revision after rejection

Creating a new revision always starts without a review: a revision-create handler clears copied `system.workflow` (CMS and WB). CMS already offers "create new revision" in the workflow bar. WB needs the same action on a rejected page. To check: whether WB supports creating a revision from a draft page.

## D25. Cancel

A review can be cancelled at any point unless it is approved (done) or rejected. Allowed for the requester and users with workflow editor permission. After cancel, a new request on the same revision starts from step 1.

Cancel during a running AI or automation step: the step implementation handles it. The framework aborts the task where possible (`TaskService.abort`) and the stale-result guard (D7) discards any late result.

The developer-mode "Remove Review Request" action on the rejected bar stays as a developer escape hatch (exception to D10).

## D26. Task identity

An AI or automation task runs as the identity that started the step: the user whose action reached it (the requester for step 1, the approver of the previous step otherwise, the restarter on restart). All task work runs under `withoutAuthorization`, but any record a step implementation creates or updates is attributed to that identity. The step `owner` still records the AI or automation actor (D3). To check: whether background tasks already carry and restore the triggering identity.

## D27. Accept the write race

The reload-then-write in D7 has no optimistic lock. The narrow race (cancel or take-over landing between reload and write) is accepted for v1. Add a conditional write only if it shows up in practice.

## D28. Task failure detection

No step max duration and no watchdog. A step may legitimately run for a long time (e.g. wait 24h). The background task's built-in waiting and max iterations bound it. The task's `onError` and `onMaxIterations` hooks set the step `failed` with the reason in the step comment.

## D29. Review state and system.workflow

Review-level `state`: `inProgress`, `approved`, `rejected`. A `failed` step keeps the review `inProgress` (restartable). `system.workflow` on the entry or page: `{ workflowId, reviewState, stepId, stepName, stepState }`; lists can filter on review or step state.

## D30. Actor shape and record attribution

Owner `type` is a forced enum: `"user" | "ai" | "automation"`. Fields:

- user: `{ type: "user", id: identity.id, displayName }`; the old identity kind (admin, API key) moves to a separate `identityType` if needed.
- AI: `{ type: "ai", id: <capability id>, displayName: <step title> }`
- automation: `{ type: "automation", id: <definition id>, displayName: <definition name> }`

Refines D26 (attribution of records created or updated by a task): if a real person's action reached or restarted the step (requester, human approver, restarter), records are attributed to that person. If the step was reached by an AI or automation approval (no person involved), records are attributed to the requester.

## D31. Comments use collaboration threads

No separate workflow comment system. Review discussion uses the collaboration feature (`api-collaboration` / `app-collaboration`, branch `origin/feat/collaboration-comments`, model `wbyCollabThread`, threads keyed by `contentType` + `contentId` + `locator`). Each review step gets its own thread (e.g. locator `workflow:<reviewId>:<stepId>`, or a dedicated workflow locator resolver). The approve, reject or failure reason stays on the step and is also posted as a message in that step's thread.

Dependency: collaboration must merge first. Until then, step comments only.

## D32. Take-over rules

Any human-owned `inReview` step (started from the pool, routed, or picked) can be taken over by a member of the step's `candidateTeamIds` (D21) who is neither the requester nor the current owner. AI and automation steps cannot be taken over (D9).

## D33. Reassignment

New permission `workflows.reassign`, separate from editor and sign-off. Reassign sets the owner of an `awaiting` or human `inReview` step to a user from the step's candidates, validated like an editor pick (not excluded, not the requester). `awaiting` becomes `inReview`; nothing else on the step changes. Logged in `wbyWorkflowAssignment` (`source: reassign`) and as an audit-log event. Old and new owner are notified.

## D34. Restart permission

Refines D8: restart of a failed AI or automation step is allowed for the requester and holders of `workflows.reassign` (operational permission), not `workflows.editor` (configuration). Full access (`workflows.*`) covers all. Exposed as the `canRestart` viewer flag (D5).

## D35. Automation scope

Refines D14: an automation definition declares `models` using the namespaced ids from D15: `["*"]` (global), `["cms.*"]` (all CMS models), or specific ids (`["cms.article", "wb.page"]`). The step editor offers an automation only if its scope covers every model in the workflow's `models`.

## D36. Automations may change anything

An automation may create, update or delete anything, including the target revision under review. The task runs with full access (D26 governs attribution). The workflow save block does not apply to automation writes, and the review stays valid. The AI step edits only through its allowed tools (D39).

## D37. Missing or changed automation definitions

On step reached, the definition is looked up and the stored step config is re-validated against its schema. Missing definition or invalid config sets the step `failed` with the reason; it is restartable after a fix. The workflow editor flags steps whose definition is missing or whose config no longer validates.

## D38. No inbound callbacks in v1

Automations that depend on an external system poll: the task waits and continues across iterations (D28). Covers quick and long-running checks. An inbound webhook callback route may come later if polling proves insufficient.

## D39. AI step input, tools and output

Revises D13: the AI may change content, but only through tools allowed on the step.

- Input built by the framework: target content serialized with field labels (CMS entry values or WB page content), model name, previous step comments, and the step instructions as the prompt.
- Runs as an agent loop over the `AiSdkTools` registry with `stopWhen`. Each step configures an allowlist of tools; edit tools are permitted.
- Structured output: `{ approved: boolean, comment: string, issues: [{ fieldPath?, severity, message, suggestion? }] }`. _The `AiSdkTools` registry was replaced by the workflow tool registry (D55, D142); phase 6 built the loop, bounded writes and issues (D143-D145)._

## D40. AI licensing and capability

One shared ai-powerups capability, "Workflow review"; model role selectable per step. Without the `aiPowerups` licence the AI step type is hidden in the editor. If the capability is disabled or the licence lapses later, the step becomes `failed` with the reason when reached; restartable once fixed. _The per-step model role was already replaced by D101; the capability "Workflow review" is built (D138)._

## D41. Model deletion and binding checks

- A `ModelBeforeDelete` handler blocks deleting a model that any workflow lists in `models`. The workflow must be deleted (or the model removed from it) first. Replaces today's `DeleteWorkflowsOnModelAfterDelete`.
- Review record field `app` is renamed to `model`.
- Workflow create and update run the same validation: models must be publishable and, in v1, not bound to another workflow. The uniqueness race is accepted (rare admin action).

## D42. Namespaces map to target adapters; model condition hidden in v1

`wb.page` stays its own namespace although pages are stored as CMS model `wbyWbPage`. Each namespace maps to one target adapter (CMS entry, WB page) owning target loading, publish/move blocking and `system.workflow` sync. The "content is of model X" rule condition exists in the rule schema but is hidden in the v1 editor (always matches with one model per workflow); shown in v2.

## D43. Exclusion list access and endsOn

Anyone who can request a review can read exclusions (user, reason, `endsOn`) through the picker query. Editing the list requires `workflows.editor`. `endsOn` is an ISO datetime in UTC; the UI picks a date and stores end of that day in the user's timezone, converted to UTC.

_Refined by D179 (phase 9c): the end of the picked day is 23:59:59.999 in the browser's timezone (UTC when it cannot be resolved), the earliest pickable day is today, and the admin reads and edits the list on the Reviewer exclusions page with `editor`._

## D44. Notifications

| Event | Recipients |
|---|---|
| Step reached, pool | Members of the step's candidate teams |
| Step started by routing, editor pick or reassign | Owner |
| Reassign | Old and new owner |
| Review approved, review rejected, step failed | Requester |
| Review cancelled | Current owner, if any |

An assignment never notifies the whole team. Channels: transports configured on the step (`notifications[]`, e.g. e-mail) plus an in-app websocket notification always.

_Built in phase 7: D149-D156._

## D45. Explaining assignments

- Pool fall-through also writes a `wbyWorkflowAssignment` record with `userId: null` and a reason (e.g. all candidates excluded, rule target invalid).
- The step stores a short `assignmentSource` (rule id, strategy, picked, pool) for UI display.
- Rule inspector in v1: dry-run query (requester, folder, step) returning the resulting assignee and the deciding rule, using the same evaluator as live assignment.

## D46. Rule shape

Rules live in each review step's config (snapshotted into the review):

```ts
assignment: {
  strategy: "none" | "roundRobin" | "leastLoaded",
  allowManualPick: boolean,
  rules: [{ id, conditions: { requesterUserId?, requesterTeamId?,
            folder?: { id, includeDescendants }, modelId? },
            target: { type: "user" | "team", id } }]
}
```

Conditions within a rule combine with AND; first matching rule wins. Targets are validated on save (must lie within the step's teams) and again at evaluation (invalid target skips the rule). The editor flags invalid targets and dangling folders.

_Refined by D171 (phase 9b): the stored rule shape is unchanged. The editor gives a rule an id when it is added (never on load, never on reorder), writes back every condition key and rule key it does not edit (`modelId`, a folder condition's own `type`, unknown keys) and a rule-level validation error names the field `config.assignment.rules.target` with the rule's `ruleId`; schema issues keep `config.assignment.rules.<index>.<path>`._

## D47. Review lists

Adds top-level `currentCandidateTeamIds` to the review record (alongside D19 fields). Lists:

- Assigned to me: `currentOwnerId = me`, `currentStepState = inReview`.
- Pool: `currentStepState = awaiting`, my teams intersect `currentCandidateTeamIds`, I am not the requester.
- Team in review: `currentStepState = inReview`, owner is someone else, my teams intersect `currentCandidateTeamIds`.
- My requests: `createdBy = me`.

_Refined by D133: the lists exist per app (CMS, Website Builder); nothing merges them. The app wrapper supplies the viewer's user id and team ids to the engine's list._

## D48. User lists owned by workflows

Workflows exposes its own user queries; both run `withoutAuthorization` internally, so no `adminUsers` permission is needed.

- `workflows.listUsers`: all tenant users, minimal fields (id, displayName, teams). Requires `workflows.editor`. Used by the rule editor (requester user, user targets).
- `workflows.listStepCandidates(workflowId, stepId)`: only that step's candidates with `{ id, displayName, excluded, excludedReason }`. Available to anyone who can request a review. Used by the manual picker. Round-robin and least-loaded use the same candidate source.

Team member lookup needs a `teams_in` filter on users storage in api-core, or in-memory filtering. To check: whether users storage can filter on teams.

_Refined by D133: `listUsers` is a shared configuration operation in api-workflows (`editor`); `listStepCandidates` is per app. The `workflows.*` names above are capability names, not final operations._
_Built in phase 4 (R123): `workflows.listUsers(search, ids, limit)` returns `{ id, displayName }` only (D104), ids up to 200 with `missingIds` (D117)._

## D49. Terminology

- Pool: step reached with no owner; a team member clicks Start.
- Picked: the editor chose the reviewer at submit.
- Routed: assigned by a rule or a strategy.

"Manual" is not used for assignment.

## D50. Code checks for D24, D26, D48

Verified against code (2026-10-02).

- D24 (WB new revision): possible. `CreatePageRevisionFromUseCase` has no status check (`api-website-builder/src/features/pages/CreatePageRevisionFrom/CreatePageRevisionFromUseCase.ts:24-43`). The UI offers "New revision from current" for every revision in the revisions list (`app-website-builder/.../PageEditor/Revisions/RevisionListItem.tsx:119-125`), but the editor top-bar `NewRevisionButton` shows only in read-only (non-draft) mode (`DefaultPageEditorConfig.tsx:30-34`). The new revision copies `system` unchanged (`api-headless-cms/.../entryDataFactories/system.ts:11-18`), so `system.workflow` carries over; nothing resets it. Work: a revision-create handler clears `system.workflow` (CMS and WB); the WB workflow bar on a rejected draft offers "create new revision" and navigates to it.
- D26 (task identity): background tasks store the triggering user as task `createdBy` and restore it via `IdentityContext.setIdentity` before running (`background-tasks/src/api/runner/TaskControl.ts:75-85`); `definition.run` runs inside `withoutAuthorization` (`TaskManager.ts:117-125`). Same for AWS and standalone. D26 holds without extra work. For D30: when a step is reached by an AI or automation approval inside a task, the next task would inherit the previous task's identity; the framework must explicitly trigger it as the requester.
- D48 (team filter): users are a custom DDB entity (`api-core-ddb/src/adminUsers/index.ts:109-131`) or a SQL table with a JSON blob (`api-core-sql/src/adminUsers/index.ts:92-112`); no CMS model, no OpenSearch index. Both backends load all tenant users and filter in memory, so a `teams_in` filter is a small addition to `ListUsersInput` and both `listUsers` implementations. Full tenant scan, acceptable for typical user counts.

## D51. Null system.workflow on new revision (CMS and WB)

Creating a new revision nulls `system.workflow` on the new revision, for CMS entries and WB pages. Checked 2026-10-02: CMS does not do this today. `getSystem` copies `original.system` when the input has no `system` (`api-headless-cms/src/features/contentEntry/entryDataFactories/system.ts:11-18`), no workflow handler listens to revision-create, and the CMS "Create New Revision" button just calls `revisionsPresenter.createRevision` (`app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryFormCreateNewRevisionButton.tsx:23-39`). CMS only clears the field on publish of a done review. Implement as an `EntryRevisionBeforeCreate` handler in the CMS target adapter and the equivalent page revision handler in the WB adapter (D42).

## D52. UpdateEntrySystemUseCase for system.workflow sync

New `UpdateEntrySystemUseCase` in api-headless-cms, modelled on `UpdateRevisionDescription` (`api-headless-cms/src/features/contentEntry/UpdateRevisionDescription/`): load revision via `GetRevisionByIdUseCase`, change only `system.*` keys, persist via `UpdateEntryRepository`, publish its own narrow events (not `EntryAfterUpdate`). No meta rebuild (`savedOn`, `modifiedBy` untouched), so no `entry.updated` / `page.updated` webhooks and no content-edit audit. Workflows calls it under `withoutAuthorization` for every `system.workflow` write; WB uses it too (pages are CMS model `wbyWbPage`). Resolves P2.

## D53. Filterable system.workflow fields

Register `system.workflow.workflowId`, `reviewState`, `stepId`, `stepState` as filterable system fields in the DDB and OpenSearch filter registries (`api-headless-cms-storage/src/filtering/fields/systemFields.ts`, `api-headless-cms-utils-os/.../fields/`). The legacy `state` system field stays untouched. CMS and WB lists can then filter by review status (also covers A10). Resolves P1.

## D54. Permission model

One `workflows` permission with custom boolean actions:

- `editor`: configure workflows, tenant workflow settings (exclusions), `workflows.listUsers`.
- `reassign`: reassign, restart, and cancel reviews requested by others (refines D25: cancel by requester or `reassign`).

Security UI gets a "custom" access level with these checkboxes. One shared permission checker in api-workflows treats `*` and `workflows.*` as full access and replaces the four copied `ensureManageAccess` functions. Viewer flags (`canCancel`, `canReassign`, `canRestart`, `canPick`) are computed on the server (covers A9). Resolves P3, A1.

_Refined by D132 and D133: the checker is a building block used by the app wrappers and the shared configuration operations; viewer flags are computed in the app wrapper with the api-workflows helper. One `workflows` permission serves every app._

_Built in phase 9c (D182): the role form's Workflows group has No access, Full access (stored `{ name: "workflows.*" }`) and Custom (stored `{ name: "workflows", editor?: true, reassign?: true }`) with the checkboxes "Manage workflows" (`editor`) and "Reassign and operate" (`reassign`); Custom needs no `aacl` licence._

## D55. Workflow AI tool registry

Refines D39. Separate registry in api-workflows (`WorkflowAiTool` abstraction); the AI step allowlist offers only tools from it, never the global `AiSdkTools` registry. Built-ins: `readTarget` and `updateTargetFields(fieldPath → value)`, always scoped to the revision under review and implemented per target adapter (CMS, WB). Developers register their own. Admin gets a list query (name, title, description). Resolves P5, A2.

## D56. Step-type extension point; ai-powerups owns the AI step

api-workflows and app-workflows define a step-type extension point (`StepType`: config schema, editor fields, runner). Review and automation step types are built in. ai-powerups registers the AI step type (capability, runner, editor fields); dependency direction is ai-powerups → workflows packages, never the reverse. No new licence option: the AI step needs both `advancedPublishingWorkflow` and `aiPowerups`. Resolves P6, A5.

## D57. Task id on step, stuck detection

Refines D7 and D28.

- The step stores the background task id; it is the run id for the stale-result guard and the id for `TaskService.abort` (covers P14 abort part).
- On review read, the server checks the task status. If the task is done, failed or aborted while the step is still `inReview`, the step is set `failed` ("task ended without result") and restart is offered.
- Definitions can set `maxIterations` and wait times (default 50 iterations is too low for long polling).
- The `failed` write is idempotent (`onMaxIterations` and `onError` can both fire).

Resolves P7.

## D58. AI and automation steps run as the requester

Supersedes the AI/automation owner shapes in D30 and the attribution rules in D26 and D30.

- AI and automation steps, and every task they trigger (including restarts), always run as the requester. Records they create, update or delete are attributed to the requester.
- Step owner for these steps: `{ type: "ai" | "automation", id: requester.id, displayName: requester.displayName }`. Which AI or automation ran is taken from the step config (capability id or definition id).
- Human owner stays `{ type: "user", id, displayName }`.
- `TaskService.trigger` in api-core gets an optional `identity`, stored as task `createdBy`, so the task runs as the requester even when another user's action reached the step. Resolves P14.

## D59. Single handler nulls system.workflow on new revision

Refines D51. One handler on the CMS `EntryRevisionBeforeCreate` event (create-revision-from) sets `system.workflow = null`. It covers CMS entries, WB pages (created through CMS `CreateEntryRevisionFromUseCase`) and any future app built on CMS entries. No per-adapter revision handlers. Resolves P8 (revision part). Separately, adapters handling other CMS events must still match their namespace and model explicitly, since WB page operations also fire CMS entry events.

## D60. Websocket messages, no inbox

No stored inbox; D47 lists serve that role. Workflows only sends websocket messages (`WebsocketsSendToIdentityUseCase`); the websockets layer decides delivery for live or non-live connections. On the client, every workflow websocket message goes to the shared review notification service, which shows the toast and signals the review activity bus, so the visible lists and widgets of that app refetch once per signal (R210, R223); `ReviewChangedEvent` (R213) replaces `WorkflowStateChangedEvent` and keeps the content lists' `system.workflow` cache in sync. Refined in phases 8a and 8b. Resolves P9, A7.

_Phase 7: delivery is tenant-scoped by the notifier; workflows lists the recipient's connections and sends to the current tenant's ones, and does not use `WebsocketsSendToIdentityUseCase` (D149, R188)._

_Refined by D160: workflows also sends the silent `workflows.reviewChanged` message (no toast) to the requester and the current owner, and the client refetches on it._

## D61. Candidates must be able to read the target

During resolution (routing, strategy, pick, reassign), candidates without read access to the target (folder access and model read) are dropped; the reason is logged in the assignment log (D20). The rule editor and rule inspector warn when a target user lacks access. Resolves P10.

_Refined by D133: the engine evaluates candidates' read access through the app's target adapter for the namespace (e.g. `canUserRead(userId, target)`); the app supplies the permission logic._

_Built in phase 9b (D174): a user target outside the step's teams, a team target outside them and a deleted user or team are rule errors on the client and the server and block Save. Whether a candidate can read the content, and exclusions (D118), are not shown in the editor; Test routing reports them through the server's skipped people (D175)._

## D62. Server-side save block

One CMS handler on `EntryBeforeUpdate` (covers CMS entries and WB pages) rejects updates to a revision whose review is active and not done. Exempt: `system.workflow` sync via `UpdateEntrySystemUseCase` (D52, does not fire `EntryBeforeUpdate`), and automation / AI tool writes, which run inside a workflow bypass context (D36). Resolves P11.

_Refined by D134: the save block first checks whether the model is bound to a workflow; only bound models look up reviews._

## D63. OpenSearch is the target storage; least-loaded query

Workflows is an enterprise feature; deployments are expected to run OpenSearch. DDB-only performance is not a design constraint. Least-loaded uses one query (`currentOwnerId_in: candidates`, `currentStepState: inReview`, active) grouped by owner in memory. Assignment records are deleted with their review; no time-based retention. Resolves P12.

## D64. Model delete block via use-case decorator

Refines D41. Instead of a throwing `ModelBeforeDelete` handler, a `DeleteModelUseCase` decorator in the CMS workflows package returns a typed `Workflows/Model/BoundToWorkflow` error listing the bound workflows, following `DeleteModelWithEntryCleanup.ts:95-107`. Resolves P13.

_Refined by D134: the CMS "fully delete model" background task is also refused at start for a bound model, before any entry is deleted._

## D65. Audit logs planned, not built

Design for audit logs now, implement later. Planned: a "Workflows" app in `common-audit-logs` with entities workflow and review; actions workflow create/update/delete and review request, start, take over, approve, reject, cancel, reassign, restart, step failed; handlers in api-audit-logs subscribing to workflow events. Domain events must carry enough data for this. In this refactor, only remove the old v5 "APW" entry from `common-audit-logs/src/apps.ts:43-79`. Until audit logs land, the assignment log (D20) is the only record of reassignments (refines D33). Resolves P4.

## D66. Step editor on FormModel, JSON-schema adapter

- New JSON-schema → FormModel adapter (`app-admin/src/features/formModel`); UI hints (user, team, textarea) carried in zod `.meta()`.
- Step editor rebuilt on FormModel: dynamic zone per step type, `ObjectAccordionMultipleRenderer` for the reorderable rule list.
- Client rebuilds the validator with `z.fromJSONSchema` (zod 4) to flag invalid stored config (D37).

Resolves A3.

_Refined by D168 (phase 9a): one FormModel form per step type instead of a dynamic zone, built by `buildFieldsFromJsonSchema`; UI hints reach the adapter as the JSON schema's `ui` property (`textarea`, `team`; `user` falls back to plain text until 9b); the reorderable rule list moves to 9b._

_Built in phase 9b: the People form has the FormModel layout tabs General, Assignment and Test routing, `assignment` is a form object with `strategy`, `allowManualPick` and `rules`, and the reorderable rule list is edited by `RoutingRulesRenderer` over `rules`, a plain-JSON array field of the `permissions` field type. The `user` UI hint has its picker (see D168)._

## D67. Secret config fields

Config fields marked `.meta({ secret: true })` are stored encrypted (`Encryption` service, as ai-powerups `apiKeyEncrypted`) and are write-only in the API: never returned, the editor shows "set" / "replace". The review snapshot keeps the encrypted value; review read responses strip secret fields. The task decrypts at run time only. Resolves A4.

_Superseded in phase 5 (user answer, R154): there are no secret settings. Step config has no secret fields, no encryption, no write-only marker, no stripping. Credentials belong to whoever writes the automation definition, in their own code or configuration, never in workflow step config. Resolved A4 stands as history only._

## D68. Collaboration integration deferred

D31 stays as intent only. Collaboration is not in `next`; the integration (thread target, permissions, posting as actor, field-anchored AI issues) is designed against the merged collaboration API later. v1 uses step comments only, with no collaboration-specific work. Resolves A6.

## D69. Folder picking in rules

Refines D46: folder condition is `folder?: { id, type, includeDescendants }`; `type` stored from v1.

- Picker is the standard `FolderPicker`, filtered by folder-level permissions; editors pick only folders they can access.
- A rule referencing a folder the current editor cannot see shows as "restricted folder" (no name) and is preserved unchanged on save.
- Dangling-folder check runs server-side without authorization and returns only `exists: boolean`, never folder data.

Resolves A8.

_Refined by D133: `folderExists` is per app and takes the folder `type`._
_Built in phase 4: `cmsEntryFolderExists(id, type)` and `websiteBuilderPageFolderExists(id)` (the type is always `wb:page`), `editor` only._

_Built in phase 9b (D173): the folder control is the shared searchable `WorkflowPicker` over the folders each app's editor adapter lists (CMS: the ACO folders of `cms:<modelId>`; Website Builder: `wb:page`), the root excluded, shown as title paths. A saved folder that is not listed is "Restricted folder" when `folderExists` says it exists (preserved unchanged, the picker disabled, removable) and "Deleted folder" when it does not (a non-blocking warning)._

## D70. Content lists: rename only

Row selectability in CMS and WB lists switches from `system.workflow.state` to `system.workflow.reviewState`. Nothing else: no new status column or filter in content lists. (D53 still registers the filterable fields.) Resolves A10.

## D71. Dashboard widgets

Two widgets: "For me to review" (tabs: Assigned to me, Pool) and "My requests". "View all" opens the matching D47 list. "Team in review" is only on the list page. Each widget gets its own presenter instance (no shared singleton). Resolves A11.

_Refined by D133: the widgets exist per app; nothing merges CMS and WB reviews._

## D72. Workflow pickers

Two custom FormModel field types (like `RolesMultiSelectFieldType`):

- `WorkflowUserPicker`: async search over `workflows.listUsers` (rule editor) or `workflows.listStepCandidates` (request dialog); excluded users shown disabled with reason (AutoComplete disabled items).
- `WorkflowTeamPicker`: options limited to the step's configured teams (rule team targets).

Resolves A12.

_Refined by D133: `listUsers` is a shared configuration operation, `listStepCandidates` a per-app operation._

_Built in 9b: the pickers are the shared `WorkflowPicker` and `WorkflowMultiPicker` with the field renderers `UserPickerRenderer` and `FolderPickerRenderer`; `listStepCandidates` stays in 8a (D175)._

## D73. endsOn conversion

Keep D43: a helper in the exclusions settings presenter converts the picked date to end of that day in the user's timezone, stored as UTC ISO datetime. Resolves A13.

_Built in phase 9c (D179): the conversion is the pure function `getEndOfLocalDay(date, timeZone)` in the settings model (`[AW]/settings/model/time/`), called by the Add / Edit dialog presenter, not a presenter helper._

## D74. currentOwnerId only for human owners

`currentOwnerId` is set only when the current step owner is `type: "user"`. For AI and automation steps it stays null, so they never appear in "Assigned to me" or count toward least-loaded. Resolves S1.

## D75. What cancel writes

Cancel sets review `state` to the new value `cancelled` and `isActive = false`, clears the current-step fields (`currentStepId`, `currentStepState`, `currentOwnerId`, `currentCandidateTeamIds`), sets `system.workflow = null` (target unlocked), and aborts any running task. All review lists also filter `isActive: true`. Resolves S2.

## D76. Folder-level filtering on review lists

Review lists keep the folder-level read filter on the target. Pagination is rewritten: fetch pages until `limit` is filled, return the cursor of the last scanned record, no exact `totalCount`. Resolves S3.

_Refined by D133: the app wrapper passes the target-read predicate to the engine's list use case, which runs the fill-the-page loop; lists are per app._

## D77. Requesting needs write access

Requesting a review requires write access to the target revision. Resolves S4.

## D78. Query permissions

`listWorkflows`, `getWorkflow`: any authenticated admin user. `listStepCandidates`: write access to the workflow's model. `getSettings`, `updateSettings`, `inspectRouting`, `folderExists`, `listUsers`, `listStepTypes`, `listAutomationDefinitions`, `listAiTools`: `editor`. Requesters see exclusion data only through `listStepCandidates` (refines D43). Resolves S5.

_Refined by D132 and D133: the checks run in the app wrappers or, for the shared configuration operations (settings, `listUsers`, step types, transports, automation definitions, AI tools), in api-workflows with `editor` alone. Workflow list and get are per app too (store, delete, list, get). `inspectRouting`, `folderExists` and `listStepCandidates` are per app._

_Built in phase 9c (D178): the admin hides the Settings menu group and item without `editor`; the settings route and the editor routes are registered whenever the feature flag is on and show a no-access view without it. A `Workflows/NotAuthorized` answer to `getSettings` or `listUsers` shows the same view. The server checks are unchanged._

## D79. Publish requires an approved review on workflow-bound models

If a model is bound to a workflow, a revision can only be published when it has an approved review. Enforced in the API publish handler, not only the UI. Today the UI blocks it (`canPublish && (!hasWorkflow || isApproved)`), but the API handler lets publish through when no active review exists or the lookup fails (`ValidateWorkflowStateOnEntryBeforePublish.ts:23-26`), so direct API/SDK publishes bypass the workflow. Lookup failure blocks publish (fail closed). Models without a workflow publish normally. Resolves S6.

_Refined by D134: the rule applies to the publish action only; creating content with `status: "published"` (create, create-from, new revision) stays allowed without a review, for data transfer from other systems._

## D80. Approved revisions are locked

Refines D62: the save block rejects updates to any revision with an active review, including an approved one. An approved revision stays locked until published; changes need a new revision and a new review. Exemptions unchanged (`UpdateEntrySystemUseCase`, automation / AI tool bypass context). Resolves S7.

_Refined by D134: only on models bound to a workflow; after the workflow is deleted, leftover approved and rejected reviews no longer lock._

## D81. Full workflow snapshot; delete blocked while in progress

- Each review carries a full snapshot of the workflow it was started with (name, models, all steps with config). Editing a workflow never changes running reviews; no steps are inserted into a running review.
- Editing a workflow is always allowed.
- Deleting a workflow is blocked while any of its reviews is `inProgress`; the error lists the count so the admin knows reviews are running. Finished reviews (approved, rejected, cancelled) do not block deletion and stay readable from their snapshot.

Resolves S8.

## D82. Restart resets

Restart clears the step `comment` and `issues`, keeps the owner, and stores the new task id. Earlier attempts are kept on the step as `runs: [{ taskId, startedOn, finishedOn, outcome, reason }]`. Resolves S9.

## D83. Confirmed spec details

Kept as written in the spec: step timestamps `reachedOn` / `startedOn` / `finishedOn`; `listStepTypes` query (config schemas per step type); `getSettings` / `updateSettings`; `folderExists(id)`; `reassign` as an `assignmentSource` value; approve comment optional, reject comment required. Resolves S10.

## D84. Move rule

Moving the target to another folder is blocked only while its review is `inProgress`. Allowed when the review is approved, rejected or cancelled (rejected reviews stay active forever, D23; a move does not change content). Resolves S11.

_Extended by D134: trashing or deleting the target is refused while a review is in progress; the admin confirms, which cancels the review first._

## D85. Publish keeps system.workflow

Publishing does not change `system.workflow`; the published revision keeps `reviewState: approved`. Today's CMS clearing on publish is removed. The next revision starts clean (D59).

## D86. v1 built-in automation; public abstractions

The automation definition abstraction, its outcome types and the step-type extension point are exported publicly from api-workflows (and the editor-side counterparts from app-workflows) so developers can register any number of automations. Each definition declares a zod settings schema for what the workflow author fills in (D14, D66).

_Superseded in phase 5 (user answers, R155): v1 ships no built-in automation. "Send webhook" (POST to a URL with a secret signing key, read back `{ approved, comment }`) was only an example of what a developer can write; no webhook step ships, nothing signs requests, and the webhook response contract is dropped. Other examples (pull image, create records) are likewise written by developers when needed._

## D87. Run tasks as the requester via withIdentity

Supersedes D58's mechanism (the `TaskService.trigger` `identity` parameter). Workflows triggers AI and automation tasks inside `IdentityContext.withIdentity(requesterIdentity, () => taskService.trigger(...))`, so the task's `createdBy` (and the identity restored at run time) is the requester. `TaskService.trigger` keeps its current interface; api-core does not change. The interface shape is not changed just to pass a different identity.

_Refined by D133: one of the engine's two identity touch points; the engine wraps the trigger itself, including for steps reached inside a task._

_Built in phase 5 (R149): the inline trigger in the automation reach, also on restart (always the requester)._

## D88. UI: review details view

A review details view, reachable from the review bar, lists and widgets, shows the full step timeline: state, owner and actor type, assignment source and reason, comments, AI issues, earlier automation runs. The review bar stays compact (current step and actions).

## D89. UI: who sees assignment reasons

Everyone who can see a review sees assignment outcomes ("Assigned by rule X", "Sent to pool: all candidates excluded"). Per-user skip details and free-text exclusion reasons are visible only to `editor` or `reassign`.

_Refined by D133: the engine returns full data; the app wrapper strips per-user skip entries for viewers without `editor` / `reassign`._

## D90. UI: running and failed automated steps

A running AI or automation step shows "Running", the automation or AI name, and start time. Users with `editor` or `reassign` get a link to the run in the Background Tasks admin. A failed step shows the reason, earlier attempts, and Restart for permitted users.

_Superseded in part by D161: the link is a "Background task" link in the drawer that opens a panel with the run's status, times, iterations and reason, because the Background Tasks admin hides private tasks and has no link by id. Built in phase 8b: the bar and popover read "{Step} running since {hh:mm}" and "{Step} failed: {reason}", the drawer lists the attempts and the AI issues, and Restart is offered to the requester and the operators the server allows (D34, D82)._

## D91. UI: step type chosen once

Step type (Review, Automation, AI) is chosen when adding a step and cannot be changed; delete and re-add instead. AI appears only with the `aiPowerups` licence; Automation only when at least one definition covers the workflow's model.

## D92. UI: explicit workflow save

The workflow editor edits the whole workflow and saves explicitly (no per-step save, no auto-save). It tracks unsaved changes, warns before leaving, and shows server validation errors on the exact step, rule or field.

_Built in phase 9a: Save is enabled only when the draft is dirty, the router and `beforeunload` guards ask before leaving, switching the model asks, edits are ignored while a save is in flight, and server validation errors reach the step and field through D165 (rule-level marking arrives with 9b)._

## D93. UI: request review dialog

Always shown. Contains: review title (prefilled from the entry/page title), a read-only preview of the steps (name, type, how the reviewer is chosen: pool, routed, AI, automation), and a reviewer choice ("Automatic" preselected or a person) only for steps that allow picks. One click to confirm when there is nothing to choose.

## D94. UI: Content Reviews page

Four lists as tabs (Assigned to me, Pool, Team in review, My requests). Filters: model, review state, step state; search by title. Columns: title, model, current step, step state, owner, requester, last change. Row actions follow server flags: open, open in new window, view details, start, take over, reassign. No approve/reject from the list.

_Refined by D133: one Content Reviews view per app; see also D112, D113, D119._

## D95. UI: rule inspector

"Test routing" panel in the review step's assignment section. Inputs: requester user, folder. Output: resulting owner or pool, plus a per-rule trace (matched, not matched, skipped with reason) and the strategy's choice. Evaluates the unsaved step config in the editor, so `inspectRouting` accepts a step config (not only a step id).

_Built in phase 9b (D172): the inspector is the Test routing tab of a People step. It runs `inspectRouting` on the unsaved step with a requester and an optional folder and shows the owner, the trace of every rule, the strategy line and the skipped people; the result is marked out of date when anything it depends on changes and is never re-run automatically._

## D96. UI: notification channels per step

Every step type has the same "Notify via" choice listing registered transports (e-mail today). The in-app websocket message is always sent and not shown as an option. Recipients follow D44; admins choose only channels.

## D97. Exclusion reasons in pickers

Requesters see excluded users in pickers as "Unavailable" without a reason. Users with "Manage workflows" (`editor`) or "Reassign and operate" (`reassign`) see the reason. `listStepCandidates` returns `excludedReason` only to those users. Narrows D43 and D78.

_Refined by D133: the app wrapper strips `excludedReason` for viewers without `editor` / `reassign`._

## D98. Human step type is called "People"

Step types in the UI: People, Automation, AI. "Review" always means one run of a workflow on a revision. (Internal step type id may stay `review`; UI label is "People".)

## D99. Unsaved edits on request

No special handling: requesting a review with unsaved form changes discards those changes. Request review is not disabled and the dialog does not save.

## D100. Minimum lengths

Review title: at least 5 characters. Reject comment: at least 10 characters. Both enforced on the server (and mirrored in the UI).

## D101. AI step picks a model

Supersedes the per-step model role in D40. When creating or editing an AI step, the admin chooses a specific model (required) from the list of available models (ai-powerups `listModels`, `packages/ai-powerups/src/admin/features/listModels/`). The step stores the chosen model. If the model is no longer available, the editor warns and the step fails when reached (restartable after a fix). The "Workflow review" capability still gates whether AI steps can run. _Built in phase 6: the model must have a configured connection and is checked on save for new or changed steps (D139, D141)._

## D102. In-app notification is a toast

An in-app notification is shown as a toast through the existing admin `Notifications` feature (`packages/app-admin/src/features/notifications/`) while the recipient has the admin open. Clicking it opens the content or Review details. No list, history or read/unread state: notifications are not stored (D60), and the Content Reviews tabs show the work. Resolves gap A1 from the design review.

## D103. Which step's channels apply to review-level events

Every notification uses the "Notify via" channels of the step where its event happened: Review approved uses the last step (the one that approved), Review rejected the step that rejected, Review cancelled the step the review was on, A step failed the failed step. Step events (reached, started, reassigned) use their own step as before. No workflow-level channel setting. Resolves gap A2 from the design review.

_Built in phase 7 (D151)._

## D104. No workload counts in reviewer pickers

Reviewer pickers (Request review, Reassign, rule targets) show the person's name and, when it applies, "Unavailable" with the reason (D97). No per-person count of open reviews: it would need a count query per candidate on every picker open, which is expensive with many users, and it would expose colleagues' workload. Resolves gap A3 from the design review.

## D105. One exclusion entry per user

`exclusions[].userId` is unique, enforced on the server when the settings are saved. Expired entries stay until removed. Adding a user who already has an entry (active or expired) is rejected with "This user is already in the list. Edit it instead."; the UI links to that entry. Excluding someone again means editing their entry with a new end date. No exclusion history. Extends D16. Resolves gap A4 from the design review.

_Refined by D180 (phase 9c): the Add picker lists users already in the list as disabled with "In the list", so the admin builds no client duplicate error and no link to the entry. A duplicate that reaches the server (another admin's add) shows "Could not save: This user is already in the list. Edit it instead." in the dialog._

## D106. Exclusion list: last save wins

Saving the exclusion list writes the whole settings record; the last save wins. No version check and no conflict UI. Accepted risk: when two admins edit the list at the same time, one admin's change can be lost silently. Judged rare (few admins, infrequent edits). Resolves gap A5 from the design review.

_Built in phase 9c (D178): Add, Edit and Remove each save at once from their dialog, sending the list from the last load or the last successful save with exactly one change; the record the server returns becomes the list._

## D107. Automated steps are named by their step title

Wherever the UI or a notification names who decided or who owns a step, AI and Automation steps are shown by their step title (e.g. "Notify web team"), never by the automation's or model's name, because one automation can back several steps. People steps show the person. A rejection without a comment drops the quote: "Rejected at {step} by {decider}." Resolves gaps A6 and F11 from the design review.

## D108. A workflow needs at least one step

Saving a workflow with no steps is rejected on the server and in the editor ("Add at least one step."). The editor still lets the admin delete the last step while editing. To stop requiring reviews for a model, delete its workflow. Resolves gap A7 from the design review.

## D109. AI instructions are required

An AI step's Instructions (the reviewer prompt) must be non-empty, enforced on the server and in the editor. No minimum length and no default prompt. Resolves gap A8 from the design review.

## D110. Exclusion end dates across timezones

Extends D73. The timezone used when saving is the browser's (there is no profile timezone). Active or Expired is computed from the stored UTC instant, the same for every viewer. The list shows the end date in the viewer's local time; hovering shows the full local time and timezone name, e.g. "Until 3 Nov 2026, 23:59 (Europe/Zagreb)". The saving admin's timezone is not stored. Resolves gap A9 from the design review.

_Refined by D179 (phase 9c): the hover reads "Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)" (weekday, date, time, the short zone name and the IANA zone); without a resolvable timezone the zone is UTC._

## D111. Take over can notify the previous owner

The Take over dialog has a checkbox "Notify {name} that you took over", checked by default. When checked, the previous owner gets "{taker} took over {step} on {title}." in-app and through the step's channels (D103). The take-over action carries `notifyPreviousOwner` (default true). Reassignment keeps notifying both previous and new owner, with no opt-out. Resolves gap A10 from the design review.

_Built in phase 7: the flag travels on the fact (D154)._

## D112. "Failed steps" tab for operators

Content Reviews gets a fifth tab, **Failed steps**, shown only to users with Reassign and operate. It lists every AI or Automation step in state Failed on reviews the user can read, with the same columns, filters (model, title) and incremental loading as the other tabs. Row actions add Restart and Cancel review where allowed (§1.6). One extra list query by step state. Resolves gap A11 from the design review.

_Refined by D133: per app; the app wrapper shows the tab and runs the query only with `reassign`._

## D113. "Content type" in lists

Content Reviews, its filters and the dashboard widgets call the model column and filter **Content type**, shown as name plus app (e.g. "Article · Headless CMS", "Pages · Website Builder"; Pages listed first). "Model" stays where an admin works with a specific CMS model (workflow editor, model delete). Adopts the designer's UI-9. Resolves gap A12 from the design review.

_Refined by D133: lists are per app, so the app suffix and the WB column and filter (Pages only) are no longer needed; the CMS view keeps the content type column and filter._

## D114. Start asks for confirmation

Start (taking a step from the team pool) asks for confirmation everywhere it is offered, in the editors and in the Content Reviews list: "You become the owner of this step and it leaves the team pool." On confirm, a toast says where the step went ("It's now in Assigned to me."). Resolves gap A13 from the design review.

## D115. Blocked workflow delete lists the blocking reviews

Extends D81. The delete-blocked error carries the exact count of in-progress reviews and up to 5 of them, each with the content reference (model, entry or page id, revision), title, step position ("Step n of N") and step name. Only reviews the admin can read are listed; the count stays exact regardless. The dialog body depends on the viewer's permission (with or without Reassign and operate). From design answer QBZ-19.

_Refined by D133: the engine's error carries the exact count and the blocking reviews; the app wrapper keeps the first 5 the caller can read._

## D116. Model list in the workflow editor is paged and searched on the server

The editor's model list loads 20 models at a time, sorted by name, with "Load more" and no counts. Search runs on the server; a new search starts again at the first page. The list query used by the editor takes `search`, `limit` and a cursor. From design answer QBZ-20.

_Refined by D133: the editor's model list is a CMS operation; the WB editor has the single item Pages and needs no list._

## D117. Editor resolves saved references for display

When the editor loads a workflow, saved user and folder references (rule targets, folder conditions) are resolved by id so a value is never shown empty. A user that no longer exists shows as "Deleted user" with the warning "The assigned user was deleted."; routing already skips such a rule (D46). Folders use the D69 checks: "Restricted folder" when the admin cannot see it, "Deleted folder" with "The folder no longer exists." when it is gone. The user lookup accepts a list of ids and reports which ones do not exist. From design answer QBZ-7.

_Built in phase 9b: the editor presenter resolves the saved user, team and folder ids of rules by id (users with `listUsers({ ids })` in chunks of 200, teams with `listTeams({ ids })`, folders from the adapter's list and then `folderExists`). The labels are "Deleted user", "Deleted team", "Restricted folder" and "Deleted folder"; a failed lookup shows the banner "Could not load the step options." with Try again instead of an empty value._

## D118. Rules targeting an excluded person are skipped

Extends D46. When a routing rule matches but its target person is currently excluded (D16), the rule is skipped and evaluation continues with the next rule, then the strategy. The routing trace (and Test routing) marks the rule "Skipped" with the exclusion reason and lists the person among skipped people. The rule card in the editor warns "{name} is unavailable (excluded until …). The rule is skipped while the exclusion lasts." From design answer QBZ-41.
_Built in phase 4 (R129): the inspector's trace and its skipped-people list show the exclusion's own reason ("Excluded from reviews." when it has none); assignment-log records keep the fixed text (D89, D97)._

_Built in phase 9b: the editor does not show exclusions. Test routing shows a rule that was skipped because its target is excluded and lists the person among the skipped people with the server's reason (D172, D175)._

## D119. Review "last change" and list sorting

Each review keeps a `lastChangedOn` timestamp, updated on every review event: requested, step reached, started, taken over, reassigned, approved, rejected, failed, restarted, and content updated by a step. Edits made outside the review do not update it. Content Reviews lists sort only by it: oldest first by default in Assigned to me, Team pool, Team in review and Failed steps (work queues), newest first in My requests; the user can toggle the direction, and switching tabs resets it. The list queries take `sort: lastChangedOn asc | desc`; load more continues in the current order. For approved reviews the list shows the last step and its owner; for rejected ones the rejecting step and who rejected it (D107 naming). From design answers QBZ-69 and QBZ-70.

_Refined by D133: sorting and paging apply within one app's list._

## D120. Step descriptions are shown to users

A step's description is shown to the requester in the Request review steps preview and to everyone with access in Review details, under the step name. The steps preview and Review details queries return it. Placeholders in the editor differ per step type. From design answer QBZ-46.

## D121. Unpublished approved revisions can be republished

An approved revision that was published and later unpublished can be published again without a new review: the approval covers the revision's content, which cannot change after approval. The review bar keeps "Review: Approved" with Publish enabled; the editor tag shows the app's own "Unpublished" status; the read-only reason is the app's usual one for non-draft revisions. Applies to CMS entries and Website Builder pages. Resolves final-check item H1.

## D122. Unavailable step types are shown disabled

Revises D91: in Add step, every step type is listed. AI without the `aiPowerups` licence and Automation with no definition covering the workflow's model are shown disabled with the reason ("Requires AI Power-Ups", "No automations are available for this model" / "for pages"), and cannot be added. Resolves final-check item H2. _Phase 6 registers the `ai` type when both `aiPowerups` and `advancedPublishingWorkflow` are on (D148); otherwise the disabled row stays._

_Built in phase 9a with the design's copy: AI shows "Requires the AI Power-Ups licence."; Automation shows "No automations are available for this model." (CMS) or "No automations are available for pages." (Website Builder); any other unavailable type shows the server's `unavailableReason`. An automation is addable when one definition's scope covers the model (`*`, `<app>.*` or the exact namespace)._

## D123. Deleted-while-editing dialog without who and when

No tombstone is kept for deleted workflows. When a save finds the workflow gone, the dialog reads "“{workflow}” was deleted while you were editing, so your changes were not saved. Save them as a new workflow for {model}, or discard them." with Discard changes / Save as new workflow. The server only reports that the workflow no longer exists. Resolves final-check item H3.

## D124. Exclusion end date display and editing

Refines D110. The list cell shows "End of {date}" when the stored instant falls at 23:59 in the viewer's timezone, otherwise date and time ("4 Nov 2026, 06:59"); hover shows the full time with the timezone. The Edit dialog pre-fills the viewer's local date. If the date is not changed, the stored instant is kept exactly; only a changed date is recomputed to the end of the newly picked local day. Resolves final-check item H4.

_Built in phase 9c (D179): "End of {d Mon yyyy}" when the instant is 23:59 local, else "{d Mon yyyy}, {HH:mm}", with fixed English month names; "Until removed" for no date. "Pick today or a later date." shows only when the date was changed._

## D125. One toast stack for everything

Extends D102. Every toast in workflows UI — incoming notifications and confirmations of the user's own actions in the editors and Content Reviews — goes through the existing admin `Notifications` feature as one stack: bottom right, 8 seconds, paused on hover or focus, up to 3, newest at the bottom, with a close button and an optional link. No separate confirmation pill. Resolves final-check item H5.

## D126. No "by" when a step rejects itself

Refines D107. When the decider is the rejecting step itself (AI and Automation steps), a rejection without a comment reads "Rejected at {step}." instead of repeating the title after "by". People steps keep "Rejected at {step} by {person}." Applies to the review bar, popover, Review details and the "Review rejected" notification. From design answer QBZ-83.

## D127. Assignment details on review steps

Each `ReviewStep` carries `assignment?: { source; ruleId?; reason?; by?: Actor }` (sources: rule id, `strategy`, `picked`, `pool`, `poolStart`, `takeOver`, `reassign`). `by` names who acted for reassign and take over. `getReview` returns the step's assignment-log entries for "why this owner"; per-user skip entries (requester, excluded with reason, can't read) only to users with `editor` or `reassign` [D89]. Resolves spec review finding 1.

_Refined by D133: the engine returns every entry; the app wrapper redacts per-user skip entries._

## D128. Reviewer candidates for reassign

`listStepCandidates` has two forms: `(workflowId, stepId)` for Request review (write access to the model, live workflow) and `(reviewId, stepId)` for Reassign (`reassign` permission, resolved from the review's snapshot and the step's `candidateTeamIds`). Both return name, `excluded` and, for `editor` / `reassign`, `excludedReason`; no workload counts [D97, D104]. Resolves spec review finding 3.

_Refined by D133: `listStepCandidates` is per app; the wrapper checks write access or `reassign` and redacts `excludedReason`._
_Built in phase 4: `listCmsEntryStepCandidates` / `listWebsiteBuilderPageStepCandidates` (request; they also take the target revision, so read access is checked per candidate; the workflow must belong to the app, another app's workflow is not found, R128) and `listCmsEntryReviewStepCandidates` / `listWebsiteBuilderPageReviewStepCandidates` (reassign)._

## D129. Transport list for "Notify via"

`listNotificationTransports` returns the registered transports (`id`, `title`, optional `description`), permission `editor`. The editor shows them as the "Notify via" list, or "Only in-app notifications are available." when there are none [D96]. Resolves spec review finding 6.

_Refined by D133: a shared configuration operation in api-workflows (`editor`)._

_Built in phase 7: `listNotificationTransports` (D152)._

## D130. Editor model list and step type availability

The editor's model list query (D116) requires `editor`; each row carries the bound workflow's id and name, if any. `listStepTypes` returns `available: boolean` and `unavailableReason` per type (AI: missing `aiPowerups` licence; Automation: no definition covering the model) for D122. Resolves spec review findings 7 and 8.

_Refined by D133: the model list is CMS-only; `listStepTypes` is a shared configuration operation._

## D131. Optimistic check on workflow save

`storeWorkflow` takes the `savedOn` the editor loaded. If the stored workflow's `savedOn` differs, the save fails with `Workflows/Workflow/Conflict` (data: who saved and when, from the stored record); if the workflow no longer exists, with `Workflows/Workflow/NotFound` [D123]. The editor shows the conflict dialog (reload, losing unsaved edits) or the deleted dialog. Reviews keep no optimistic locking (D27). Resolves spec review finding 9.

_Refined by D132 and D133: the base `StoreWorkflow` use case takes `savedOn`; each app's store mutation (e.g. `storeWebsiteBuilderPageWorkflow`) passes it through._

## D132. api-workflows is an internal engine; apps own checks and GraphQL

The use cases in `api-workflows` are internal. They take an explicit actor, read no identity and check no permissions (as built in phase 1a, R6). Nothing outside the backend calls them directly.

Each app wraps them in its own use cases and GraphQL operations, for example `StoreWebsiteBuilderPageWorkflow` (use case and mutation) and the CMS equivalents. The wrapper reads the identity, builds the actor and the actor's team ids, checks the `workflows` permission and access to the target, then calls the base use case. There is no shared `storeWorkflow` mutation.

AI and automation tasks (phase 5) call the base use cases directly with an `ai` or `automation` actor.

`api-workflows` provides the shared building blocks the wrappers use: the permission checker (`editor`, `reassign`, full access), the current user's team lookup, and viewer-flag computation from actor, teams, permissions and review.

Refines D54, D78 and spec sections 8 and 10. App-neutral operations (settings, `listUsers`, step types, notification transports) are placed in the phase 3 plan. Decided 2026-10-10.

_Refined by D133: no cross-app reviews; the app-neutral operations are the shared configuration operations in api-workflows (`editor` only); the engine's two identity touch points; API-key actors._

## D133. No cross-app workflows; shared configuration operations; engine identity touch points

Refines D132. Decided 2026-10-11.

1. **No cross-app reviews.** CMS and Website Builder each have their own review lists, Content Reviews view, dashboard widgets and `getReview`. Nothing merges CMS and WB reviews: no combined list, no shared cursor, no cross-app "Content type" filter. Each app checks its own permissions (model, folder and content access) in its own operations. Where D47, D71, D76, D94, D112, D113 and D119 describe one combined list or page, their semantics apply per app.
2. **Shared configuration operations.** App-neutral configuration is one small set of operations in api-workflows: tenant settings and exclusions, `listUsers`, step types, notification transports, automation definitions and AI tools. They are guarded only by `workflows.editor` (full access included). These are the only api-workflows operations exposed outside the backend; the api-workflows use cases themselves stay internal (D132).
3. **Per app:** `inspectRouting`, `folderExists` (with the folder `type`) and `listStepCandidates`, because they involve the model, folders and content permissions. Workflow CRUD (store, delete, list, get) is also wrapped per app, e.g. `StoreWebsiteBuilderPageWorkflow`; `actor` on workflow events therefore lands with the phase 2 wrappers.
4. **Engine identity touch points (the only two).** (a) Candidate read access during routing and reassign (D61): the engine asks the app's target adapter for the review's namespace, e.g. `canUserRead(userId, target)`, and each app answers with its own permission logic. (b) The engine triggers AI and automation tasks inside `withIdentity(requester)` (D87), so records the task writes are attributed to the requester. Permission logic is always app-supplied; the engine never checks the caller's permissions.
5. **API keys may act in reviews.** The app wrapper builds a `user`-type actor with `identityType: "api-key"` (D30 field). The same rules apply: the `workflows` permission, team membership for start and take over, target access. A key with no team cannot start pool steps but can act where teams are not required (request, cancel its own review, act with `reassign`).
6. `ListNotificationTypesUseCase` (engine) drops its own `editor` check; the shared transports operation (point 2) does the check.
7. **Cancel and restart require target read access** in the app wrapper, like every other wrapper action (decided 2026-10-11); a user with `workflows.reassign` and access can cancel on the requester's behalf.

Consequences stated in the spec: the engine's list use case takes the viewer's user id, team ids and a target-read predicate from the app wrapper and runs the fill-the-page pagination (D76); the engine returns full data and the wrapper redacts per-user skip entries and `excludedReason` for viewers without `editor` / `reassign` (D89, D97, D127, D128); the delete-blocked error carries the exact count and the blocking reviews, and the app wrapper keeps the first 5 the caller can read (D115); the base `StoreWorkflow` use case takes `savedOn` and each app's store mutation passes it (D131); the editor's model list is a CMS operation (D116, D130); one `workflows` permission serves every app's wrappers (D54).

## D134. Trash and delete with a review in progress; create as published; bound-model guards

Decided 2026-10-12 (phase 2 plan review).

1. **Trash with a review in progress is refused.** Trashing a CMS entry or a Website Builder page that has an in-progress review fails on the server with `Workflows/Review/ActiveReviewOnTrash` (data: the target, the action and each in-progress review's id, title and current step). The admin shows a warning ("This content has a review in progress. Trashing it cancels the review."): Cancel stops; Confirm continues to the normal trash dialog, and trashing then cancels the review first. The confirm path is the app's own wrapper use case that cancels the target's in-progress reviews for the delete (`CancelCmsEntryReviewsForDelete`, `CancelWebsiteBuilderPageReviewsForDelete`), called by the admin right before the trash. Anyone who may trash the content may confirm, even without cancel rights (requester or `reassign`); the review is recorded as cancelled by that user with reason "content trashed". The admin dialogs are phase 8a; phase 2 delivers the server side.
2. **Creating content as published stays allowed.** Create, create-from and new revision with `status: "published"` on a workflow-bound model need no review; data transfer from other systems relies on it. The publish rule (D79) applies to the publish action only.
3. **Delete with a review in progress is refused the same way.** Deleting a single revision, `deleteMultiple`, a permanent delete through the API and a Website Builder page delete fail with the same error (action `delete`) while the target (or the deleted revision) has an in-progress review. The confirm path cancels the review (reason "content deleted") and the delete proceeds; the review and its assignment records are then deleted with the content (spec 9.3). Applies to CMS and Website Builder.
4. **The CMS "fully delete model" background task is refused at start** for a model bound to a workflow, with `Workflows/Model/BoundToWorkflow`, before anything is deleted (the task deletes every entry before it calls `DeleteModelUseCase`, so the D64 decorator alone comes too late).
5. **The save block looks up reviews only on bound models.** It first checks whether the model is bound to a workflow; unbound models never look up reviews, so they stay editable when the review lookup fails, and after a workflow is deleted its leftover approved and rejected reviews no longer lock their revisions. Refines D62 and D80.
6. **The api-core permission fix stays on the workflows branch.** The per-identity permission cache and the new `withAuthorization` land as clearly labelled commits at the start of phase 2.1, with the full api-core suite (DDB and SQL) and the neighbouring package suites run.

Refines D62, D79, D80 and D84 (spec 4.5, 5.1, 9.2, 9.3). The order of the warning and the normal dialog in points 1 and 3 is superseded by D157.

Confirmed 2026-10-12: the bound-workflow lookup fails closed (a failed workflow list refuses updates, moves, trash and delete on bound-or-unknown models); move, trash and delete are refused when any revision of the entry has an in-progress review; the move, trash and delete rules check the workflow binding first, like the save block.

## D135. Review title from the content, editable on request

The review title defaults to the content's title (entry or page title, as today). The requester may change it when requesting the review: the request wrappers take an optional `title`; when given it must have at least 5 characters after trimming (D100), otherwise the content's title is used. The title is fixed once the review exists.

Refines D100 and spec 10 (request review input). Decided 2026-10-13.

## D136. Where the GraphQL operations live

Everything is on the main `/graphql` endpoint, so the shared review UI talks to one endpoint. Nothing goes on the `/cms/*` endpoints.

- Root `workflows`: the shared configuration operations only (settings, step types; later users, transports, automation definitions, AI tools).
- Root `websiteBuilder` (the existing `WbQuery` / `WbMutation`): every Website Builder pages workflow and review operation.
- Root `cms` (the existing `CmsQuery` / `CmsMutation`, which `getEntry(modelId, ...)` and ai-powerups' `compareEntryRevisions` already use): every Headless CMS workflow and review operation. Operations that address one model take `modelId` as an argument, like the existing `CmsQuery` operations; operations that take a review id (get review, start, take over, approve, reject, cancel) take no model.

Settles spec 10 "final names" placement. Decided 2026-10-13 (first recorded with CMS operations on `/cms/manage`; changed the same day).

## D137. Least loaded counts per app

The `leastLoaded` strategy counts a candidate's load only within the review's app: in-review reviews they own whose namespace belongs to the same app (CMS: every `cms.*` namespace; Website Builder: `wb.page`). The tie-break ("least recently assigned") also looks only at the same app's assignments. Consistent with D133 (nothing crosses apps).

Refines spec 6 (strategy) and D20, D63. Decided 2026-10-13.

## D138. AI step shape: names, config, editor row

`AI_STEP_TYPE = "ai"`. `AiStepConfig { instructions, model, tools }` (`tools` default `[]`, `model` is the full id `<providerId>/<modelId>`). Capability `workflows.review`, label "Workflow review", default role standard. The AI actor is `{ type: "ai", id: <requester id>, displayName: <requester displayName> }` (D58, D107). With the type registered the `listStepTypes` row comes from the registry (`available: true`, JSON schema config with a textarea hint on `instructions`); without it the disabled placeholder stays. The shared operations are `listAiTools` (api-workflows) and `listAiModels` (ai-powerups, only when both flags are on), `editor` only, rows without schemas.

Covers R164, R166, R176. Refines D56, D122, D130. Decided 2026-10-14 (phase 6 plan R164, R166, R176).

## D139. Save-time AI validation: pure rules, then the model check for changed steps only

Exact texts: `Step "<title>" needs instructions.`, `Step "<title>" needs a model.`, `Step "<title>" uses the AI tool "<name>", which is not defined.`; duplicate tools are deduplicated. Check-time failures: `Step "<title>" has an invalid AI configuration.` (config no longer parses) and `Step "<title>" could not be checked: the configured AI models could not be loaded.` (the model list could not be read). The model check is a second, async hook on `StepType` (`checkConfig`): `Step "<title>" uses the model "<model>", which is not available.`; it runs after the pure validation of all steps and the conflict, not-found and same-model checks, and only for steps that are new or whose config changed, so a workflow whose connection was removed later can still be saved without touching that step. A throw is a persistence error.

Covers R165. Refines D101, D109. Decided 2026-10-14 (phase 6 plan R165).

## D140. One task runner for every step type

`workflowsStepRun` stays the one private task; a multi-registered `StepRunner` (type, `singleRun`, fixed failure reasons, `getActor`, `maxIterationsReason`, `run`) holds what differs per type and the handler dispatches by step type. Automation behaviour is byte for byte unchanged; the AI runner is single-run (the handler persists the output before calling it and refuses a re-entered task). A step type with no runner fails with the "not available" reason and neutral texts; stuck detection covers every step type. One shared reach service starts the task for both types.

The task cleans itself up when it finishes (`selfCleanup: "always"`), because every outcome is already on the step; a step whose task is gone is handled by stuck detection (grace from the step start) (R179). Private tasks: R180.

Covers R168, R179, R180 and user answer Q1. Refines D57, D87. Decided 2026-10-14 (phase 6 plan R168, R179, R180).

_Refined by D161: the step run task is no longer cleaned up when it finishes; it is kept until its review is deleted (R256)._

## D141. One source for "models with a configured connection"

`ConfiguredAiModelsService` lists the models of providers that have a connection preset with a stored key and finds the connection for a model; the editor's `listAiModels`, the save check and the capability resolver all use it, and `Ai.listModelsByConnections()` is not used. `ResolveAiCapabilityUseCase.execute(capabilityId, model?)` takes the step's model; the capability must still be enabled; an unavailable model fails with `The model "<model>" is not available. Add a connection for its provider under Settings → AI Power-Ups.` A listed model does not prove the key works (a bad key fails the run).

Covers R169, A60 and user answer Q2. Refines D101, D56. Decided 2026-10-14 (phase 6 plan R169).

## D142. Workflow AI tool registry

A multi-registered `WorkflowAiTool` abstraction (name `^[A-Za-z][A-Za-z0-9_]{0,63}$`, title, description, zod input schema, `execute(input, context)` returning `{ ok, data?, error? }`); the context carries review, step, requester and task so a handler takes no id from the model; the last registration of a name wins; an invalid name is dropped and logged, never thrown; a step must allowlist a tool for the model to see it; turning tools into AI SDK tools is the runner's job (api-workflows has no AI dependency). The registry is a singleton per container, so a tool keeps no per-call state.

Covers R167, A61. Refines D55. Decided 2026-10-14 (phase 6 plan R167, A61).

## D143. AI writes are bounded and atomic

The `ReviewTargetEditor` port reads in full with a `writable` verdict per field and writes a bounded set: CMS top-level and nested-object scalar fields (text, long text, number, boolean, datetime, not lists); Website Builder `properties.title` and the SEO scalars (title, description, canonical URL, noIndex, noFollow). Everything else is read-only (dynamic zones, references, files, rich text, element tree, bindings, metadata, path, language). One bad path or value writes nothing; failure texts are safe to show the model and real errors are logged.

Covers R172 and user answer Q3. Refines D39. Decided 2026-10-14 (phase 6 plan R172).

## D144. The AI writes only through tools, guarded, under the bypass

The model call has no write access of its own. `updateTargetFields` re-reads the stored review and refuses when the step is no longer this task's, or when the check fails (fail-closed); only its write runs inside the workflow bypass, which lifts the save block only. The narrow race between the check and the write is accepted (A59); a custom tool's write path is its developer's responsibility (A61).

Covers R173. Refines D36, D62. Decided 2026-10-14 (phase 6 plan R173).

## D145. AI outcome, issues and fixed failure reasons

The model answers `{ approved, comment, issues[] }`; approve keeps the comment (empty allowed), reject needs a trimmed comment of at least the minimum length (D100); the decision goes through the base use cases with the `ai` actor and `actorTeamIds: []`. `issues` (`fieldPath`, `severity`, `message`, `suggestion`; at most 50, long fields clamped) are stored on the review step, default `[]`, reset by restart; facts and events carry none. Every failure writes one of these fixed reasons, and raw provider, storage and thrown messages are only logged:

- `The AI step configuration is not valid.`
- `The AI tool "<name>" is not available.`
- `The AI review capability is not available.`
- `The model "<model>" is not available.`
- `The content is too large for the AI review.`
- `The AI review timed out.`
- `The AI review failed.`
- `The AI review returned no decision.`
- `The AI review rejected without a comment.`
- `The AI review did not finish in 20 steps.`
- `The AI review was aborted.`
- `The AI review task ended without a result.`
- `The AI review could not be started.`

Covers R170, R171. Refines D39, D100. Decided 2026-10-14 (phase 6 plan R170, R171).

## D146. Prompt composition and injection

System prompt: capability guidance plus additional instructions; user message: labelled content, previous comments, then the step instructions in a delimited block; the guidance states that content under review is data. The content and the comments are JSON with `<` escaped. No default prompt (D109). Prompt injection is mitigated by scope (tool context, allowlist, bounded writes, a reject needs a comment), not by detection (A58).

Covers R174. Refines D39, D109. Decided 2026-10-14 (phase 6 plan R174, A58).

## D147. Limits, timeout and cancel for AI runs

Input cap 200000 characters, fails before any model call, no truncation ever; at most 20 tool steps; the call is aborted 30 seconds before the task's runtime ends; a cancel or restart is seen through a throttled (5 seconds) re-read of the stored review and stops the call between tool steps, because the task's own abort flag does not see another request's cancel; a stopped call is discarded and writes nothing; a failed check read does not stop the call.

Covers R175, A56, A59 and user answer Q4. Refines D7, D27. Decided 2026-10-14 (phase 6 plan R175).

## D148. Dependency direction and registration gate for AI

`ai-powerups` depends on `api-workflows`, never the reverse; the `ai` step type, runner, capability and `listAiModels` are registered only when both `aiPowerups` and `advancedPublishingWorkflow` are on, and the step type and runner are registered last, together, so no workflow can save an AI step the runner cannot run. With only `aiPowerups` on the schema stays valid and has no `listAiModels` field.

Covers R177, R178 and user answer Q5. Refines D56. Decided 2026-10-14 (phase 6 plan R177, R178). Developer guide: `docs/.bruno/workflows/ai-tools.md`.

## D149. Websocket delivery is tenant-scoped by the notifier

For each recipient the notifier lists the recipient's connections (`WebsocketsListConnectionsUseCase`, `where: { identityId }`), keeps the connections whose `tenant` is the current tenant (`TenantContext`, set in a request, an event handler and the background-task step run alike) and sends to them with `WebsocketsSendToConnectionsUseCase`, one send per recipient, ten recipients at a time. `WebsocketsSendToIdentityUseCase` is not used; the notifier delivers only to the recipient's connections in the review's tenant (R188, A63).

A recipient with an empty id is skipped without a list call (an empty `identityId` would list every connection). No current tenant: nothing is sent and it is logged once. A recipient connected only elsewhere gets nothing and that is not an error. Only connections younger than 3 hours are listed; no inbox, no retry (D60). The message carries no tenant data.

Covers R187, R188, R197, A63. Refines D60. Decided 2026-10-15 (phase 7 plan R187, R188, R197).

## D150. Which events notify, to whom, and the self-skip rule

Exactly the D44 rows plus the take-over notice: step reached (pool: the members of the step's candidate teams who may read the content and are not excluded, never the requester; owner: a user owner), reassign (new and old owner, two messages), take over (the previous owner, if a user and the taker did not opt out), approved, rejected and failed (the requester), cancelled (the owner of the step the review was on, if a user). Nothing for requested, an intermediate approve, a pool start or a restart. AI and automation owners are never notified as owners.

A recipient equal to the actor is dropped only when the actor is a `user`: AI and automation actors carry the requester's id (D58), so the requester still hears about their own rejected or failed review; a failed step never drops anyone. One handler per event; handlers catch everything.

Covers R181, R182, R183, R184, A64, A66, A67. Refines D44, D58. Decided 2026-10-15 (phase 7 plan R181-R184).

## D151. Channels per step; unknown and duplicate transport ids

Every message goes through the websocket and through every transport on the step named in the table of D103, in that step's order, deduplicated by id. Transport ids are not validated when a workflow is saved: a transport unregistered later must not block editing or notifying; an unknown id is skipped and logged once with `A step names a notification transport that is not registered.`

Covers R186, R192. Refines D96, D103. Decided 2026-10-15 (phase 7 plan R186, R192).

## D152. Transports operation and message shape

`ListNotificationTypes*` became `ListNotificationTransports*`; the transport has an optional `description`; the leftover `NotificationType*` abstractions were deleted. The shared `listNotificationTransports` operation (`editor` only, no engine check, D133) returns `{ id, title, description }` sorted by title; the editor shows `Only in-app notifications are available.` when it is empty (client). The transport message is `{ title, body, url, linkLabel }` (subject, plain text, link or `null`, link text). The contract of `send` is stated on the abstraction: it never throws and never fails the notification.

Covers R190, R191. Refines D129, D133. Decided 2026-10-15 (phase 7 plan R190, R191). Developer guide: `docs/.bruno/workflows/notifications.md`.

## D153. E-mail transport as built

HTML-escapes every interpolated value, converts newlines after escaping, sends the text as the plain body, appends the link to both parts when there is one, keeps one-line subjects (CR, LF and whitespace runs collapsed), sends to bare bcc addresses (no display names), keeps an address only if it has exactly one `@` with text on both sides and no whitespace, comma, semicolon or angle bracket, deduplicates addresses, sends one mail per 50 recipients and logs each failed chunk once with `errorCode`, `errorName` and the recipient ids (never an address, never the error message) under `Could not send a workflow notification e-mail.`; the next chunk still goes out. A failed Result (a mailer validation failure included) and a throw (a mail event handler may throw) are each logged once per chunk with the same fixed text and fields; the transport never throws.

The transport sends through `SendMailUseCase` (`@webiny/api-mailer`), the public send API, not through `MailerService`: the mailer's validation applies, and the Mail before-send, after-send and send-error events fire for workflow e-mails, so user event handlers see them. Those handlers run inside the review action and are awaited, so a mail event handler must be quick; a throwing one is caught and logged and never fails the action. Decided 2026-10-16.

Recipients come from `NotificationRecipientService`, which looks users up inside `withoutAuthorization` around that one call and returns them as stored; address filtering lives in the mail transport only. The mail has no sender of its own: the mailer defaults `from` to its settings (R201).

Covers R193, R194, R201. Refines D44. Decided 2026-10-15 (phase 7 plan R193, R194, R201).

## D154. Take-over flag on the fact

`notifyPreviousOwner` (default true; a missing value counts as true) goes from the CMS and Website Builder GraphQL mutations through the wrappers and the engine use case to `ReviewStepTakenOverFact`, always set. The event is the only carrier: nothing is stored, no per-user setting, no reuse of the exclusion settings (D105). Reassign has no flag.

Covers R185, R198. Refines D111. Decided 2026-10-15 (phase 7 plan R185, R198).

## D155. Messages and links: simplified copy

Message texts follow the design copy, simplified where the data is not at hand (A62): no team name (the pool text says "the team pool"), no rule name in the assignment reason, no per-recipient greeting, no detail card in the e-mail, every link opens the content (also where the design says "review details"; a cancel caused by trashed or deleted content links to content that may be in the trash, accepted). A cancel has three texts: a normal cancel names the canceller, `content trashed` and `content deleted` say the content was moved to the trash or deleted; any other reason is never printed. AI and automation deciders are named by their step title, a blank person name reads `A user`, the rejection comment is clamped to 300 characters.

A message contains only the content title, step titles, display names of people in the review, the clamped comment, the fixed failure reason and (websocket) ids and the namespace, (e-mail) the link; never field values, model names, team names or error text. The e-mail link is the admin host from service discovery (no manifest, no link), the path from the target's app through the `ReviewTargetLink` port (CMS content entry, Website Builder page editor, mirroring the admin routes) and the current tenant's id (the review's own tenant) as the `tenantId` query parameter; the websocket carries no URL.

Covers R189, R195, R200, A62. Refines D44, D107, D126, D133. Decided 2026-10-15 (phase 7 plan R189, R195, R200).

## D156. Failure handling and latency

The notifier never throws and never returns a failure; every dependency call (websocket list and send, user lookup, member lookup, service discovery, each transport) sits in its own try/catch or Result check, is logged once with a fixed text and the error code and name only (never the error object, the message or an address; only a websocket error may add its message), and does not stop the rest. The logged fields come from the pure `getErrorLogFields` (code and name only when they are strings), shared by the notifier and the handlers. Every handler wraps its whole body in a try/catch and logs `A workflow notification handler failed.`; a step a handler cannot find is logged once with `Could not find the step for a workflow notification.`

A mailer or websocket failure never fails a review action that is already saved. Handlers are awaited inside the request, so mail and websocket latency adds to the action; bounded concurrency and one mail per event keep it small, and bulk cancels notify serially. Delivery is at most once per published fact with no dedupe store and no retry; a process that dies after the save loses that notification. One accepted exception: concurrent stuck detection or a late task hook can publish `stepFailed` twice and notify the requester twice (A64).

Covers R196, A64, A65. Refines D44. Decided 2026-10-15 (phase 7 plan R196, A64, A65).

## D157. Trash and delete warning driven by the server refusal

The normal trash or delete confirmation runs first. The server refuses with `Workflows/Review/ActiveReviewOnTrash` (D134); the admin then shows a warning that lists the blocking reviews as "{title} · Step {n} of {m} ({step name})" under the D134 text ("This content has a review in progress. Trashing it cancels the review.", "Deleting it cancels the review." for a delete). **Confirm** calls the app's cancel-for-delete wrapper (`CancelCmsEntryReviewsForDelete`, `CancelWebsiteBuilderPageReviewsForDelete`), once per distinct target and scoped to the revision when one revision is deleted, and then repeats the action once, with no second confirm. **Dismiss** changes nothing. Any other error is shown as before. The rule covers trash, single revision delete, permanent delete and bulk delete; for a bulk run the refusals of the whole run are collected, one warning lists every blocking review, and only the blocked items are retried. The one gap: a bulk action over "all selected" content runs as a background task, and refusals inside the task are not visible to the client, so that path has no pre-warning.

Two documented exceptions to "normal dialog first": the Website Builder revision delete has no first confirmation dialog in the admin, so there the warning is the only dialog (the order does not apply); and the CMS bulk dialog is a generic dialog, so the named warning stacks over the busy bulk dialog. A bulk retry replaces the results report with the retried items only (accepted, Q27); the first pass shows one `Notifications.warning` toast "{done} of {total} items done. {n} still need your confirmation." (copy approved by the user, Q28). During a bulk run the per-item decorators record the refusal and report the item as not deleted instead of throwing. The phase also fixes a base CMS bug the flow exposed: `RevisionsListPresenter.deleteRevision` never deleted a revision because of an inverted confirm check, and several callers ignored a `false` result (bulk action, trash bin, form presenter); on the Website Builder side the page delete use cases now return a boolean and their callers treat `false` as "not done" (separate `fix` and `refactor` commits).

The base gateways of both apps (CMS delete, delete revision, permanently delete, bulk action; WB delete page, delete page revision, trash bin delete, trash bin bulk action) throw one typed `GraphQLOperationError` that carries the error code and data, so the workflows packages decorate the use cases and react to the code; nothing else in those gateways changes.

**Supersedes** the order in D134 points 1 and 3 ("the warning first, then the normal trash dialog"). The cancel-for-delete confirm path and the rule that anyone who may trash or delete the content may confirm stay as D134 says.

Covers R204, R205, R228, R249. Decided 2026-10-16 (phase 8a plan, user answers Q3, Q4, Q20, Q25, Q27, Q28).

_Refined by D164: the CMS bulk trash of all loaded rows now pre-checks by entry ids before it starts its background task, so the gap named above is closed for the CMS._

## D158. Review steps carry `candidateTeams`

A review step carries `candidateTeams: [{ id, name }]` next to `candidateTeamIds`, so the client can write "Waiting in the {Team} team pool" and "Team pool ({names})" (spec 13.4). It is resolved at read time in `api-workflows` from `candidateTeamIds` and never stored. Team lookup needs the `security.team` permission that a reviewer does not have, so exactly that lookup (and nothing else) runs without authorization and exposes only `id` and `name`; ids are de-duplicated, the order of `candidateTeamIds` is kept, an unknown team is omitted, and a failed lookup never fails the review read (the field resolves to the teams it could read). The shared `WorkflowsReviewStep` type carries it, so the CMS and Website Builder responses expose it without a wrapper change.

**Revisits** the phase 7 assumption A62 ("no team names") for the client only: the phase 7 websocket and e-mail texts keep "the team pool"; team names there are a later follow-up.

Covers R208, R232. Decided 2026-10-16 (phase 8a plan, user answer Q7).

## D159. Shared admin core in `app-workflows`, app-owned documents and glue

`app-workflows` holds everything that is app-neutral: the gateway interface, the one shared `ReviewUseCases` implementation (orchestration, mapping, error mapping, the workflow list cached per namespace), the DTOs, field fragments and mappers of the shared `Workflows*` types, the presenters, views, dialogs, reviewer picker, toasts, activity and notification handling, the cache-sync handler, the editor session, the trash and delete warning flow and the mounting components. It knows no app and has no namespace registry. Each app package (CMS, Website Builder) owns only: its GraphQL operation documents and the gateway that runs them, the registration that binds its gateway to the shared use cases under its own tokens (so both apps coexist in one admin container, each with its own cache), a content adapter (content URL and content type label), a cache writer, and thin glue at app-specific extension points (editor decorators, list field selection, route and widget mounting). No logic is duplicated across the two app packages; shared presenters depend on the use-case interfaces, never on a gateway. Content Reviews exists once per app and the shared list works on app-neutral rows through a row provider, so a later global view can combine several apps without changing it. A shared class is never bound with `createImplementation` (the binding is stored on the class, so a second app would overwrite the first); each app subclasses it once in its own `<App><Name>Impl.ts` and binds the subclass under its own token (R237). Test fixtures and fakes live in `review/testing/` of `app-workflows` (R243).

**Supersedes** the pre-8a layout in which each app package carried copies of the review logic and one shared presenter singleton served every view. Spec 13.1 "gateways are per app" stays, now with shared use cases above them.

Covers R202, R206, R211-R213, R223, R224, R237, R238, R243, R245. Decided 2026-10-16 (phase 8a plan, user answers Q1, Q5, Q10, Q11, Q13).

## D160. Silent review change message

Workflows sends a second websocket action, `workflows.reviewChanged`, next to `workflows.notification`. It carries ids and the namespace only (`kind`, `reviewId`, `stepId`, `namespace`, `targetId`, `targetRevisionId`; no title, no body) and the client shows no toast for it. `kind` is `requested`, `stepStarted`, `stepApproved` or `stepRestarted`, one handler per event; a failure sends no change message, because the owner of a failed step is AI or automation (no user owner to reach) and the requester already gets the `failed` notification and refetches on it; the `stepApproved` handler sends nothing once the review is no longer `inProgress` (the final approval already sends `approved`). The eight notification events do not also send it. The recipients are the requester and the current user owner, de-duplicated, never the acting user, so the acting user's own tab refreshes through its own action and there is one refetch per action. There is no pool lookup (too heavy for a silent refetch): pool members, and the people who get no toast for a take-over, reassign, reach or final decision, see those changes on reload or after their own action. API-key requesters have no connections, so nothing is sent to them. Both the notifier and the change notifier send through one `ReviewWebsocketSender` (current tenant only, ten recipients at a time, never throws).

On the client the shared `ReviewChangeMessageHandler` turns the message into a review activity signal with source `remote` that carries the review id and the target revision id. The review bar refetches on a signal for its review or its revision, the details drawer on one for its review (it subscribes after its first successful load, and an action taken in the drawer refreshes the bar only through the signal), lists and widgets on any signal of their namespace; a signal that arrives during a load is queued once, and a view ignores the signal of its own action.

**Refines** D60: a websocket message is no longer always a toast. The phase 7 delivery rules (D149) are unchanged.

Covers R253-R255, R260. Decided 2026-10-17 (phase 8b plan, user answer Q32).

## D161. Run tasks are kept, and workflows reads them

The background task of an AI or automation step is no longer cleaned up when it finishes. It is kept until its review is deleted, and `DeleteTargetReviewsUseCase` then cleans up the task subtree of every `taskId` and `runs[].taskId` of every deleted review (a cleanup that fails is logged and never fails the delete). Cancel keeps aborting only. Stuck detection already handles kept tasks.

Workflows reads the task for the admin: the internal `GetReviewStepRunUseCase` (D132) takes `reviewId`, `stepId` and `taskId`, requires the task to be the step's current task or one of its `runs`, and returns `ReviewStepRunInfo` (`taskId`, `status` as `pending`, `running`, `done`, `failed` or `aborted`, `startedOn`, `finishedOn`, `iterations`, `outcome`, `reason`) or `null` when the task record is gone. Outcome and reason come from the review step, never from the task, so a raw error, the task input and output (other than the automation's own run count) and its logs never leave the server (R146). The per-app queries `getCmsEntryReviewStepRun` and `getWebsiteBuilderPageReviewStepRun` run it behind the app's guard (signed in, the app's namespace, read access to the content) and require `editor` or `reassign`. The details drawer shows a "Background task" link per attempt for those viewers; it opens a panel with status, start, finish, iterations and reason (rows without a value are left out).

**Supersedes** D90's link into the Background Tasks admin (that admin hides private tasks and has no link by id), and **refines** D140: the step run task no longer cleans itself up (R179).

Covers R256-R258, R261, R264. Decided 2026-10-17 (phase 8b plan, user answer Q33).

## D162. Client gates mirror the workflows permissions

The admin reads the viewer's `workflows` permission through one pure function, `getWorkflowsPermissionSet(identity)`, which returns `fullAccess`, `editor` and `reassign` (full access is `workflows.*` or `*`; several roles combine). The Failed steps tab shows only with `reassign` or full access, and `?tab=failedSteps` without it opens the default tab; the Background task link shows with `editor` or `reassign` (or full access). These are display gates only: the server keeps every check and the client hides what the server would refuse. The permission values are booleans (`editor: true`, `reassign: true`); the 8a hook compared them with an access-level enum, which was a bug, and `useWorkflowsPermission` is rewritten over the set and returns `{ editor, reassign }`. Granting `reassign` in the role form stays in 9c.

Covers R259. Decided 2026-10-17 (phase 8b plan, user answer Q34).

_Refined by D178 and D182 (phase 9c): the editor routes are registered whenever the feature flag is on and show the no-access view without `editor` (the menu items and configuration queries stay gated), and the role form can grant `reassign`._

## D163. Content reload after an automated step

When an AI or automation step finishes while the editor is locked and the revision changed, the editor reloads the revision (the CMS entry form, the Website Builder page) and the review bar shows a success strip "Content updated by {step title}. The editor loaded the latest version." with the icon `auto_awesome` for an AI step and `bolt` for an automation step; the notice stays until the viewer's next action. The reload happens once per finished non-user step and never re-initialises the review presenter; a reload that would run after the presenter was disposed or initialised again during the refresh is skipped, so it sets no notice. The CMS reload is skipped while the form is dirty and compares the revision timestamps; the Website Builder reload evicts the page from the page cache, reads it again and applies it to the editor, comparing its timestamps (the page editor cannot be dirty during a review, autosave is off). A reloader that throws or finds no change shows no notice. The CMS form's loading overlay shows briefly while the changed revision reloads; this is accepted and the base form is not changed (user answer Q40).

Covers R262. Decided 2026-10-17 (phase 8b plan, user answers Q35, Q40).

## D164. Pre-check before the CMS bulk trash

Before the CMS bulk trash of all loaded rows starts its background task, the admin asks the new CMS query `listCmsEntryBlockingReviews(modelId, entryIds)` for the reviews in progress of those entries, in chunks of 200 ids, and shows the D157 warning when any come back. Confirming cancels them per target (as D157 does) and then starts the task; with none the task starts at once; a dismissed warning starts nothing, and a failed pre-check shows the error toast and starts nothing. The base `BulkDeletePresenter.execute` now reports whether the background task started, and the trash action's "Entries will be trashed in the background" toast and the deselection follow only a started task (a separate `fix(app-headless-cms)` commit, user answer Q39). The query needs a signed-in viewer, returns `[]` for an unbound model, refuses more than 200 ids with `Workflows/Review/Validation`, and lists only entries the viewer can read (the model, its group and the entry). The shared `ActiveReviewGuard` gains `confirmBlocking` for this and `runBulk` is rebuilt on it. Every other bulk path stays as D157 built it; the Website Builder bulk delete runs per item.

**Closes** the gap D157 names for the CMS ("all selected" content ran as a background task whose refusals the client could not see).

Covers R228, R265. Decided 2026-10-17 (phase 8b plan, user answers Q38, Q39).

## D165. Validation errors point at the step and field

`Workflows/Workflow/Validation` carries `data: { stepId, field, workflowId }`, every key `null` when it does not apply. A workflow-level error (`stepId` null) names `name`, `models` or `steps` in `field`; a step-level error names the step and the field (`id`, `title`, `type`, `config.teams`, `config.assignment.rules.<index>.<path>` for a schema issue in a rule (`config.assignment.rules` alone is no longer emitted, D171), `config.automationId`, `config.settings` or `config.settings.<path>`, `config.instructions`, `config.model`, `config.tools`, or `config.<zod issue path>` for a review config issue). The server does not validate the colour or the notification ids, so it never names `color` or `notifications`; the editor's own client check names `color`. The path inside automation settings comes from `parseAutomationSettingsIssue`, a sibling of `parseAutomationSettings` that returns the first issue as `{ path, message }`. The duplicate-model error (same code) also carries the `workflowId` of the workflow that already holds the model, so the editor can name it and offer to open it. Messages and codes do not change; the CMS and Website Builder before-create and before-update handlers and the app-mismatch guards set `field: "models"`.

The editor validates on the client first and uses the server error as the fallback: the step and field are marked, the first failing card scrolls into view, and an error whose field has no form field shows the server message on the card and at the top of the drawer until the step is edited. A server validation error with no step shows as the banner "Could not save the workflow — {server message}" (a `name` or `steps` field also marks the name input or the "No steps yet" box).

**Refines** D92: the exact step, rule or field the decision promised is now what the server names.

Covers R267, R276, R281. Decided 2026-10-18 (phase 9a plan, user answers Q41, Q43).

_Extended in phase 9b (D171): the data also carries `ruleId` (null when it does not apply) and rule-level failures name the field `config.assignment.rules.target`; the whole-list field `config.assignment.rules` is no longer emitted. The rule messages are rule-neutral ("The target user is not a member of the step's teams.", "The target team is not one of the step's reviewing teams."); the no-target message is unchanged._

## D166. Workflows lists teams for the editor

The shared configuration query `workflows { listTeams(search, ids, limit) }` returns `{ teams: [{ id, name, memberCount }], missingIds }`, for viewers with `editor`; a search is sorted by name and an `ids` request keeps the order of the request. `search` is a case-insensitive name filter, `ids` returns those teams and reports unknown ones in `missingIds` (more than 200 ids, counted after de-duplication, is refused with the Validation error `Too many team ids.`, the `listUsers` rule), `limit` defaults to 50 and is capped at 200. Only the team lookup and the member count run without authorization (the `listUsers` pattern): the count is one user-list scan per request, users carry their teams, and only a number leaves the server, never a member. The `WorkflowsTeam` type stays for review steps; the new `WorkflowsTeamSummary` is the picker's row. The member count drives the design's "This team has no members" warning.

Covers R268. Decided 2026-10-18 (phase 9a plan, user answer Q42; the member count was added by the planner).

## D167. The AI step editor ships with the editor

Phase 9a builds the full AI step editor: instructions (required), the model picker over `listAiModels` with its empty, failed, no-model and retired-model states (a stored model that is no longer listed shows as retired with a warning and does not block saving), the tool allowlist over `listAiTools` (stored tool names that are not listed are kept and not shown), and the licence warning. Without the licence (the `ai` step type unavailable, or no config schema) AI cards are disabled with the reason and an existing AI step is read-only; moving and deleting it stay enabled. Phase 9c keeps only the exclusion settings page and the permission UI. AI tools declare an optional `changesContent` flag (absent means false; `readTarget` false, `updateTargetFields` true) that `listAiTools` returns; the editor shows it as the tag "Changes content" on the tool and as " · can change content" in the step summary.

Covers R275, R283. Decided 2026-10-18 (phase 9a plan, user answers Q44, Q46).

## D168. Step forms per type

The step drawer builds one FormModel form per step: the common fields (Title, Colour, Description, Notify via) and the type's own config fields, in one body. The People form edits `teams` and carries `assignment` unchanged (a new step starts with `{ strategy: "none", allowManualPick: false, rules: [] }`); the Automation form is generated from the definition's JSON schema by `buildFieldsFromJsonSchema` in `@webiny/app-admin`; the AI form is hand-built. There is no dynamic zone and, in 9a, no tabs (the Assignment and Test routing tabs arrive with 9b). A step of an unknown type is shown read-only and saved unchanged. The adapter maps string (with `enum`, the `ui` hints `textarea` and `team`), number and integer with bounds, boolean, object, a list of strings, a list of objects, and anything else to a JSON text field; `createJsonSchemaValidator` rebuilds the validator with `z.fromJSONSchema`, never throws, and reports every value valid for a schema it cannot rebuild. A `user` hint has no picker yet and falls back to plain text.

**Refines** D66: the dynamic zone and `ObjectAccordionMultipleRenderer` rule list are replaced by one form per type for now, and the rule list moves to 9b.

Covers R270, R271, R274. Decided 2026-10-18 (phase 9a plan).

_Built in phase 9b: People steps have the tabs General, Assignment and Test routing, the rule list is built, and the `user` hint renders a single-user picker over `listUsers` (D170); any other unknown hint still falls back as above._

## D169. Colour presets are theme tokens

A step's colour is a string the server already stores. The editor offers ten presets stored as the theme's CSS variable strings (Orange `var(--color-primary-500)`, Rust `var(--color-primary-800)`, Amber `var(--color-warning-600)`, Olive `var(--color-warning-800)`, Teal `var(--color-success-500)`, Green `var(--color-success-800)`, Red `var(--color-destructive-500)`, Maroon `var(--color-destructive-700)`, Gray `var(--color-neutral-500)`, Ink `var(--color-neutral-900)`) and a custom colour stored as `#RRGGBB`. A new step takes Orange. A loaded colour that is neither a preset nor a hex is kept; a hex shows as custom, anything else as no selection. An invalid hex blocks Save with "Enter a hex colour, e.g. #3B6FD4." and an unfinished hex stays in the field without reaching the draft.

Covers R273. Decided 2026-10-18 (phase 9a plan).

## D170. `listUsers` can be scoped to teams

`workflows { listUsers(search, ids, limit, teamIds) }` takes an optional `teamIds` and returns each user's team ids: the result type is `WorkflowsListedUser { id, displayName, teamIds }` (`WorkflowsUser` stays for owners and candidates). A user matches `teamIds` when any of the user's teams is in the list (the `teams_in` filter the store check already uses); the filter combines with `search` and the limit rules are unchanged (default 50, at most 200, sorted by display name then id). An `ids` lookup ignores `search`, `limit` and `teamIds`, so a saved target that left the teams still resolves. The use case reads the team ids from the admin user it already lists and returns ids only, never team names. With the teams feature off (`advancedAccessControlLayer.teams`, read through the api-core `FeatureFlags` on every call) it queries no teams, `teamIds` is `[]` on every user and a request with `teamIds` returns no users. The editor uses it for the rule target members, the requester pickers, reference resolution and Test routing names.

Covers R286, R287. Decided 2026-10-18 (phase 9b plan, user answers Q49, Q58).

## D171. Rule errors name the rule

`WorkflowValidationErrorData` gains `ruleId` (null when it does not apply). A rule-level failure sets `stepId`, `ruleId` and the field `config.assignment.rules.target`: a rule without a target, a user target who is not a member of the step's teams (`The target user is not a member of the step's teams.`) and a team target outside the step's teams (`The target team is not one of the step's reviewing teams.`). The team-target check was already a save check (`ReviewStepType.validate`); 9b gives it the rule-neutral message, the field and the `ruleId`, and the inspector runs it too. The user-target check stays in `StoreWorkflowUseCase`. The messages live in one module, `ruleErrorMessages.ts`, used by `ReviewStepType`, `StoreWorkflowUseCase` and `InspectRoutingUseCase`, so the inspector's rule failures carry the same messages, field and `ruleId`; only the no-target message differs: save names the step (`Every routing rule in step "{title}" needs a target.`), the inspector has no step title (`Every routing rule needs a target.`). Schema failures keep `config.assignment.rules.<index>.<path>`. The editor marks the rule card and the field, and the step card shows `Rule {n}: {message}` with n from the rule's current position; an index in a schema path is converted to the rule id when the error is mapped, so a later reorder keeps the error on its rule.

**Refines** D165 and D46.

Covers R288, R303. Decided 2026-10-18 (phase 9b plan, user answers Q51, Q52).

## D172. The routing inspector answers for every rule

`inspectRouting` lists every rule in the trace: the outcome gains `notEvaluated` for the rules after the deciding one, a `notMatched` entry names its failed conditions (`requesterUser`, `requesterTeam`, `folder`; a failed `modelId` condition adds nothing), and the inspection adds `narrowedTeamId` (the team a matched team rule narrowed to), `candidateIds` (the first three candidates in the order the strategy considers them) and `candidateCount`. The evaluator has an `explain` mode used only by the inspector: it evaluates every condition of every rule and keeps walking after the deciding rule without assigning; live assignment at reach stays lazy and unchanged. There are still no per-person load numbers (D104). The editor composes the design's sentences from this data (the owner, the reason line, one row per rule with the tags Matched, Not matched and Skipped, the strategy line and the skipped people with the server's reasons), resolves the names it needs after the reference maps, marks the result out of date when the teams, strategy, toggle, rules, requester or folder change, and never re-runs a test by itself. A rejected test shows "Could not test routing: {server message}", a transport failure "Could not test routing: the server did not respond.", both with Try again.

**Refines** D95 and D118.

Covers R289, R300, R301. Decided 2026-10-18 (phase 9b plan, user answer Q55).

## D173. Apps supply their folders

The editor adapter lists the app's folders and names the folder type: `getFolderType(modelId)` (CMS `cms:<modelId>`, Website Builder `wb:page`) and `listFolders(modelId)` returning `AppFolder { id, path }` for the folders the admin can see (the ACO list is permission-filtered), the root excluded, the path built from folder titles as `/A/B`. The CMS and Website Builder packages implement them over the data-returning `ListFoldersGateway` of `@webiny/app-aco`; `app-workflows` does not depend on `app-aco`. The folder control is the shared searchable `WorkflowPicker` over these paths, with the clear rows "Any folder" (rule condition) and "Root (no folder)" (Test routing). A saved folder id that is not listed is told apart with `folderExists`: "Restricted folder" (preserved unchanged, the picker disabled, removable) or "Deleted folder". A folder condition of another type is kept unchanged.

**Refines** D69 and D133.

Covers R292, R298. Decided 2026-10-18 (phase 9b plan, user answer Q54).

## D174. Stale rule targets block Save

A rule target that no longer works is a rule error, on the client and on the server: no target ("Choose who this rule assigns to."), a user who is not in the reviewing teams ("{Name} is no longer in the reviewing teams."), a team that is not a reviewing team ("{Team} is not a reviewing team."), a deleted user ("The assigned user was deleted.") and a deleted team ("The team was deleted."). The errors are computed live (once references resolve, and again when the step's teams or rules change), shown on the rule card, the step card and the top of the drawer as `Rule {n}: {message}`, and block Save with the toast "Fix the highlighted steps before saving." Warnings never block: a deleted folder ("The folder no longer exists.") and a deleted requester team ("The team was deleted."). A restricted folder has only its field hint, and a deleted requester user shows the label "Deleted user" without a warning. A user whose teams are unknown (the lookup failed) is not flagged. A People step that is read-only (teams off) is not checked and never blocks Save.

**Refines** D46 and D61.

Covers R299, R304. Decided 2026-10-18 (phase 9b plan, user answers Q52, Q53).

## D175. 9b is editor-only

Phase 9b changes the workflow editor and the API it needs. It builds no `listStepCandidates` work and leaves the 8a `ReviewerPicker` as it is (the roadmap row 9b had both; they are not editor needs). Read access ("{Name} can't read {Model} content.") and exclusions ("{Name} is unavailable (excluded until ...)") are not shown in the editor: Test routing reports them through the server's skipped people. Every new operation is `editor`-only on the server and shown only to viewers with `editor` (D162). The `modelId` rule condition is preserved but has no editor (D42).

Covers R285, R306. Decided 2026-10-18 (phase 9b plan, user answers Q50, Q56).

## D176. Teams off disables People

With the teams feature off, `listStepTypes` reports the People (`review`) type as unavailable with the reason "Teams are not enabled." and the editor lists it disabled (D122); `listTeams` returns `{ teams: [], missingIds: [] }` without querying and `listUsers` returns no team data (D170). A saved People step loads read-only, with the card warning and the drawer notice "This step needs teams, which are not enabled. It can't be edited."; move and delete stay enabled and the step is saved untouched. Automation and AI steps work as before. The People step is read-only exactly when the `review` row of `listStepTypes` is not available.

Covers R290, R309. Decided 2026-10-18 (phase 9b plan, user answer Q58 and Q59.5).

## D177. The stock admin-ui groups hold items by reference

`RadioGroup`, `CheckboxGroup` and `Checkbox` of `@webiny/admin-ui` accept JSX labels: their presenters hold the items by reference instead of deep-observing them, which overflowed the stack. The 9a workarounds are removed: the Automation cards use `RadioGroup` and the AI tools list uses `CheckboxGroup` again, and the 9b controls (strategy cards, "Include subfolders") use the stock components directly.

Covers R305. Decided 2026-10-18 (phase 9b plan, user answer Q57).

## D178. One Reviewer exclusions page under Settings

Settings > Workflows > Reviewer exclusions at `/settings/workflows/exclusions` is one page for every app, mounted once by `WorkflowsAdminApp`. The Settings menu group "Workflows" and its item "Reviewer exclusions" show only with `editor`; the route is registered whenever the `advancedPublishingWorkflow` flag is on and, without `editor` (or when the server answers `Workflows/NotAuthorized`), shows "You don't have access to reviewer exclusions" instead of a not-found page. The editor routes get the same change: registered whenever the flag is on, they show "You don't have access to workflows" without `editor`, and their menu items stay hidden. The page reads with `getSettings(includeExpired: true)` and has its own settings gateway and use cases. Add, Edit and Remove each save at once from their dialog, sending the whole list from the last load or the last successful save with exactly one change; the returned record becomes the list; the last save wins and there is no conflict UI (D106 unchanged). The Add button shows only once a list has loaded, so a save never starts from an empty list. No API changes.

**Refines** D16, D78 and D162.

Covers R316, R317, R318, R329, R330, R331. Decided 2026-10-19 (phase 9c plan, user answers Q61, Q62, Q65).

## D179. End of the picked local day is 23:59:59.999

`endsOn` is 23:59:59.999 on the picked day in the browser's timezone, stored as a UTC instant; the timezone is `Intl.DateTimeFormat().resolvedOptions().timeZone`, or UTC when that is empty or fails. An entry is active while `endsOn` is later than now (the server's rule). The earliest pickable day is today in that timezone (the admin-ui `DateOnlyPicker` now honours `minDate` and reads `yyyy-MM-dd` as a local date). Editing without changing the date keeps the stored instant; a cleared date stores none. The Until cell shows "Until removed", "End of {d Mon yyyy}" when the instant is 23:59 local, or "{d Mon yyyy}, {HH:mm}"; the hover shows `Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)`, with UTC when the timezone cannot be resolved.

**Refines** D43, D73, D110 and D124.

Covers R319, R320, R336, R337, R339. Decided 2026-10-19 (phase 9c plan, user answer Q63).

## D180. Exclusion users

Names come from `listUsers({ ids })` in chunks of 200. A missing id is "Deleted user" ("This user no longer exists"); its entry can still be edited and removed. A failed lookup shows the user id on the row and the banner "Could not load user names." with Try again, which asks only for the unresolved ids. The Add picker searches `listUsers` and lists users already in the list as disabled with the right-hand note "In the list" (the shared `WorkflowPicker` gained an optional note), so there is no client duplicate error. The server does not check that a user exists. The reason is trimmed on the client, whitespace only counts as empty, and it is capped at 500 characters. No avatars and no team sub-lines.

**Refines** D105.

Covers R321, R324, R325, R328, R332. Decided 2026-10-19 (phase 9c plan, user answers Q64, Q65, Q68).

## D181. The exclusion list shows everything

No paging. Tabs Active, Expired and All, Active by default and selected again after an add (an edit or a remove keeps the tab). A "Filter by user" picker lists only the users in the list, filtered on the client. Rows are sorted by the user's name, then the user id (not by end date).

Covers R322, R323. Decided 2026-10-19 (phase 9c plan, user answer Q66).

## D182. The role form grants workflows access

The role form (and the API key form) has a custom Workflows group with No access, Full access and Custom. Full access stores `{ name: "workflows.*" }`; Custom stores one `{ name: "workflows", editor?: true, reassign?: true }` with the checkboxes "Manage workflows" (`editor`) and "Reassign and operate" (`reassign`), and is kept as Custom with nothing ticked. An existing `{ name: "workflows.*", editor: true }` loads as Full and is rewritten only when the admin changes the group; a `*` entry shows Full and locked; an unrecognised `workflows` entry is read by its flags; every other permission entry is kept untouched. The group writes only on a user action, so opening a role does not change it. Custom needs no `aacl` licence (workflows has its own). The unused `HasWorkflowsEditorPermission`, the never-resolved `WorkflowsPermissions` DI feature and the permission schema were deleted.

**Refines** D54 and D162.

Covers R333, R334, R341. Decided 2026-10-19 (phase 9c plan, user answers Q60, Q67, Q68).
