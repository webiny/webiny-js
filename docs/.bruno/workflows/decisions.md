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

No stored inbox; D47 lists serve that role. Workflows only sends websocket messages (`WebsocketsSendToIdentityUseCase`); the websockets layer decides delivery for live or non-live connections. On the client, every workflow websocket message goes to the shared review notification service, which shows the toast and signals the review activity bus, so the visible lists and widgets of that app refetch once per signal (R210, R223); `ReviewChangedEvent` (R213) replaces `WorkflowStateChangedEvent` and keeps the content lists' `system.workflow` cache in sync. Refined in phase 8a. Resolves P9, A7.

_Phase 7: delivery is tenant-scoped by the notifier; workflows lists the recipient's connections and sends to the current tenant's ones, and does not use `WebsocketsSendToIdentityUseCase` (D149, R188)._

## D61. Candidates must be able to read the target

During resolution (routing, strategy, pick, reassign), candidates without read access to the target (folder access and model read) are dropped; the reason is logged in the assignment log (D20). The rule editor and rule inspector warn when a target user lacks access. Resolves P10.

_Refined by D133: the engine evaluates candidates' read access through the app's target adapter for the namespace (e.g. `canUserRead(userId, target)`); the app supplies the permission logic._

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

## D73. endsOn conversion

Keep D43: a helper in the exclusions settings presenter converts the picked date to end of that day in the user's timezone, stored as UTC ISO datetime. Resolves A13.

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

## D91. UI: step type chosen once

Step type (Review, Automation, AI) is chosen when adding a step and cannot be changed; delete and re-add instead. AI appears only with the `aiPowerups` licence; Automation only when at least one definition covers the workflow's model.

## D92. UI: explicit workflow save

The workflow editor edits the whole workflow and saves explicitly (no per-step save, no auto-save). It tracks unsaved changes, warns before leaving, and shows server validation errors on the exact step, rule or field.

## D93. UI: request review dialog

Always shown. Contains: review title (prefilled from the entry/page title), a read-only preview of the steps (name, type, how the reviewer is chosen: pool, routed, AI, automation), and a reviewer choice ("Automatic" preselected or a person) only for steps that allow picks. One click to confirm when there is nothing to choose.

## D94. UI: Content Reviews page

Four lists as tabs (Assigned to me, Pool, Team in review, My requests). Filters: model, review state, step state; search by title. Columns: title, model, current step, step state, owner, requester, last change. Row actions follow server flags: open, open in new window, view details, start, take over, reassign. No approve/reject from the list.

_Refined by D133: one Content Reviews view per app; see also D112, D113, D119._

## D95. UI: rule inspector

"Test routing" panel in the review step's assignment section. Inputs: requester user, folder. Output: resulting owner or pool, plus a per-rule trace (matched, not matched, skipped with reason) and the strategy's choice. Evaluates the unsaved step config in the editor, so `inspectRouting` accepts a step config (not only a step id).

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

## D106. Exclusion list: last save wins

Saving the exclusion list writes the whole settings record; the last save wins. No version check and no conflict UI. Accepted risk: when two admins edit the list at the same time, one admin's change can be lost silently. Judged rare (few admins, infrequent edits). Resolves gap A5 from the design review.

## D107. Automated steps are named by their step title

Wherever the UI or a notification names who decided or who owns a step, AI and Automation steps are shown by their step title (e.g. "Notify web team"), never by the automation's or model's name, because one automation can back several steps. People steps show the person. A rejection without a comment drops the quote: "Rejected at {step} by {decider}." Resolves gaps A6 and F11 from the design review.

## D108. A workflow needs at least one step

Saving a workflow with no steps is rejected on the server and in the editor ("Add at least one step."). The editor still lets the admin delete the last step while editing. To stop requiring reviews for a model, delete its workflow. Resolves gap A7 from the design review.

## D109. AI instructions are required

An AI step's Instructions (the reviewer prompt) must be non-empty, enforced on the server and in the editor. No minimum length and no default prompt. Resolves gap A8 from the design review.

## D110. Exclusion end dates across timezones

Extends D73. The timezone used when saving is the browser's (there is no profile timezone). Active or Expired is computed from the stored UTC instant, the same for every viewer. The list shows the end date in the viewer's local time; hovering shows the full local time and timezone name, e.g. "Until 3 Nov 2026, 23:59 (Europe/Zagreb)". The saving admin's timezone is not stored. Resolves gap A9 from the design review.

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

## D118. Rules targeting an excluded person are skipped

Extends D46. When a routing rule matches but its target person is currently excluded (D16), the rule is skipped and evaluation continues with the next rule, then the strategy. The routing trace (and Test routing) marks the rule "Skipped" with the exclusion reason and lists the person among skipped people. The rule card in the editor warns "{name} is unavailable (excluded until …). The rule is skipped while the exclusion lasts." From design answer QBZ-41.
_Built in phase 4 (R129): the inspector's trace and its skipped-people list show the exclusion's own reason ("Excluded from reviews." when it has none); assignment-log records keep the fixed text (D89, D97)._

## D119. Review "last change" and list sorting

Each review keeps a `lastChangedOn` timestamp, updated on every review event: requested, step reached, started, taken over, reassigned, approved, rejected, failed, restarted, and content updated by a step. Edits made outside the review do not update it. Content Reviews lists sort only by it: oldest first by default in Assigned to me, Team pool, Team in review and Failed steps (work queues), newest first in My requests; the user can toggle the direction, and switching tabs resets it. The list queries take `sort: lastChangedOn asc | desc`; load more continues in the current order. For approved reviews the list shows the last step and its owner; for rejected ones the rejecting step and who rejected it (D107 naming). From design answers QBZ-69 and QBZ-70.

_Refined by D133: sorting and paging apply within one app's list._

## D120. Step descriptions are shown to users

A step's description is shown to the requester in the Request review steps preview and to everyone with access in Review details, under the step name. The steps preview and Review details queries return it. Placeholders in the editor differ per step type. From design answer QBZ-46.

## D121. Unpublished approved revisions can be republished

An approved revision that was published and later unpublished can be published again without a new review: the approval covers the revision's content, which cannot change after approval. The review bar keeps "Review: Approved" with Publish enabled; the editor tag shows the app's own "Unpublished" status; the read-only reason is the app's usual one for non-draft revisions. Applies to CMS entries and Website Builder pages. Resolves final-check item H1.

## D122. Unavailable step types are shown disabled

Revises D91: in Add step, every step type is listed. AI without the `aiPowerups` licence and Automation with no definition covering the workflow's model are shown disabled with the reason ("Requires AI Power-Ups", "No automations are available for this model" / "for pages"), and cannot be added. Resolves final-check item H2. _Phase 6 registers the `ai` type when both `aiPowerups` and `advancedPublishingWorkflow` are on (D148); otherwise the disabled row stays._

## D123. Deleted-while-editing dialog without who and when

No tombstone is kept for deleted workflows. When a save finds the workflow gone, the dialog reads "“{workflow}” was deleted while you were editing, so your changes were not saved. Save them as a new workflow for {model}, or discard them." with Discard changes / Save as new workflow. The server only reports that the workflow no longer exists. Resolves final-check item H3.

## D124. Exclusion end date display and editing

Refines D110. The list cell shows "End of {date}" when the stored instant falls at 23:59 in the viewer's timezone, otherwise date and time ("4 Nov 2026, 06:59"); hover shows the full time with the timezone. The Edit dialog pre-fills the viewer's local date. If the date is not changed, the stored instant is kept exactly; only a changed date is recomputed to the end of the newly picked local day. Resolves final-check item H4.

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

## D158. Review steps carry `candidateTeams`

A review step carries `candidateTeams: [{ id, name }]` next to `candidateTeamIds`, so the client can write "Waiting in the {Team} team pool" and "Team pool ({names})" (spec 13.4). It is resolved at read time in `api-workflows` from `candidateTeamIds` and never stored. Team lookup needs the `security.team` permission that a reviewer does not have, so exactly that lookup (and nothing else) runs without authorization and exposes only `id` and `name`; ids are de-duplicated, the order of `candidateTeamIds` is kept, an unknown team is omitted, and a failed lookup never fails the review read (the field resolves to the teams it could read). The shared `WorkflowsReviewStep` type carries it, so the CMS and Website Builder responses expose it without a wrapper change.

**Revisits** the phase 7 assumption A62 ("no team names") for the client only: the phase 7 websocket and e-mail texts keep "the team pool"; team names there are a later follow-up.

Covers R208, R232. Decided 2026-10-16 (phase 8a plan, user answer Q7).

## D159. Shared admin core in `app-workflows`, app-owned documents and glue

`app-workflows` holds everything that is app-neutral: the gateway interface, the one shared `ReviewUseCases` implementation (orchestration, mapping, error mapping, the workflow list cached per namespace), the DTOs, field fragments and mappers of the shared `Workflows*` types, the presenters, views, dialogs, reviewer picker, toasts, activity and notification handling, the cache-sync handler, the editor session, the trash and delete warning flow and the mounting components. It knows no app and has no namespace registry. Each app package (CMS, Website Builder) owns only: its GraphQL operation documents and the gateway that runs them, the registration that binds its gateway to the shared use cases under its own tokens (so both apps coexist in one admin container, each with its own cache), a content adapter (content URL and content type label), a cache writer, and thin glue at app-specific extension points (editor decorators, list field selection, route and widget mounting). No logic is duplicated across the two app packages; shared presenters depend on the use-case interfaces, never on a gateway. Content Reviews exists once per app and the shared list works on app-neutral rows through a row provider, so a later global view can combine several apps without changing it. A shared class is never bound with `createImplementation` (the binding is stored on the class, so a second app would overwrite the first); each app subclasses it once in its own `<App><Name>Impl.ts` and binds the subclass under its own token (R237). Test fixtures and fakes live in `review/testing/` of `app-workflows` (R243).

**Supersedes** the pre-8a layout in which each app package carried copies of the review logic and one shared presenter singleton served every view. Spec 13.1 "gateways are per app" stays, now with shared use cases above them.

Covers R202, R206, R211-R213, R223, R224, R237, R238, R243, R245. Decided 2026-10-16 (phase 8a plan, user answers Q1, Q5, Q10, Q11, Q13).
