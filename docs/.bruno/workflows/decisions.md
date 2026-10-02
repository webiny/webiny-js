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

An AI step acts exactly like a human reviewer: approve or reject, with a comment giving the reason. (Editing revised by D39: allowed only via step-allowed tools.) No human confirmation of its decision (rejection is final, D10). Step config: reviewer instructions (prompt) plus ai-powerups capability and model role.

## D14. Automated steps are defined in code

Automated steps are code definitions, not UI-built. Webiny ships built-ins (e.g. send a webhook, pull an image from an external URL, create records). Users register their own via code.

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
- Structured output: `{ approved: boolean, comment: string, issues: [{ fieldPath?, severity, message, suggestion? }] }`.

## D40. AI licensing and capability

One shared ai-powerups capability, "Workflow review"; model role selectable per step. Without the `aiPowerups` licence the AI step type is hidden in the editor. If the capability is disabled or the licence lapses later, the step becomes `failed` with the reason when reached; restartable once fixed.

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
| Step reached, manual | Members of the step's candidate teams |
| Step started by routing, editor pick or reassign | Owner |
| Reassign | Old and new owner |
| Review approved, review rejected, step failed | Requester |
| Review cancelled | Current owner, if any |

An assignment never notifies the whole team. Channels: transports configured on the step (`notifications[]`, e.g. e-mail) plus an in-app websocket notification always.

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

## D48. User lists owned by workflows

Workflows exposes its own user queries; both run `withoutAuthorization` internally, so no `adminUsers` permission is needed.

- `workflows.listUsers`: all tenant users, minimal fields (id, displayName, teams). Requires `workflows.editor`. Used by the rule editor (requester user, user targets).
- `workflows.listStepCandidates(workflowId, stepId)`: only that step's candidates with `{ id, displayName, excluded, excludedReason }`. Available to anyone who can request a review. Used by the manual picker. Round-robin and least-loaded use the same candidate source.

Team member lookup needs a `teams_in` filter on users storage in api-core, or in-memory filtering. To check: whether users storage can filter on teams.

## D49. Terminology

- Pool: step reached with no owner; a team member clicks Start.
- Picked: the editor chose the reviewer at submit.
- Routed: assigned by a rule or a strategy.

"Manual" is not used for assignment.
