# Reviewer Routing — Discovery

Input: the Reviewer Routing product brief. Answers the brief's open questions against
the current code, and lists what the brief assumes exists but doesn't.

## Where it lives

| Concern | Package |
| --- | --- |
| Workflow + state domain, use cases, GraphQL | `api-workflows` |
| CMS binding (target context, pool filter) | `api-headless-cms-workflows` |
| Admin UI | `app-workflows` |
| Folders | `api-aco` |
| Users and teams | `api-core` |

Workflow and workflow state are both **private CMS models**, so they inherit CMS storage
behaviour and the CMS `where` language:

- `api-workflows/src/domain/workflow/workflowModel.ts` — `wbyWorkflow`
- `api-workflows/src/domain/workflowState/stateModel.ts` — `wbyWorkflowState`

## Open questions, answered

### Counting open assignments per user

Cheap, as long as you query the **assignment** side, not the user side.

Store `currentAssignee` on the workflow state root and count:

```
isActive: true AND state_in: [pending, inReview] AND currentAssignee.id: X
```

Two traps:

- **Don't put it on the step.** OpenSearch object lists here are mapped as `object`, not
  `nested` (no `nested` anywhere in `api-opensearch`, `api-headless-cms-utils-os`,
  `api-headless-cms-pg-os`; `ObjectFilter` flattens to a dotted path). So filters on an
  object array don't correlate within the same element — `steps.assignee.id` would match
  steps that are already approved or not yet started.
- **`isActive` doesn't mean "in progress".** It's `true` from creation and set `false` only
  by `CancelWorkflowState`. Finished and rejected states stay `true`. Without the `state_in`
  filter you'd count a reviewer's lifetime history, not their current load.

Aggregation can't replace the team member list, though: someone with zero assignments
appears in no record. Least-loaded needs the candidate list to find them.

### Folder descendant matching

Cheap either way. Folders carry a materialised `path` and `ListFoldersWhere` supports
`path_startsWith`, so a descendant test is a string prefix compare.

Descendant paths *are* kept correct on rename and move, but not by the folder code — the
cascade lives in `UpdateFlpUseCase.executeBatchUpdate`, which walks the subtree and writes
`path` back onto each folder entry. Covered by
`api-aco/__tests__/folder.so.test.ts` ("should update folder `path` to both parent and
child folders").

Caveat: in production that runs as a **background task** (`UpdateFlpOnFolderUpdatedHandler`
triggers `UPDATE_FLP_TASK_ID` when `TaskService` is present; it only runs inline without
one, which is why tests are deterministic), and its errors are swallowed. So `path` is
eventually consistent, and a failed cascade leaves it stale silently.

**Decided:** a rule stores the folder **id**, never its path. At evaluation, read the
folder for its current path and prefix-compare with the content folder's path. Storing the
path on the rule would break permanently the first time that folder moves.

Deleting a rule's folder is safe: ACO only deletes empty folders (no subfolders, no
content, checked with and without authorization), so a deleted rule folder matched nothing.
The rule then just fails to resolve and is skipped.

### Pending-review pool query

`ListRequestedWorkflowStates` filters:

```
isActive: true, createdBy_not: <me>, steps.teams.id_in: <my teams>
```

It matches a team on **any** step — including approved ones and steps several ahead. That
can't be fixed with better filtering (no `nested` mapping); it needs the same root-level
denormalisation as the assignee. State filtering is left to the caller.

### Folder deleted while a rule references it

Can't happen to a non-empty folder. ACO blocks deletion of folders with children
(`EnsureFolderIsEmptyOnDelete`) and each app adds its own content check. No cascade, no
reparenting. So the rule just stops matching — treat it like a departed user.

### Permission scoping

Not scoped. `createPermissionSchema({ prefix: "workflows", fullAccess: { editor: true } })`
is a single boolean, checked as `permission.name === "*" || permission.editor`. Anyone who
can edit one workflow can edit all of them. The brief's separate reassign permission means
a second flag on this schema.

## What the brief assumes, but doesn't exist

- **Step resolution types.** `IWorkflowStep` is `{id, title, color, description, teams,
  notifications}`. No check step, no AI step, and the step form has no type field. The
  brief's "hide assignment for check/AI steps" is a no-op today.
  **Decided:** add `resolutionType` now with the single value `manual`, on both
  `wbyWorkflow` and `wbyWorkflowState` steps, so the editor already reads it. Existing
  entries have no value, so reads default to `manual`.
- **Reviewers are teams, never users.** So "target must sit within the step's reviewers"
  means *member of one of the step's teams*.
- **No team → members lookup.** Membership lives on the user (`AdminUser.teams: string[]`)
  and `ListUsersInput.where` only has `id_in`. Built inside `api-workflows`, wrapped in
  `withoutAuthorization` — the pattern `ListUserTeamsUseCase`, `UpdateFlpUseCase` and
  `EnsureFolderIsEmpty` already use. Because that bypasses authorization, the result must be
  scoped to the teams on the step being resolved. Never expose a general team-member listing. Note both backends already list every
  tenant user on any `listUsers` call, and filter in memory — so a `teams` filter costs the
  same as what ships today. `ListFolderLevelPermissionsTargets` already does exactly this
  on a user-facing picker. Cost is fine; the capability is just missing.
- **No assignee field.** `IWorkflowStateRecordStep` has `savedBy` (who acted), not an
  assignee.
- **Target context is missing locale.** `CmsWorkflowStateContextProvider` returns
  `{folderId, modelId}`. Locale and requester teams aren't captured.
- **No notification handlers.** `NotificationTransport` and `MailNotificationTransport` are
  registered. Handlers *do* exist for create, update, delete and cancel — eight in
  `api-headless-cms-workflows`, siblings in `api-website-builder-workflows`. Missing is
  narrower: nothing subscribes to start, approve, reject or takeOver, and nothing sends
  notifications at all. `step.notifications` is dead config.
- **No tenant settings surface** for the exclusion list. Precedent to copy:
  `webhooks/src/api/models/WebhookSettingsModel.ts` — a `.private()` model, auto-created on
  first read. CMS entry keys are `T#<tenant>#CMS#CME#M#<modelId>#<type>` — tenant and model,
  no locale — so a private model is tenant-level for free.

## Decisions so far

| | |
| --- | --- |
| `currentAssignee` on the state root, full identity object | matches `savedBy`/`createdBy` |
| Assignment is optional — nullable | brief says falling through to the pool is valid |
| Resolve lazily, at creation and on approve | not on `start()` — that's a human pull that already stamps `savedBy` |
| `currentAssignee` follows who holds it | moves on `start()`/`takeOver()` by someone else, so load stays honest |
| Never cleared | `state_in` + `isActive` already exclude finished work |
| `start()` stays open to the team | assignment is advisory, not a lock |
| Requester excluded at assignment time | `enrichStep` only blocks them acting, not being picked |
| `updateStep` stops auto-stamping `savedBy` | callers pass it explicitly; otherwise step 1's approver silently gains approve rights on step 2 |
| Rules store `folderId`; descendant test is a `path` prefix compare | path on the rule breaks when the folder moves |
| Exclusions: one entry per exclusion in `wbyWorkflowExclusion` (`userId`, `reason`, `until`) | queryable and paginated |
| Lapsed exclusions are filtered by `until` at read, not cleaned up | brief says they lapse on their own |
| `listStepReviewers(stepId)` returns candidates annotated `{user, excluded, reason}` | one place owns eligibility, so picker and strategies can't drift |
| Reassign is a new use case, not an extension of `takeOver` | different target, permission and allowed step state |
| New permission entity `workflows.reassign` | grantable without workflow editing |
| No assignment history — step keeps `assignee`, `assignedBy`, `assignedOn`, `assignmentSource` only | accepted trade-off; brief asked for an audit entry |
| One generic notification handler for all workflow state events | `step.notifications` is configured today and consumed by nothing |
| Manual picks are written as the step assignee at creation, `assignmentSource: "manual"` | nothing to re-evaluate, so resolution order falls out: an assignee already present wins |
| `createWorkflowState` takes one input object | argument list is already long; `assignees: [{stepId, userId}]` is added there |
| On activation, validate an existing assignee before keeping it | if the user left the team or is now excluded, clear it and run rules then strategy |
| Rule target: reject on rule save, warn on team change | blocking a team change would trap admins, and evaluation already skips bad rules |
| Editor validates targets with `listStepReviewers(stepId)` | same annotated query the manual picker uses; no new endpoint |
| Resolution is its own use case returning a decision, not logic inside the write path | `ResolveStepAssigneeUseCase` returns `{assignee, matchedRule, source, reason}` |
| Rule inspector is a server dry-run, `simulateAssignment(...)` | runs the real resolver and discards the result, so the explanation cannot drift from behaviour |
| Candidates are never stored. Computed per resolution from `step.teams`, minus requester, minus excluded | snapshot already carries the teams |
| `wbyWorkflowAssignmentStat` per user: `openCount`, `lastAssignedOn` | one read serves both strategies, and idle reviewers are visible — they are invisible to any query over open states |
| Store `openCount` rather than derive it | only option flat against open work and history; deriving costs ~1MB at 300 open states and ~9MB at 3000 |
| Round-robin needs no cursor | `lastAssignedOn` asc only; `leastLoaded` is the one that sorts on `openCount` |
| `openCount` counts the current step only | identical to `currentAssignee`, so rebuild reproduces it exactly |
| `currentAssignee` written on every resolution, `null` included | "never cleared" was wrong — a fall-through left a decremented holder in place |
| Stat entry id derived from `userId`; drift repaired by a scheduled task | no atomic increment exists; the same pass clears assignees that went invalid after activation |
| Reassign targets the current step, and moves `savedBy` when the step is `inReview` | `approve`/`reject` gate on `isStepOwner`, so without it the old holder keeps the only right to approve |
| `start()`/`takeOver()` by a non-assignee moves `step.assignee` too, source `takeover` | one holder, one answer everywhere |
| `listReviewers(teamIds)`, not `stepId` | step ids are generated in the browser, so an unsaved step cannot be looked up |
| Rule conditions include `language`; apps declare which keys they supply | language is a CMS model (`wbyLanguage`); there is no locale in the API |
| `step.teams` stays the authority on who may review | rules route within it; sign-off, `canReview` and the pool query untouched |
| One reviewer per step | `currentAssignee` is one identity and a step needs one approval |
| Team-to-members lookup stays private to `api-workflows`, wrapped in `withoutAuthorization` | no `api-core` change; an editor picking a reviewer must not need the `security.team` permission |

Safe to do: two of four `updateStep` callers already pass `savedBy` explicitly, and the
other two run only when the actor is already the owner. Also note record-level `savedBy`
isn't persisted by `WorkflowStateMapper.toCmsEntry` — the CMS sets it.

## Still open

- Nothing. All concerns from the brief are settled.

## Keeping `openCount` correct

This is the price of storing it. Every point that changes who holds a step must move the
count. Assumed OpenSearch-backed deployments; DynamoDB-only is out of scope.

| Event | Effect |
| --- | --- |
| Assignment resolved (creation, or on approve of previous step) | increment new holder, set `lastAssignedOn` |
| Manual pick applied at creation | same as above |
| Assignee invalid at activation, cleared | decrement it, then increment whoever resolution picks |
| `start()` or `takeOver()` by someone other than the assignee | decrement old holder, increment new |
| Reassign | decrement old holder, increment new |
| Approve step | decrement holder |
| Reject | decrement holder |
| Cancel | decrement holder |

A missed decrement leaves a reviewer permanently "busy", and least-loaded then never picks
them again. A rebuild task must recompute every count from open states. No backfill is
needed for existing tenants — nothing was ever assigned before this feature.

The dry-run (`simulateAssignment`) must never write.

## Rough order

1. Team → members lookup inside `api-workflows`.
2. `currentAssignee` + reassignment, defined against the existing takeover path.
3. Notification handler for the existing state events.
4. Strategies (round-robin, then least-loaded).
5. Routing rules.
6. Exclusion list + its settings surface.
7. Manual selection at submit.
