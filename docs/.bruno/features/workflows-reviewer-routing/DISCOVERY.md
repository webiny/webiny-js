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
  notifications}`. No check step, no AI step. "Hide assignment for check/AI steps" is a
  no-op until that lands separately.
- **Reviewers are teams, never users.** So "target must sit within the step's reviewers"
  means *member of one of the step's teams*.
- **No team → members lookup.** Membership lives on the user (`AdminUser.teams: string[]`)
  and `ListUsersInput.where` only has `id_in`. Note both backends already list every
  tenant user on any `listUsers` call, and filter in memory — so a `teams` filter costs the
  same as what ships today. `ListFolderLevelPermissionsTargets` already does exactly this
  on a user-facing picker. Cost is fine; the capability is just missing.
- **No assignee field.** `IWorkflowStateRecordStep` has `savedBy` (who acted), not an
  assignee.
- **Target context is missing locale.** `CmsWorkflowStateContextProvider` returns
  `{folderId, modelId}`. Locale and requester teams aren't captured.
- **No tenant settings surface** for the exclusion list.

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

Safe to do: two of four `updateStep` callers already pass `savedBy` explicitly, and the
other two run only when the actor is already the owner. Also note record-level `savedBy`
isn't persisted by `WorkflowStateMapper.toCmsEntry` — the CMS sets it.

## Still open

- Round-robin cursor placement.

## Rough order

1. Team → members lookup in `api-core`.
2. `currentAssignee` + reassignment, defined against the existing takeover path.
3. Strategies (round-robin, then least-loaded).
4. Routing rules.
5. Exclusion list + its settings surface.
6. Manual selection at submit.
