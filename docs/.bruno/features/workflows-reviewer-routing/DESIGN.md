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

### Shared assignment field

`assignment` is identical on the workflow and on the state snapshot, so one builder defines
it. The `fields()` callback takes the same registry at every nesting level, so a plain
function works. Use the public alias `ModelFactory.FieldBuilder`; `FieldBuilderRegistry` is
marked internal.

```ts
// domain/workflow/assignmentField.ts
export const createAssignmentField = (fields: ModelFactory.FieldBuilder) =>
    fields.object().label("Assignment").fields(f => ({
        strategy: f.text().label("Strategy").predefinedValues(strategies),
        allowManualSelection: f.boolean().label("Allow manual selection"),
        rules: f.object().label("Rules").list().fields(r => ({ /* ... */ }))
    }));
```

Every nested key must be declared, with a label. `CmsModelObjectFieldConverterPlugin`
iterates only declared child fields when converting to storage — undeclared keys vanish
silently, with no error — and an unlabelled field renders blank in the admin.

### `wbyWorkflow` — step additions

```
resolutionType: "manual"            // single value for now; gates the assignment section
assignment: {
  strategy: "none" | "roundRobin"
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

`resolutionType` must not be `.required()`, or existing entries fail on their next update.

Conditions combine with AND. Absent conditions do not constrain. Rules evaluate in `order`;
the first whose conditions all match wins and later rules are not evaluated.

Rules belong to the step and are written by an administrator. The requester has no say in
assignment and does not see it — `requesterId` and `requesterTeamId` are data a rule may
test, not a choice the requester makes. The one exception is `allowManualSelection`, which an
administrator turns on per step.

Content conditions match keys in `targetContext`, which each app's
`WorkflowStateContextProvider` decorator supplies. `api-workflows` defines the full condition
set and never learns which app supplies what. An app additionally declares the keys it
provides, so the rule editor offers only conditions that can actually match.

| App | Supplies |
| --- | --- |
| Headless CMS | `folderId`, `modelId` |
| Website Builder | `folderId`, `language` |

The CMS provider returns `{folderId, modelId}` today; the WB provider returns `{folderId}` and
gains `language` from `page.properties.language` — untyped and written by the admin forms, so
it must be returned as `null` when absent. Language is a CMS model (`wbyLanguage`), not a
request-scoped locale; there is no locale concept in the API.

Requester conditions come from the state, not from an app. `requesterId` is `createdBy`.
`requesterTeamId` matches when the requester's snapshotted team list contains the rule's id;
when that list is `null` the rule is skipped with a distinct reason.

A rule stores `folderId`, never a folder path. Paths are rebuilt on move by the FLP cascade,
so a path stored on the rule would break the first time that folder moves.

### `wbyWorkflowState` — root additions

```
currentAssignee: { id, displayName, type } | null
requesterTeams:  string[] | null
```

`currentAssignee` is the queryable projection of who holds the current step. It must live at
the root, not on the step: CMS object lists are mapped as OpenSearch `object`, not `nested`,
so filters on an object array do not correlate within one element. A filter on
`steps.assignee.id` would match steps already approved or not yet started.

Written on every resolution, including `null` when nothing resolves. Left in place on final
approve, reject and cancel — `isActive` and `state` already exclude those from every query,
and it doubles as a record of who finished the work.

`requesterTeams` is captured once at creation, so a rule testing the requester's team behaves
the same at step 1 and step 3. Reading it live would split one review across two routing
bases when the requester changes team mid-review, and would silently stop matching if they
leave — `GetUserTeamsUseCase` swallows every failure to `[]`.

It is nullable on purpose. `ListUserTeamsUseCase` fails for every identity that is not an
admin user, API keys included, and `GetUserTeamsUseCase` turns that into `[]`. Storing `null`
for "no answer" keeps it distinct from "genuinely in no team", so the inspector can say why a
`requesterTeamId` rule did not fire instead of silently reporting no match. `fromCmsEntry`
defaults it to `null` for states written before the field existed.

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

### `wbyWorkflowAssignment` — new private model

```
userId:         string
lastAssignedOn: datetime
```

One entry per reviewer. Answers "whose turn is it" without touching workflow states — a
reviewer holding nothing appears in no open state at all, so they are invisible to any query
over states, and scanning finished states grows with history forever.

Written on assignment, never decremented. One write site, nothing to drift, no repair.

Entry id is `${sha256(userId)}#0001` — entry ids must match
`^[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]$`, and non-Cognito user ids contain `:`, `|` or `@`.
`GetWebhookSettingsRepository` builds its singleton id the same way, `createCacheKey(...)`
plus the revision suffix. `GetEntriesByIds` takes **revision** ids, hence `#0001`, and
returns partial results for ids that do not exist — absent means never assigned.

Read **by id**, never as a list. Ids are derivable from the candidate set, and
`GetEntriesByIds` goes through the storage layer directly rather than the search index — a
list read lags about a second behind writes, long enough for two nearby resolutions to see
stale timestamps and pick the same reviewer. This holds on SQL too; every backend implements
the same use case.

No open-assignment count is kept. It was carried for two rounds as a tiebreak and cannot
break one: `lastAssignedOn` is millisecond-precision and written with every assignment, so
two candidates tie only when both are absent — and absent means never assigned for both. As a
*primary* sort it would need every one of nine transitions to fire exactly once, and a stuck
count would silently starve a reviewer forever.

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

| Strategy | Order |
| --- | --- |
| `none` | no assignee; team pool, as today |
| `roundRobin` | `lastAssignedOn` asc, absent first, then `userId` |

Whoever waited longest gets the turn; anyone never assigned goes first.

Two genuinely simultaneous resolutions can still pick the same reviewer — there is no lock.
Both then get a fresh timestamp and rotation carries on, so it corrects within one cycle.

This is least-recently-assigned across the tenant, not rotation within a step. A reviewer on
several teams is pushed back in all of them by work from any one. That spreads total load,
which is the intent, but it is not what the brief describes and is worth flagging.

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

### Assignee goes invalid after activation

A step activates with a valid assignee; the person then leaves the team or is excluded while
the step is still `pending`. Nothing re-checks until the next resolution.

Accepted. The step shows a name that can no longer act, and the next transition corrects it.
Work is never stuck — the item stays in the team pool and anyone on the team can `start()` it.

Not computed at read. `WorkflowState` is constructed as `(record, teams, identity)`, where
`teams` is the *current identity's* teams; the assignee's membership and the exclusion list
are not reachable from it. Threading both in means changing six construction sites, and
`ListWorkflowStates` builds one instance per row — a per-row user lookup on every list view,
to correct a displayed name.

## Holder changes

`step.assignee`, `currentAssignee` and `assignmentSource` always move together. One holder,
one answer everywhere.

| Event | Effect |
| --- | --- |
| Resolution | holder := decision, source := rule/strategy/manual |
| `start()` / `takeOver()` by a non-assignee | holder := actor, source := `takeover` |
| Reassign | holder := target, source := `reassign` |
| Resolution yields nothing | holder := `null` |

`lastAssignedOn` is written on every assignment, not only the first — rotation reads it, so
setting it once at creation would break rotation from the second step onward.

## Writes

Assignment folds into the write the transition already performs. `EventPublisher` is
synchronous and in-process, so an after-event handler would run in-request — but the use case
has already called `repository.execute()` by then, so that would be a second write to the
same record and a lost-update window.

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

`toCmsEntry` must gain every new field, and both mappers must default a missing
`resolutionType` to `manual` for entries written before the field existed.

## Reassignment

`ReassignWorkflowStateStepUseCase(id, userId)`. The use case resolves the user to
`{id, displayName, type}` before calling `reassign(identity)` on the domain object, which has
no way to look one up. Targets the current step only. Separate from `takeOver()`, which stays
unchanged.

They differ on every axis: `takeOver` pulls to self, needs no permission, and requires the
step to be `inReview` with `savedBy` set. Reassign pushes to another person, needs a
permission, and must work on a step that is assigned but not yet started, where `savedBy` is
null and `canTakeOver` is false.

```
reassign(userId):
  guard: isActive, not rejected, current step is pending or inReview
  step.assignee         = user
  step.assignmentSource = "reassign"
  currentAssignee       = user
  if step.state == inReview:
      step.savedBy = user      // transfers isOwner, so they can approve
  // pending: savedBy stays null, the new assignee starts normally
```

Without the `savedBy` transfer the old holder would remain the only person able to approve,
since `approve()` and `reject()` gate on `isStepOwner`. The guard matters because
`currentStep` returns the rejected step when one exists, and the last approved step when all
are done — reassign must not write to a finished review.

Side effect worth stating: after the transfer, the previous holder satisfies `canTakeOver`
and can pull it back without any permission. That is existing takeover behaviour.

## Deletion and workflow lifecycle

### Trashing content deletes its review

The review must go, and the entry's `system.workflow` must be cleared. That field is a
denormalised copy on the entry, not a reference resolved at read, so it survives the state's
deletion and would keep showing "in review" against nothing after a restore.

Timing matters. `MoveEntryToBinUseCase` writes `wbyDeleted: true` and only then publishes
`EntryAfterDeleteEvent`. By that point `GetRevisionByIdNotDeleted` rejects the entry, so the
existing `ClearEntryStateOnWorkflowStateAfterDelete` fails silently. The work has to happen
before the flag is written.

```
api-headless-cms-workflows     -> EntryBeforeDeleteEventHandler
api-website-builder-workflows  -> PageBeforeTrashEventHandler
```

Two new handlers, each its own file. Website Builder needs its own because `TrashPage`
publishes its own events — and it needs the **Before** one for the same reason: `TrashPage`
calls CMS `deleteEntry(pageModel, id, { permanently: false })`, so by the time
`PageAfterTrashEvent` fires the page is flagged and `GetEntriesByIdsNotDeleted` hides it from
`UpdatePage`. `DeleteWorkflowStateOnPageAfterDelete` fires only on permanent delete from the
trash and has no `permanent` guard to remove.

The CMS handler must guard on `isModelAllowed(model)`. Website Builder trash routes through
CMS `deleteEntry` on `wbyPage`, and deleting a state is itself a CMS delete on
`wbyWorkflowState`. Both models are `.private()`, so the one guard stops the handler acting
on pages twice and stops it recursing into itself.

Deletion must cover **every** revision's review, keyed on `targetId`. `GetTargetWorkflowState`
keys on `targetRevisionId` with `limit: 1`, and the bin resolves the latest revision only, so
a review on an earlier revision would otherwise survive for binned content. Needs one new
repository method.

That list read goes through the search index, which lags about a second, so a review created
immediately before the trash can be missed. The handler therefore deletes states on **both**
trash and permanent delete — the event carries `permanent`, and only the badge clear is
skipped when true, since the entry is already flagged by then. A state the index missed at
trash time is caught when the bin is emptied.

`DeleteWorkflowStateRepository` must pass `{ permanently: true }`. States are hard-deleted,
never binned.

The handler must swallow its own failures. `EventPublisher` awaits handlers with no
try/catch and `MoveEntryToBinUseCase` turns a throw into `Result.fail`, so a failing
before-handler would abort the trash itself.

Accepted cost of the before-delete timing: if the delete then fails, the badge is cleared
while the state still exists. The review continues and only the badge is stale until the next
state update.

### Deleting a workflow lets its reviews finish

Nothing in a running review needs the workflow. Every field comes from the snapshot: steps,
teams, assignment config, rules.

`UpdateWorkflowStateUseCase` (cancel's path) and `DeleteTargetWorkflowStateUseCase` both
fetch the workflow, check it exists, and never use the value. Remove both checks and their
`GetWorkflowUseCase` dependencies, along with the dead `workflowNotFound:
WorkflowNotFoundError` entries — which appear in **seven** places, not two: Update, Cancel,
DeleteTarget, Start, Approve, Reject and TakeOver. The last four never fetched a workflow at
all, so theirs were already unreachable.

This fixes a live bug rather than tidying dead code. Today `DeleteTargetWorkflowStateUseCase`
returns `WorkflowNotFoundError` when the workflow is gone, `EventPublisher` has no try/catch,
and `DeleteEntryUseCase` turns that into `Result.fail` — so deleting content whose workflow
was deleted currently fails the content delete.

Running reviews then approve, reject, cancel and delete normally; no new review can start,
because `CreateWorkflowState` still needs a workflow and correctly fails.

This is the choice snapshotting already implies, and it is what Temporal and Airflow do —
deleting a definition does not stop executions. Jira refuses the delete instead; Camunda
requires an explicit cascade. Neither fits a design where the instance is self-contained.

No warning is added on delete. Nothing breaks, so there is nothing to warn about.

## Permissions

Configuring assignment, rules and the exclusion list falls under the existing `editor` flag.
That flag is coarse — anyone who can edit one workflow can edit all of them — but widening it
is out of scope.

Reassignment gets its own entity, so it can be granted without workflow editing — except to
full-access holders. `IdentityContext.getPermission` matches with minimatch, so `workflows.*`
already satisfies `workflows.reassign`; an editor with full access gets reassignment
implicitly, and the entity only matters for narrower grants.

Both sides change: the admin schema in `app-workflows/src/domain/permissionsSchema.ts`, and the API,
which today knows only `IWorkflowsSecurityPermission { editor: boolean }` and checks
`permission.name === "*" || permission.editor`. The API check becomes
`getPermission("workflows.reassign")`.

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

input StepAssignmentRuleConditionsInput {
    requesterId: ID
    requesterTeamId: ID
    folderId: ID
    includeDescendantFolders: Boolean
    modelId: String
    language: String
}

input StepAssignmentRuleTargetInput {
    type: String!            # "user" | "team"
    id: ID!
}

input StepAssignmentRuleInput {
    id: ID!
    order: Int!
    conditions: StepAssignmentRuleConditionsInput!
    target: StepAssignmentRuleTargetInput!
}

input StepAssignmentInput {
    strategy: String!        # "none" | "roundRobin"
    allowManualSelection: Boolean!
    rules: [StepAssignmentRuleInput!]!
}

input AssignmentContextInput {
    requesterId: ID!
    folderId: ID
    modelId: String
    language: String
}

input ListTeamReviewersInput {
    teamIds: [ID!]!
}

input ListRequestReviewersInput {
    app: String!
    targetRevisionId: ID!
}

input SimulateAssignmentInput {
    assignment: StepAssignmentInput!     # as edited, may be unsaved
    teamIds: [ID!]!                      # as edited, may be unsaved
    context: AssignmentContextInput!
}

type Reviewer {
    user: WorkflowStateIdentity!
    excluded: Boolean!
    reason: String
}

type StepReviewers {
    stepId: ID!
    allowManualSelection: Boolean!
    candidates: [Reviewer!]!
}

type SimulateAssignmentResult {
    assignee: WorkflowStateIdentity
    matchedRuleId: ID
    source: String!
    reason: String!
}

extend type WorkflowsQuery {
    listTeamReviewers(data: ListTeamReviewersInput!): ListTeamReviewersResponse!
    listRequestReviewers(data: ListRequestReviewersInput!): ListRequestReviewersResponse!
    simulateAssignment(data: SimulateAssignmentInput!): SimulateAssignmentResponse!
}

extend type WorkflowsMutation {
    createWorkflowState(data: CreateWorkflowStateInput!): WorkflowStateResponse!
    reassignWorkflowStateStep(id: ID!, userId: ID!): WorkflowStateResponse!
}
```

`createWorkflowState` moving to an input object is a breaking change. In-repo callers:
`app-workflows/src/features/requestReview/RequestReviewGateway.ts`, plus the api-workflows
test helper and two test suites.

**Two reviewer queries, not one.** They differ in who may call them and in what the caller is
trusted to name:

- `listTeamReviewers(teamIds)` — for the workflow editor. Requires the `editor` permission.
  Takes team ids from the form, so a step whose teams were just changed and not yet saved
  still works.
- `listRequestReviewers(app, targetRevisionId)` — for the submit dialog. The caller never
  names a team; the server reads the saved workflow and derives them. It must still authorize
  against the target: the caller has to be able to read `targetRevisionId` through the normal
  authorized path, or any identity could ask for any app and receive every team's members.
  `CreateWorkflowStateUseCase` finds its workflow by `where: { app }` alone, so
  `targetRevisionId` authorizes nothing today — the same gap exists there and is worth
  closing at the same time.

  `api-workflows` is app-agnostic and cannot read a target itself, so this needs a companion
  to `WorkflowStateContextProvider` on the app side answering "can this identity read this
  target". A new abstraction, not free.

  The response returns only steps with `allowManualSelection`, and omits the exclusion
  `reason` — that is free text an administrator typed, and it should not reach every
  requester. Show the candidate as unavailable instead.

Collapsing these into one query keyed on `teamIds` does not work. Validating the ids against
"workflows the caller can list" protects nothing, because `ListWorkflowsUseCase` performs no
permission check — every workflow in the tenant is listable by any identity, and the GraphQL
root resolvers are ungated. Meanwhile `ListUsersUseCase` enforces `adminUsers.user`, which
the member lookup bypasses via `withoutAuthorization`, so that boundary has to be
re-established deliberately in both queries.

`simulateAssignment` requires `editor` for the same reason — it returns an assignee for
arbitrary `teamIds`, which is a member-enumeration oracle otherwise.

Neither editor query keys on a step id. Step ids are generated in the browser (`mdbid()`,
`generateAlphaNumericId()`), so a new or just-edited step does not exist server-side; steps
are also an object list inside `wbyWorkflow` with no index. `simulateAssignment` therefore
takes the assignment config and teams inline. It still reads storage — candidates mean
listing tenant admin users, plus the exclusion list, the folder lookup and the rotation
read — but it resolves nothing from a saved workflow. Without that, the inspector would
explain the saved rules while the admin looks at unsaved ones, which is exactly the drift it
exists to prevent.

## Notifications

`NotificationTransport` and `MailNotificationTransport` are registered, and handlers already
exist for entry and state lifecycle events in both binding packages. What is missing is
narrower: nothing subscribes to `WorkflowStateStartStepHandler`,
`WorkflowStateApproveStepHandler`, `WorkflowStateRejectHandler` or
`WorkflowStateTakeOverStepHandler`, and nothing sends notifications at all.
`step.notifications` is dead configuration.

Each event has its own handler abstraction, so this is one implementation per event, one file
each — not a single handler subscribing to several.

The events that matter are the ones where an assignment happens: **create** (first step
resolved), **approve** (next step resolved) and **reassign**. Start and takeOver change the
holder without routing, and are worth a notification only if the design later wants one.

`NotificationTransport.SendParams.users` requires `email`; state identities carry only
`{id, displayName, type}`. The handlers resolve emails through the user repository under
`withoutAuthorization`.

An assignment notifies the assignee only, never the whole team. Reassignment notifies both
the previous and the new assignee.

## Admin UI

**Workflow step editor** — assignment section, shown when `resolutionType` is `manual`:
strategy selector, reorderable rule list, manual-selection toggle. Rule condition types are
limited to what the workflow's app declares.

**Rule inspector** — takes a requester, folder, model and language, calls
`simulateAssignment` with the rules currently on screen, shows the resulting assignee and
which rule produced it.

**Request review dialog** — for steps allowing manual selection, an automatic-or-pick choice
per step, captured in one interaction. Automatic is preselected. Excluded users appear
disabled with the reason. One reviewer per step.

**Content review view** — current assignee per step, the source that produced it, and the
reassign action for those holding `workflows.reassign`.

**Tenant settings** — the exclusion list.

## New files

Per the one-implementation-per-file convention:

- `ResolveStepAssigneeUseCase` + abstractions, feature.
- `ReassignWorkflowStateStepUseCase` + abstractions, events, feature.
- `ListTeamReviewersUseCase`, `ListRequestReviewersUseCase`, `SimulateAssignmentUseCase`.
- `GetTeamMembersUseCase` (internal, `withoutAuthorization`).
- `WorkflowExclusionModel` + `WorkflowExclusionModelProvider`, and CRUD features.
- `WorkflowAssignmentModel` + `WorkflowAssignmentModelProvider`, get-by-id and upsert.
- `createAssignmentField` shared builder.
- `EntryBeforeDeleteEventHandler` (`api-headless-cms-workflows`).
- `PageBeforeTrashEventHandler` (`api-website-builder-workflows`).
- A `targetId`-keyed list and delete on the workflow-state repository.
- A rule-target validator invoked from `StoreWorkflow`.
- A target-access check abstraction per app, companion to `WorkflowStateContextProvider`.
- Notification handlers for create, approve and reassign.

## Out of scope

Everything the brief lists, plus:

- Load-based assignment. No open-assignment count is kept at all.
- Per-step or per-team rotation. Rotation is least-recently-assigned across the tenant.
- Re-validating an assignee after their step activated. Corrected at the next transition.
- A warning when deleting a workflow with reviews in flight.
- Check and AI steps. `resolutionType` exists so the assignment section has something to key
  off, but it carries one value.
- Assignment history. Only the current assignment and its source are kept, so the brief's
  audit entry is not delivered.
- Widening the `editor` permission.
- Several reviewers per step.
- Rules replacing `step.teams` as the authority on who may review.
- DynamoDB-only deployments.
