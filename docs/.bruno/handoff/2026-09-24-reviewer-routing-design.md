# Session Handoff — 2026-09-24 — Reviewer Routing Design

## What was done

- Discovery and design for reviewer routing in advanced publishing workflows, driven by the
  product brief. Two docs in `docs/.bruno/features/workflows-reviewer-routing/`:
  - `DISCOVERY.md` — the brief's open questions answered against the code, plus decisions.
  - `DESIGN.md` — the design, rewritten after five adversarial review passes.
- Six review passes run with a fable subagent. Each found real defects; the last passes kept
  finding new ones introduced by the previous fixes.
- Bug filed: `docs/bugs/workflows-full-access-permission-never-matches.md`. Workflows full
  access grants nothing, in both `api-workflows` and `app-workflows`.
- One code change (user's): `DeleteWorkflowStateRepository` passes `{ permanently: true }`.
- 19 commits, docs only apart from that one line. `api-workflows`: 53 tests passing.

## Key decisions

**Stop patching. Redesign the data model from scratch.** The current design kept working
around one shape: the workflow state is a single CMS entry with a nested `steps` object list,
asked to answer per-step queries. OpenSearch maps object lists as `object`, not `nested`, so
nothing correlates within a step. Every fix added a root projection or a side model.

Backward compatibility is dropped. Existing data does not matter — users rerun reviews and may
recreate workflows and steps.

Proposed structure, to start from next session:

```
wbyWorkflow                     definition
  steps[]: { id, title, teams, notifications, resolutionType,
             assignment: json }            // config, read whole, never queried

wbyWorkflowReview               one per review
  app, targetId, targetRevisionId, workflowId
  status: pending | inReview | approved | rejected | cancelled
  requester: identity, requesterTeams: string[]
  snapshot: json                           // frozen workflow, never queried

wbyWorkflowReviewStep           one per step per review
  reviewId, targetId, stepId, order
  status: waiting | pending | inReview | approved | rejected
  teamIds: string[]
  assignee, assignedBy, assignedOn, assignmentSource
  owner: identity                          // replaces savedBy
  comment

wbyWorkflowReviewer             one per user: lastAssignedOn
wbyWorkflowExclusion            userId, reason, until
```

What it removes: the nested-correlation problem (pool and personal queue become flat filters on
the step record), the `isActive`-vs-`state` trap (one `status`), the `savedBy` auto-stamp
escalation (`owner` only written by start/takeOver/reassign), the need to declare every nested
rule key (rules in `json`), and the existing pool-query bug (matches a team on any step).

New cost: approve writes two records with no cross-entry transaction. Order the writes
(current → approved, then next → pending) and make "not finished, no step pending or inReview"
detectable and idempotently repairable.

Decisions from the grilling that carry over:

- `step.teams` stays the authority on who may review; rules route within it.
- Strategies: `none` and `roundRobin` only. Rotation = `lastAssignedOn` asc, absent first, then
  `userId`. No open-assignment count at all.
- Rule conditions: requester, requester team, folder (+ descendants), model, language. Apps
  declare which `targetContext` keys they supply.
- Rules store `folderId`, never a path; descendant test is a `path` prefix compare.
- Snapshot everything at review creation, including requester teams.
- Resolve lazily: at creation for step 1, on approve for the next step. Never on `start()`.
- Manual picks applied at creation; one reviewer per step. `createWorkflowState` takes one
  input object.
- Reassign: own use case, current step only, transfers ownership when `inReview`, own
  permission entity `workflows.reassign`. `takeOver` stays.
- Deleting a workflow lets running reviews finish — the snapshot is self-contained.
- Trashing content deletes every review for the target, on the **before** event
  (`EntryBeforeDeleteEvent`, `PageBeforeTrashEvent`) — after it, the entry is unupdatable.
- Two reviewer queries: `listTeamReviewers` (needs `editor`) and `listRequestReviewers`
  (authorized against the target via a default-deny `WorkflowTargetAccess` abstraction with
  per-app decorators).
- Stale assignees are not re-validated at read. No assignment history is kept.
- Assume OpenSearch-backed deployments; SQL is coming and everything goes through CMS use
  cases.

## Current state

- Branch: `bruno/refactor/workflows/routing`
- Tests: `api-workflows` 53 passed
- Build: `api-workflows` passing; lint and format clean
- Unpushed commits: 20 (including this handoff)
- `DESIGN.md` is superseded by the new structure above; do not keep patching it.

## What might come next

1. Write a fresh `DESIGN.md` around the new data model, replacing the current one. Start from
   the access-pattern table, not the models.
2. Fix the permission bug first — `WORKFLOWS_PERMISSION` to `"workflows.*"` in both packages,
   and the `editor === "yes"` vs `editor: true` mismatch in `useWorkflowsPermission`. Add a test
   that grants `workflows.*`, not `*`.
3. Open items from the sixth review that survive the redesign:
   - CMS target access must enforce folder-level permissions via
     `FolderLevelPermissions.canAccessFolderContent`, like `CmsWorkflowStateFilter` —
     `AccessControl` has no folder logic. Binned targets count as inaccessible.
   - Default-deny `WorkflowTargetAccess` breaks `WorkflowStateUseCases.test.ts`; needs a test
     allow-decorator.
   - Zod validators strip unknown keys; every new input needs its validator updated.
   - GraphQL error type is `WorkflowError`, not `WorkflowsError`.
   - Team-target rule with `strategy: none` needs defined behaviour.
   - Single-revision delete (`RevisionBeforeDelete`) is uncovered.
   - `workflows.reassign`: pick entity-existence or `reassign: true` flag, not both.
4. Not a workflows problem, but it caps scale: membership is user → teams only, so candidate
   computation lists every tenant user. Lives in `api-core`.
5. Correlated filtering on object lists (`nested` mapping) is possible as a platform feature but
   is a separate storage-layer project — query builder rewrite, reindex, pg-os parity. Not needed
   for workflows once steps are their own records.
