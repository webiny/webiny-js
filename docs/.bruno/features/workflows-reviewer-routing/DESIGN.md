# Reviewer Routing — Design

Companion to `DISCOVERY.md`, which carries the reasoning and the code evidence behind each
decision. This document says what gets built.

Assumes an OpenSearch-backed deployment. DynamoDB-only is out of scope.

## Scope

A manual workflow step gains an assignment configuration: an automatic strategy, an ordered
list of routing rules, and a flag for whether the editor may pick a reviewer at submit time.
The tenant gains a list of excluded users. An active step's assignee can be changed.

`step.teams` stays the authority on who *may* review. Rules decide who *gets* it. Sign-off
authority, `canReview` and the pending pool query are untouched.

Existing workflows are unaffected. A step with no assignment configuration behaves exactly as
it does today: the content sits in the team pool, unassigned.

## Data model

### `wbyWorkflow` — step additions

```
resolutionType: "manual"            // single value for now; gates the assignment section
assignment: {
  strategy: "none" | "roundRobin" | "leastLoaded"
  allowManualSelection: boolean
  rules: [{
    id: string
    order: number
    conditions: {
      requesterId?: string
      requesterTeamId?: string
      folderId?: string
      includeDescendantFolders?: boolean
      modelId?: string
      language?: string
    }
    target: { type: "user" | "team", id: string }
  }]
}
```

Conditions combine with AND. Absent conditions do not constrain. Rules evaluate in `order`;
the first whose conditions all match wins and later rules are not evaluated.

Conditions match against keys in `targetContext`, which each app's
`WorkflowStateContextProvider` decorator supplies. `api-workflows` defines the full condition
set and never learns which app supplies what. An app additionally declares the keys it
provides, so the rule editor offers only conditions that can actually match.

| App | Supplies |
| --- | --- |
| Headless CMS | `folderId`, `modelId` |
| Website Builder | `folderId`, `language` |

The CMS provider returns `{folderId, modelId}` today; the WB provider returns `{folderId}` and
gains `language` from `page.properties.language`. Language is a CMS model (`wbyLanguage`),
not a request-scoped locale — there is no locale concept in the API.

A rule stores `folderId`, never a folder path. Paths are rebuilt on move by the FLP cascade,
so a path stored on the rule would break the first time that folder moves.

### `wbyWorkflowState` — root additions

```
currentAssignee: { id, displayName, type } | null
```

Queryable projection of who holds the current step. It must live at the root, not on the
step: CMS object lists are mapped as OpenSearch `object`, not `nested`, so filters on an
object array do not correlate within one element. A filter on `steps.assignee.id` would match
steps already approved or not yet started.

Written on every resolution, including `null` when nothing resolves. Left in place on final
approve, reject and cancel — `isActive` and `state` already exclude those from every query,
and it doubles as a record of who finished the work.

### `wbyWorkflowState` — step additions

```
resolutionType:   "manual"
assignment:       { strategy, allowManualSelection, rules }   // snapshot
assignee:         { id, displayName, type } | null
assignedBy:       { id, displayName, type } | null
assignedOn:       datetime | null
assignmentSource: "manual" | "rule:<ruleId>" | "strategy:<name>"
                  | "reassign" | "takeover" | null
```

`assignment` is snapshotted alongside `teams`, so a review behaves the way it was configured
when it started. Editing a workflow never changes a review in flight.

Current assignment only. No history is kept.

### `wbyWorkflowExclusion` — new private model

```
userId: string
reason: string | null
until:  datetime | null
```

One entry per exclusion. `until` is filtered at read; lapsed entries are ignored, not
deleted. Tenant-scoped for free — CMS entry keys carry tenant and model, no locale.

### `wbyWorkflowAssignmentStat` — new private model

```
userId:         string
openCount:      number
lastAssignedOn: datetime | null
```

One entry per reviewer, with a deterministic entry id derived from `userId` so lookups are a
direct `get` and first-time creation cannot race. `createEntryId` honours a supplied id; this
is how `WebhookSettings` does its singleton.

`openCount` counts states where this user holds the **current** step — identical to what
`currentAssignee` records, so a rebuild reproduces it exactly. Pre-assigned later steps are
not counted; work that cannot be started is not load.

## Resolution

`ResolveStepAssigneeUseCase` returns a decision and writes nothing:

```
{ assignee, matchedRule, source, reason }
```

Callers persist it. The rule inspector discards it. Running the same code for both is the
point: an explanation that reimplements the logic is wrong exactly when it matters.

### When it runs

At workflow-state creation for the first step, and on approve of a step for the next one.

Not on `start()`. `approve()` sets the record to `pending` and does not mark the next step
`inReview` — a step only becomes `inReview` when a reviewer calls `start()`. Resolving there
would be too late, because that person has already selected themselves.

### Order

1. An assignee already on the step, if still valid. Manual picks are written at creation, so
   this is how they win. Validity means: still a member of the step's teams, and not
   excluded. Invalid assignees are cleared and resolution continues.
2. The first routing rule whose conditions all match. A rule whose target is invalid — user
   gone, user excluded, target no longer within the step's teams — is skipped and evaluation
   continues with the next rule.
3. The step's automatic strategy, over the candidate pool.
4. Nothing. `currentAssignee` is set to `null`, the content sits in the team pool, and the
   reason is recorded.

Assignment never blocks a review. Every failure falls through.

### Candidates

Computed per resolution, never stored:

- Members of the step's teams. Membership lives on the user (`AdminUser.teams`), so this
  lists tenant admin users and filters. Runs under `withoutAuthorization`, so the result must
  be scoped to the step's teams.
- Minus the requester (`createdBy`). They can never review their own submission.
- Minus excluded users.

A rule with a team target narrows the pool to that team, then the strategy runs within it.

### Strategies

Both read `wbyWorkflowAssignmentStat` once. Neither queries workflow states.

| Strategy | Order |
| --- | --- |
| `none` | no assignee; team pool, as today |
| `roundRobin` | `lastAssignedOn` asc, absent first, then `userId` |
| `leastLoaded` | `openCount` asc, then `lastAssignedOn` asc, then `userId` |

`roundRobin` ignores load deliberately — everyone takes a turn. `leastLoaded` is the more
accurate answer in most cases and is the one to recommend in the UI.

### Folder condition

- `includeDescendantFolders` off: compare `folderId` directly.
- On: read the rule's folder for its current `path`, prefix-compare against the content
  folder's `path`. The lookup runs under `withoutAuthorization`, or the rule would silently
  fall through for approvers who lack folder-level read access.

`path` is eventually consistent. The cascade that rewrites descendant paths after a move runs
as a background task and swallows its errors, so a rule can mismatch briefly after a move. A
mismatch falls through, which is a legitimate outcome.

A deleted rule folder cannot have held anything — ACO only deletes empty folders — so the
rule matched nothing. It fails to resolve and is skipped.

## Keeping `openCount` correct

| Event | Effect |
| --- | --- |
| First step resolved at creation | increment holder, set `lastAssignedOn` |
| Next step resolved on approve | decrement previous holder, increment new |
| Invalid assignee cleared at activation | decrement it, then increment whoever is picked |
| `start()` / `takeOver()` by someone other than the assignee | decrement old, increment new |
| Reassign | decrement old, increment new |
| Reject | decrement holder |
| Cancel | decrement holder |
| Target deleted (`DeleteTargetWorkflowStateUseCase`) | decrement holder |

Manual picks on later steps are stored but not counted until that step activates.

`DeleteTargetWorkflowStateUseCase` fires from `DeleteWorkflowStateOnEntryAfterDelete`,
`DeleteWorkflowStateOnPageAfterDelete` and `DeleteWorkflowsOnModelAfterDelete`. Without its
row, deleting an entry mid-review leaves the reviewer permanently busy.

`currentAssignee` follows whoever actually holds the step, so `step.assignee`,
`currentAssignee` and `assignmentSource` all move together on `start()` and `takeOver()` by
a non-assignee, with the source becoming `takeover`. One holder, one answer everywhere.

### Drift and repair

Stat writes are read-modify-write; `UpdateEntryUseCase` has no atomic increment or
conditional write. Two approvals landing on the same reviewer at the same instant lose one
increment. The consequence is mild — that reviewer looks slightly less loaded and gets one
extra item.

A scheduled task repairs it. For each open state it checks the holder is still in the step's
teams and not excluded, clears the invalid ones, and recounts every `openCount` from
`currentAssignee`. That single pass also catches an assignee who went invalid *after* the
step activated, which nothing else re-checks.

No backfill is needed for existing tenants; nothing was ever assigned before this feature.

`simulateAssignment` must never write.

## Writes

Assignment folds into the write the transition already performs. `EventPublisher` is
synchronous and in-process, so an after-event handler would run in-request — but the use case
has already called `repository.execute()` by then, so that would be a second write to the
same record and a lost-update window. Stat writes are necessarily separate, and are covered
by the repair task above.

`updateStep` currently stamps `savedBy` with the current identity on every mutation. That
must stop, and callers must pass it explicitly.

The refactor preserves behaviour. Four call sites: `start()` and `takeOver()` already pass
`savedBy` explicitly; `approveStep()` and `rejectStep()` run only when the actor is already
the owner, so the stamp rewrites the id it already holds. Only `displayName` and `type` could
differ, and `isOwner` compares id alone.

Without this, writing step 2's assignee during approve-of-step-1 would stamp step 2's
`savedBy` with step 1's approver, making them `isOwner` of step 2 and granting them the right
to approve it. A privilege escalation through a bookkeeping side effect.

Record-level `savedBy` is not ours — `WorkflowStateMapper.toCmsEntry` omits it and CMS sets
it from the acting identity. `updateRecord({ savedBy })` in `start()` and `takeOver()` only
shapes the in-memory object the GraphQL response serialises; the value is the same either way.

`toCmsEntry` must gain every new field. It silently drops anything not listed, so an omission
surfaces as "assignment mysteriously does not persist" rather than a type error.

## Reassignment

`ReassignWorkflowStateStepUseCase(id, userId)`, with a matching `reassign(userId)` on the
domain object. Targets the current step only. Separate from `takeOver()`, which stays
unchanged.

They differ on every axis: `takeOver` pulls to self, needs no permission, and requires the
step to be `inReview` with `savedBy` set. Reassign pushes to another person, needs a
permission, and must work on a step that is assigned but not yet started, where `savedBy` is
null and `canTakeOver` is false.

```
reassign(userId):
  step.assignee         = user
  step.assignmentSource = "reassign"
  currentAssignee       = user
  if step.state == inReview:
      step.savedBy = user      // transfers isOwner, so they can approve
  // pending: savedBy stays null, the new assignee starts normally
```

Without the `savedBy` transfer the old holder would remain the only person able to approve,
since `approve()` and `reject()` gate on `isStepOwner`.

## Permissions

Configuring assignment, rules and the exclusion list falls under the existing `editor` flag.
That flag is coarse — anyone who can edit one workflow can edit all of them — but widening it
is out of scope.

Reassignment gets its own entity, so it can be granted without workflow editing. Both sides
change: the admin schema in `app-workflows/src/domain/permissionsSchema.ts`, and the API,
which today knows only `IWorkflowsSecurityPermission { editor: boolean }` and checks
`permission.name === "*" || permission.editor`.

```ts
createPermissionSchema({
    prefix: "workflows",
    fullAccess: { editor: true },
    entities: [{
        id: "reassign",
        title: "Reassignment",
        permission: "workflows.reassign",
        scopes: ["full"],
        actions: [{ name: "reassign", label: "Reassign reviews" }]
    }]
});
```

## Validation

The server validates, not the UI:

- `assignees` on create: the step allows manual selection, the target is in the step's teams,
  not excluded, and not the requester.
- `userId` on reassign: same checks, plus the caller holds `workflows.reassign`.
- Rule target on save: within the step's teams. Rejected if not.
- Changing a step's teams is **not** blocked. Affected rules are flagged instead —
  evaluation already skips an invalid target, and blocking would trap admins.

## Notifications

`NotificationTransport` and `MailNotificationTransport` are registered, and handlers do exist
for the create, update, delete and cancel events — `api-headless-cms-workflows` has eight,
with siblings in `api-website-builder-workflows`. What is missing is narrower: nothing
subscribes to `WorkflowStateStartStepHandler`, `ApproveStepHandler`, `RejectStepHandler` or
`TakeOverStepHandler`, and nothing sends notifications at all. `step.notifications` is dead
configuration.

Each event has its own handler abstraction, so this is one implementation per event, one file
each — not a single handler subscribing to several.

`NotificationTransport.SendParams.users` requires `email`; state identities carry only
`{id, displayName, type}`. The handlers resolve emails through the user repository under
`withoutAuthorization`.

An assignment notifies the assignee only, never the whole team. Reassignment notifies both
the previous and the new assignee.

## GraphQL

```graphql
input CreateWorkflowStateInput {
    app: String!
    targetRevisionId: ID!
    title: String!
    assignees: [WorkflowStateAssigneeInput!]
}

input WorkflowStateAssigneeInput {
    stepId: ID!
    userId: ID!
}

type Reviewer {
    user: WorkflowStateIdentity!
    excluded: Boolean!
    reason: String
}

input SimulateAssignmentInput {
    workflowId: ID!
    stepId: ID!
    requesterId: ID!
    folderId: ID
    modelId: String
    language: String
}

type SimulateAssignmentResult {
    assignee: WorkflowStateIdentity
    matchedRuleId: ID
    source: String!
    reason: String!
}

extend type WorkflowsQuery {
    listReviewers(teamIds: [ID!]!): ListReviewersResponse!
    simulateAssignment(data: SimulateAssignmentInput!): SimulateAssignmentResponse!
}

extend type WorkflowsMutation {
    createWorkflowState(data: CreateWorkflowStateInput!): WorkflowStateResponse!
    reassignWorkflowStateStep(id: ID!, userId: ID!): WorkflowStateResponse!
}
```

`createWorkflowState` moving to an input object is a breaking change. One in-repo caller:
`app-workflows/src/features/requestReview/RequestReviewGateway.ts`.

`listReviewers` takes team ids rather than a step id. Step ids are generated in the browser
(`mdbid()`, `generateAlphaNumericId()`), so a new or just-edited step does not exist
server-side and could not be looked up; steps are also an object list inside `wbyWorkflow`
with no index. Both callers hold the team ids: the rule editor from its own form, the submit
dialog from the workflow it already loads.

Accepted trade-off: `listReviewers` returns identities for any teams named, to any
authenticated admin user. `simulateAssignment` requires `editor`.

## Admin UI

**Workflow step editor** — assignment section, shown when `resolutionType` is `manual`:
strategy selector, reorderable rule list, manual-selection toggle. Rule condition types are
limited to what the workflow's app declares.

**Rule inspector** — takes a requester, folder, model and language, calls
`simulateAssignment`, shows the resulting assignee and which rule produced it.

**Request review dialog** — for steps allowing manual selection, an automatic-or-pick choice
per step, captured in one interaction. Automatic is preselected. Excluded users appear
disabled with the reason. One reviewer per step.

**Content review view** — current assignee per step, the source that produced it, and the
reassign action for those holding `workflows.reassign`.

**Tenant settings** — the exclusion list.

## Out of scope

Everything the brief lists, plus:

- Check and AI steps. `resolutionType` exists so the assignment section has something to key
  off, but it carries one value.
- Assignment history. Only the current assignment and its source are kept, so the brief's
  audit entry is not delivered.
- Widening the `editor` permission.
- Several reviewers per step.
- Rules replacing `step.teams` as the authority on who may review.
- DynamoDB-only deployments.
