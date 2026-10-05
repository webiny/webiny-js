# Workflows refactor: design

Status: draft, 2026-10-05. Consolidates decisions D1-D73 in `docs/.bruno/workflows/decisions.md`; where decisions refine or supersede each other, this document states the final result. Decision ids are given in brackets for traceability. Discovery background lives in `docs/.bruno/workflows/` (`README.md`, `api.md`, `app.md`, `integrations.md`, `infrastructure.md`); the product brief for routing is `docs/.bruno/workflows/routing.md`.

## 1. Goals

1. Rewrite Advanced Publishing Workflows (API and admin) on a clean model that is easy to query and extend.
2. Add reviewer routing: automatic strategies, ordered routing rules, editor picks at submit, a tenant exclusion list, reassignment, and notifications.
3. Add step types beyond human review: automation steps defined in code, and AI steps.
4. Fix the correctness problems found in discovery as part of the rewrite (permissions on review operations, stale `system.workflow`, broken list filters, error propagation, shared presenters) [D18].

## 2. Constraints

- Stored shape is free to change. No migration, no backward compatibility [D1]. This overrides the brief's "nothing changes for existing workflows": `next` is unreleased.
- GraphQL operations, types and public package exports may break. CMS and WB workflow packages change in the same work. Admin and API deploy together [D17].
- Workflows is an enterprise feature. OpenSearch storage is assumed; DDB-only performance is not a design constraint [D63].
- Order of work: fix the double registration of `WorkflowsFeature` first (bug B2), then go straight into the rewrite [D18].

## 3. Terminology

| Term | Meaning |
|---|---|
| Workflow | Definition: ordered steps, bound to one or more models. |
| Review | One run of a workflow on one target revision (today `WorkflowState`). |
| Target | The content revision under review (CMS entry revision or WB page revision). |
| Requester | The user who requested the review. |
| Step reached | The system reacts when a step becomes current: step 1 on request, later steps when the previous step is approved. Not the same as starting [D2]. |
| Pool | Step reached with no owner; a member of the candidate teams clicks Start [D49]. |
| Picked | The requester chose the reviewer at submit [D49]. |
| Routed | Reviewer chosen by a rule or a strategy [D49]. |
| Owner | The actor that holds a step in review. The owner is the assignee; there is no separate assignee field [D11]. |
| Namespace id | Model id with app prefix: `cms.<modelId>`, `wb.page` [D15]. |

## 4. Data model

All models are private CMS models.

### 4.1 Workflow (`wbyWorkflow`)

```ts
interface Workflow {
    id: string;
    name: string;
    models: string[];          // namespace ids, e.g. ["cms.article"]; v1: exactly one [D15]
    steps: WorkflowStep[];     // at least one
}

interface WorkflowStep {
    id: string;
    title: string;
    color: string;
    description?: string;
    type: string;              // step type id: "review" | "automation" | "ai" | custom [D56]
    notifications: { id: string }[];   // transport ids, e.g. "e-mail" [D44]
    config: unknown;           // validated by the step type's schema [D56]
}
```

- v1 validation on create and update (same path): exactly one entry in `models`, the model is publishable, and no other workflow is bound to it. The uniqueness race is accepted [D15, D41].
- Editing is always allowed. Deleting is blocked while any of the workflow's reviews is `inProgress` (error lists the count); finished reviews do not block it [D81].
- Designed for many-to-many in v2 (several models per workflow, several workflows per model) [D15].

Step type configs:

```ts
// "review"
interface ReviewStepConfig {
    teams: string[];           // at least one
    assignment: {
        strategy: "none" | "roundRobin" | "leastLoaded";
        allowManualPick: boolean;
        rules: RoutingRule[];  // ordered, first match wins
    };
}

interface RoutingRule {
    id: string;
    conditions: {              // AND; all optional
        requesterUserId?: string;
        requesterTeamId?: string;
        folder?: { id: string; type: string; includeDescendants: boolean };
        modelId?: string;      // in schema; hidden in v1 editor [D42]
    };
    target: { type: "user" | "team"; id: string };
}

// "automation"
interface AutomationStepConfig {
    definitionId: string;
    settings: unknown;         // validated by the definition's zod schema [D14]
}

// "ai" (registered by ai-powerups) [D56]
interface AiStepConfig {
    instructions: string;      // the reviewer prompt
    modelRole?: string;        // ai-powerups model role [D40]
    tools: string[];           // allowlist from the workflow AI tool registry [D55]
}
```

No locale condition [D12].

### 4.2 Review (`wbyWorkflowState`, renamed as fits)

```ts
interface Review {
    id: string;
    workflowId: string;
    model: string;                       // namespace id; replaces `app` [D41]
    targetId: string;
    targetRevisionId: string;
    title: string;
    isActive: boolean;                   // current review of the revision; false only after cancel [D23]
    state: "inProgress" | "approved" | "rejected" | "cancelled";   // [D29, D75]
    currentStepId: string | null;        // [D19]
    currentStepState: StepState | null;
    currentOwnerId: string | null;      // only for `user` owners; null for ai/automation [D74]
    currentCandidateTeamIds: string[];   // [D47]
    targetContext: TargetContext;        // typed, produced by the target adapter
    workflow: { name: string; models: string[] };   // full workflow snapshot at request time [D81]
    steps: ReviewStep[];                 // snapshot of the workflow steps plus run data
    createdBy: Identity;                 // the requester
    createdOn: string;
    savedOn: string;
}

type StepState = "pending" | "awaiting" | "inReview" | "approved" | "rejected" | "failed";   // [D4]

interface ReviewStep extends WorkflowStep {
    state: StepState;
    owner: Actor | null;
    comment: string | null;              // decision or failure reason
    issues?: AiIssue[];                  // AI steps [D39]
    pickedUserId?: string | null;        // requester's pick at submit [D22]
    candidateTeamIds: string[];          // resolved on step reached [D21]
    assignmentSource?: string | null;    // rule id, "strategy", "picked", "pool", "reassign" [D45]
    taskId?: string | null;              // AI/automation run id [D57]
    runs?: { taskId: string; startedOn: string; finishedOn?: string; outcome?: string; reason?: string }[];   // earlier attempts [D82]
    reachedOn?: string | null;
    startedOn?: string | null;
    finishedOn?: string | null;
}

interface Actor {
    type: "user" | "ai" | "automation";   // forced enum [D30]
    id: string;                           // user id; for ai/automation the requester's id [D58]
    displayName: string;
    identityType?: string;                // old identity kind (admin, API key), if needed [D30]
}
```

- A review carries a full snapshot of its workflow. Editing a workflow never changes running reviews; no steps are inserted into a running review [D81].
- At most one active review per target revision. Rejected, approved and failed reviews stay active; only cancel deactivates [D23].
- Secret config fields are kept encrypted in the snapshot and stripped from read responses [D67].

### 4.3 Assignment log (`wbyWorkflowAssignment`) [D20, D45]

One record per assignment decision: `reviewId`, `workflowId`, `stepId`, `userId` (null for pool fall-through), `assignedOn`, `source` (rule id, strategy, picked, reassign, pool), `reason` (for skips and fall-through, e.g. "pick excluded", "rule target invalid", "no read access"). Deleted with its review; no time-based retention [D63].

### 4.4 Tenant settings (`wbyWorkflowSettings`, singleton per tenant) [D16]

```ts
interface WorkflowSettings {
    exclusions: { userId: string; reason?: string; endsOn?: string }[];   // endsOn: ISO datetime, UTC [D43]
}
```

No artificial cap; save fails naturally above the DDB item limit. Expired entries are filtered in memory.

### 4.5 `system.workflow` on the target [D29]

```ts
system.workflow = { workflowId, reviewState, stepId, stepName, stepState } | null
```

- Written only through the new `UpdateEntrySystemUseCase` (section 9.1) [D52].
- Filterable fields registered in DDB and OpenSearch (SQL reuses the DDB field registry): `workflowId`, `reviewState`, `stepId`, `stepState` [D53]. The legacy `state` system field is untouched.
- Nulled on every new revision by one `EntryRevisionBeforeCreate` handler [D59].
- Publishing does not change it; the published revision keeps `reviewState: approved` (today's CMS clearing on publish is removed) [D85].

## 5. Lifecycle

### 5.1 Transitions

All transitions live in the review aggregate, take an explicit actor, and never read the current identity, so they run inside background tasks [D5]. Every transition persists through one save path that refreshes the current-step fields and syncs `system.workflow` [D19, D52].

| Transition | From | To | Who |
|---|---|---|---|
| request | (no active review) | review `inProgress`, step 1 reached | requester |
| reach step | `pending` | `awaiting`, or `inReview` if an owner resolves | system |
| start | `awaiting` | `inReview`, owner = user | member of `candidateTeamIds`, not the requester |
| take over | human `inReview` | `inReview`, owner = user | member of `candidateTeamIds`, not requester, not current owner [D32] |
| reassign | `awaiting` or human `inReview` | `inReview`, owner = chosen user | `workflows.reassign` [D33] |
| approve | `inReview` | `approved`; next step reached, or review `approved` | owner (user, AI or automation) |
| reject | `inReview` | `rejected`; review `rejected` | owner |
| fail | AI/automation `inReview`, or on reach (`pending`) when the definition is missing, settings are invalid, or the AI capability/licence is unavailable | `failed` (reason in comment) | system [D8, D28, D37, D40] |
| restart | `failed` | re-runs step reached (definition lookup, settings re-validation, new task); clears `comment` and `issues`, keeps owner, appends the previous attempt to `runs` [D82] | requester or `workflows.reassign` [D34] |
| cancel | review `inProgress` | review `cancelled`, `isActive = false`, current-step fields cleared, `system.workflow = null`, running task aborted | requester or `workflows.reassign` [D25, D54, D75] |

Rules:

- The requester never reviews their own content.
- Reject is final for that revision. To continue, create a new revision, fix it, request a new review [D10]. A rejected step cannot be restarted [D8].
- AI and automation steps cannot be taken over [D9].
- Cancel is allowed at any point unless the review is approved or rejected. After cancel, a new request on the same revision starts from step 1 [D25].
- The developer-mode "Remove Review Request" action on the rejected bar stays as an escape hatch [D25].
- Human actions: start and take over require membership of `candidateTeamIds`, not being the requester, and read access to the target. Exclusions do not block them; exclusions only govern automatic assignment and the picker (brief). Reassign validates the chosen user like a pick: candidate, not excluded, not the requester, can read the target [D33, D61].
- Exclusions govern new assignments only. Work already held by a user who becomes excluded stays with them (brief).
- When the last step is approved the review is `approved` and publish is allowed. On a workflow-bound model, publish requires an approved review on that revision, enforced in the API (not only the UI); a failed lookup blocks publish. Models without a workflow publish normally [D79].

### 5.2 Step reached [D2]

On step reached the step type decides:

- Review step: run assignment resolution (section 6). Owner found: step starts as `inReview` with that owner. No owner: step becomes `awaiting` and the pool is notified.
- AI or automation step: step starts as `inReview` with owner `{ type, id: requester.id, displayName: requester.displayName }` [D58], and a background task is triggered.

One code path handles step reached for every type. AI and automation steps never chain inside one task: when a task approves its step, the next step goes through the same step-reached path and, if needed, triggers a new task [D6].

### 5.3 Viewer flags [D5, D54]

Computed on the server for the reading user only: `canStart`, `canTakeOver`, `canApprove`, `canReject`, `canCancel`, `canReassign`, `canRestart`, and per step at submit `canPick`.

## 6. Assignment resolution (review steps)

Runs on step reached, against current team membership, exclusions and load. The same evaluator powers the rule inspector [D45].

Order (first to produce an owner wins):

1. Pick: `pickedUserId` stored at submit, if the step allows picks. Validated now: still a candidate, not excluded, not the requester, can read the target. Invalid pick is skipped and logged [D22].
2. Rules: first rule whose conditions all match. A user target is valid when the user is a member of the step's teams, not excluded, not the requester, and can read the target; an invalid user target skips the rule. A team target is valid when it is one of the step's teams; it narrows `candidateTeamIds` to that team, then the strategy runs inside it. With strategy `none`, or when the strategy finds nobody in the narrowed set, the step goes to that team's pool [D46, brief].
3. Strategy: `roundRobin` takes the latest assignment-log record for `workflowId` + `stepId` and picks the next candidate in stable order (candidates sorted by user id; the first id after the last assignee's id, wrapping around, so it works when the last assignee is no longer a candidate); `leastLoaded` runs one query (`currentOwnerId_in: candidates`, `currentStepState: inReview`, active), groups by owner, ties go to the least recently assigned per the assignment log [D20, D63].
4. Pool: `awaiting`, logged with `userId: null` and the reason [D45].

Assignment never blocks the review. Any error during resolution (identity or team lookup, read-access check, folder ancestors) falls through to the pool with the reason logged (brief).

If the requester is the only eligible member of the candidate teams, the step sits in `awaiting`; reassign is the way out.

Candidates are members of `candidateTeamIds` (default: the step's teams), minus the requester, minus active exclusions, minus users without read access to the target (folder access and model read) [D21, D61].

Condition inputs:

- Requester user and teams: from the requester identity, fetched before evaluation.
- Folder: the target's current folder and its ancestors (ACO `GetAncestors`, includes the folder itself), evaluated at step reached so later steps see the folder as it is then. `includeDescendants` matches if the rule folder is in that chain.
- Model: the review's `model`.

Every decision writes an assignment-log record and sets the step's `assignmentSource`. Start from the pool and take over also write a record (sources `poolStart`, `takeOver`), so rotation, tie-breaks and "who holds this and why" stay explainable.

Submit-time validation of picks is lenient: `requestReview` rejects only malformed input (unknown step id, step without `allowManualPick`). Everything else is validated when the step is reached.

Rule targets are also validated when the workflow is saved: user targets must be members of the step's teams, team targets must be among the step's teams. Invalid targets reject the save. A later team change can still invalidate a saved rule; evaluation then skips it and the editor flags it.

## 7. Step types

### 7.1 Extension point [D56]

`StepType` abstraction in api-workflows and app-workflows: id, config schema, editor fields, and runner (what happens on step reached). Built in: `review`, `automation`. ai-powerups registers `ai`. Dependency direction is always plugin → workflows.

### 7.2 Automation steps [D14, D35, D36, D37, D38]

- Defined in code. v1 ships one built-in, "Send webhook" (POST to a URL with a secret signing key, reads back `{ approved, comment }`); more built-ins (pull image, create records) come later. Developers register their own [D86].
- The automation definition abstraction, outcome types and the step-type extension point are public exports of api-workflows (editor-side counterparts from app-workflows) [D86].
- A definition declares: id, name, scope `models` (`["*"]`, `["cms.*"]`, or specific namespace ids), a zod settings schema, and a handler that returns an outcome (`approved` / `rejected` with comment). It may set `maxIterations` and wait times [D57].
- The background task wrapping is framework-owned; implementers write only logic.
- The step editor offers a definition only if its scope covers every model in the workflow.
- An automation may create, update or delete anything, including the target revision. It runs in a workflow bypass context, so the save block does not apply, and the review stays valid.
- External systems are polled across task iterations; no inbound callback route in v1.
- On step reached the definition is looked up and the stored settings are re-validated; missing definition or invalid settings fail the step with the reason. The editor flags the same.
- Secret settings (`.meta({ secret: true })`) are encrypted at rest, write-only in the API (the editor shows "set" / "replace"), decrypted only inside the task [D67].

### 7.3 AI steps [D13, D39, D40, D55]

- Acts like a human reviewer: approves or rejects with a comment. No human confirmation.
- Input built by the framework: target content serialized with field labels, model name, previous step comments, the step instructions as prompt.
- Runs as an agent loop (`stopWhen`) with tools from the workflow AI tool registry only, filtered by the step's allowlist. Built-in tools: `readTarget`, `updateTargetFields(fieldPath → value)`, scoped to the revision under review and implemented per target adapter. Developers can register more. The global `AiSdkTools` registry is never exposed to AI steps.
- Structured output: `{ approved: boolean, comment: string, issues: [{ fieldPath?, severity, message, suggestion? }] }`.
- Model and connection come from one ai-powerups capability, "Workflow review", via `ResolveAiCapabilityUseCase`; the model role can be set per step. The resolved inline connection is passed to `Ai.generateText` / `streamText`.
- Needs both `advancedPublishingWorkflow` and `aiPowerups`. Without `aiPowerups` the type is hidden in the editor. A disabled capability or lapsed licence fails the step on reach; restartable once fixed.

### 7.4 Task execution [D6, D7, D27, D28, D57, D58]

- One background task per AI or automation step run. The step stores the task id; it doubles as the run id.
- The task always runs as the requester, including restarts, so records it creates or changes are attributed to the requester. `TaskService.trigger` in api-core gains an optional `identity`, stored as task `createdBy`.
- Stale-result guard: on finish the task reloads the review and applies its result only if the review is still active, the step is still current, and the step's task id matches. The same guard applies to failure writes (`onError`, `onMaxIterations`) and to stuck detection, so a late hook from an old task cannot fail a restarted step. The narrow write race is accepted.
- `onError` and `onMaxIterations` set the step `failed` with the reason; the write is idempotent.
- Stuck detection on read: only on single-review reads (`getReview`, `getTargetReview`), not in lists. If the task is done, failed or aborted while the step is still `inReview`, the step is set `failed` ("task ended without result").
- Cancel aborts the running task where possible (`TaskService.abort`); the guard discards late results. Step implementations handle cancellation of their own work [D25].
- No step max duration and no watchdog.

## 8. Permissions [D54]

One `workflows` permission with custom boolean actions, plus full access:

| Action | Grants |
|---|---|
| `editor` | Create, update, delete workflows; tenant workflow settings (exclusions); `workflows.listUsers`. |
| `reassign` | Reassign; restart failed steps; cancel reviews requested by others. |
| full (`*`, `workflows.*`) | Everything. |

- Security UI gets a "custom" access level with these checkboxes.
- One shared permission checker in api-workflows replaces the four copied `ensureManageAccess` functions.
- Requesting a review needs write access to the target [D77]. Reviewing needs team membership plus read access to the target.
- All review operations check permissions on the server (today none do).

Query permissions [D78]:

| Query | Who |
|---|---|
| `listWorkflows`, `getWorkflow` | any authenticated admin user |
| `listStepCandidates` | write access to the workflow's model (can request a review) |
| `getSettings`, `updateSettings` | `editor` |
| `inspectRouting`, `folderExists`, `listUsers` | `editor` |
| `listStepTypes`, `listAutomationDefinitions`, `listAiTools` | `editor` |

Requesters see exclusion data only through `listStepCandidates` (refines D43).

## 9. API changes outside api-workflows

### 9.1 api-headless-cms

- `UpdateEntrySystemUseCase`, modelled on `UpdateRevisionDescription`: load revision, change only `system.*` keys, save via `UpdateEntryRepository`, publish its own narrow events, no meta rebuild. Used for every `system.workflow` write, under `withoutAuthorization` [D52].
- Filterable `system.workflow.*` fields in the DDB and OpenSearch filter registries [D53].

### 9.2 Workflow handlers on CMS events (in the CMS workflows package)

Each is one handler covering CMS entries and WB pages, because WB pages are CMS entries (`wbyWbPage`):

- `EntryRevisionBeforeCreate`: set `system.workflow = null` [D59].
- `EntryBeforeUpdate`: reject updates to a revision with an active review, including an approved one; an approved revision stays locked until published [D80]. `UpdateEntrySystemUseCase` does not fire this event; automation and AI tool writes run in the bypass context [D62].
- `DeleteModelUseCase` decorator: return `Workflows/Model/BoundToWorkflow` listing the bound workflows; the workflow must be deleted or the model removed from it first. Replaces `DeleteWorkflowsOnModelAfterDelete` [D41, D64].

Adapters that handle other CMS events must match their namespace and model explicitly, since WB operations also fire CMS entry events [D59].

### 9.3 Target adapters [D42]

One adapter per namespace (`cms.*` for CMS entries, `wb.page` for WB pages), replacing the duplicated CMS/WB handler pairs:

- load target revision; produce typed `TargetContext` (folder id and type, model id, title, author);
- publish blocking (D79) and move blocking: moves are blocked only while the review is `inProgress` [D84];
- `system.workflow` sync via `UpdateEntrySystemUseCase`;
- implement the AI tools `readTarget` / `updateTargetFields`;
- delete the review when the target is permanently deleted.

### 9.4 api-core

- `TaskService.trigger` optional `identity` [D58].
- `ListUsersInput.where.teams_in`, applied in the DDB and SQL `listUsers` (both filter in memory). Fix the DDB implementation ignoring `id_in` at the same time (bug B3) [D48, D50].

### 9.5 Audit logs [D65]

Not built in this refactor. Until it lands, the assignment log is the only record of reassignments (the brief's reassign audit entry is deferred). Domain events must carry enough data for a later "Workflows" audit app (entities workflow and review; actions workflow create/update/delete, review request, start, take over, approve, reject, cancel, reassign, restart, step failed). Remove the old v5 "APW" entry from `common-audit-logs/src/apps.ts` now.

## 10. GraphQL surface (outline)

Under `workflows { ... }`. Final names are settled in the plan.

Queries:

- `listWorkflows`, `getWorkflow`
- `listStepTypes` (with config JSON schemas), `listAutomationDefinitions` (with scope and settings JSON schemas), `listAiTools`
- `getReview(id)`, `getTargetReview(model, targetRevisionId)`
- `listReviews(list: assignedToMe | pool | teamInReview | myRequests, where, sort, limit, after)` [D47]
- `listUsers` (requires `editor`) [D48]
- `listStepCandidates(workflowId, stepId)` → `{ id, displayName, excluded, excludedReason }` [D48]
- `inspectRouting(workflowId, stepId, requesterId, folderId)` → resulting owner, deciding rule, skipped reasons [D45]
- `folderExists(id)` → boolean [D69]
- `getSettings`

Mutations:

- `storeWorkflow`, `deleteWorkflow`
- `requestReview(model, targetRevisionId, title, picks: [{ stepId, userId }])`
- `startStep`, `takeOverStep`, `reassignStep(reviewId, userId)`, `approveStep(comment?)`, `rejectStep(comment)`, `restartStep`, `cancelReview`
- `updateSettings`

Errors return `code`, `message` and `data`; the admin must keep them (today gateways drop them).

## 11. Review lists [D47]

| List | Filter |
|---|---|
| Assigned to me | `currentOwnerId = me`, `currentStepState = inReview` |
| Pool | `currentStepState = awaiting`, my teams intersect `currentCandidateTeamIds`, I am not the requester |
| Team in review | `currentStepState = inReview`, owner is not me, my teams intersect `currentCandidateTeamIds` |
| My requests | `createdBy = me` |

All lists also require `isActive: true` [D75].

Lists keep the folder-level read filter on the target (today's `WorkflowStateFilter` decorators), so review titles from restricted folders do not leak. Pagination is rewritten: keep fetching pages until `limit` is filled, return the cursor of the last scanned record, and do not promise an exact `totalCount` [D76].

## 12. Notifications [D44, D60]

| Event | Recipients |
|---|---|
| Step reached, pool | Members of the candidate teams |
| Step started by routing, pick or reassign | Owner |
| Reassign | Old and new owner |
| Review approved, review rejected, step failed | Requester |
| Review cancelled | Current owner, if any |

- An assignment never notifies the whole team.
- Pool notifications exclude the requester and excluded users.
- Channels: transports configured on the step (`notifications[]`, e.g. e-mail via `MailNotificationTransport`) plus a websocket message every time.
- Workflows only sends the websocket message (`WebsocketsSendToIdentityUseCase`); the websockets layer handles delivery. No stored inbox.
- On the client every workflow websocket message also fires `WorkflowStateChangedEvent`, so the open bar, lists and editor refetch; the editor reloads the entry when its content changed.

## 13. Admin UI

### 13.1 Architecture

- Keep the DI + MobX presenter pattern. No shared singleton presenters across independent views: each widget, list and target view gets its own instance [D71].
- Gateways keep error `code` and `data`; presenters surface action errors.
- Per-viewer flags come from the server.

### 13.2 Workflow editor

- Bound to models (`models`), one model per workflow in v1.
- Step editor rebuilt on FormModel: a dynamic zone per step type; each step type contributes its editor fields [D56, D66].
- Automation settings forms are generated from JSON schema through a new JSON-schema → FormModel adapter, with UI hints in zod `.meta()` (user, team, secret, textarea). The client rebuilds validators with `z.fromJSONSchema` to flag invalid stored settings [D66].
- Review step assignment section: strategy selector, `allowManualPick` toggle, reorderable rule list (`ObjectAccordionMultipleRenderer`), rule inspector.
- Rule fields: `WorkflowUserPicker` over `workflows.listUsers`; `WorkflowTeamPicker` limited to the step's teams; standard `FolderPicker` filtered by folder permissions. A folder the editor cannot see shows as "restricted folder" and is preserved. The editor flags invalid targets, missing folders (`folderExists`), and targets without read access [D69, D72, D61].
- The assignment section is shown only for review steps.

### 13.3 Request review dialog

- For each step with `allowManualPick`, a choice between automatic (preselected) and picking a person, all captured in one dialog.
- The picker uses `listStepCandidates`; excluded users show disabled with their reason [D22, D72].

### 13.4 Review view (bar, tooltip, dialogs)

- Shows per step: state (all six states), owner with actor type, assignment source, comment, AI issues.
- Actions driven by server flags: start, take over, reassign, approve, reject, restart, cancel.
- On a rejected WB draft, a "create new revision" action that navigates to the new revision (CMS already has one) [D24].

### 13.5 Lists and dashboard

- Content reviews page with the four lists [D47].
- Dashboard widgets: "For me to review" (tabs Assigned to me, Pool) and "My requests"; "View all" opens the matching list [D71].
- CMS and WB content lists: row selectability reads `system.workflow.reviewState`; nothing else changes [D70].

### 13.6 Settings

- Exclusion list page under the Settings menu, requiring `editor`. Date picker for `endsOn` converted to end of that day in the user's timezone, stored as UTC [D16, D43, D73].

### 13.7 Security

- Workflows permission UI with full and custom access (`editor`, `reassign` checkboxes) [D54].

## 14. Deferred

- Many-to-many workflow/model binding and choosing between several workflows on one model (v2) [D15].
- Model condition in the rule editor (v2) [D42].
- Locale condition, until CMS has locales [D12].
- Comment threads via the collaboration feature, once it merges [D31, D68]. v1 uses step comments.
- Audit logs, including the brief's reassign audit entry [D65].
- Inbound callback route for automations [D38].
- Optimistic locking on review writes [D27].

## 15. Related bugs

See `docs/.bruno/workflows/bugs.md`:

- B1: WB page folders can be deleted with pages inside. Fix with a `FolderBeforeDelete` guard in api-website-builder.
- B2: `WorkflowsFeature` registered twice (API and admin). Fix first.
- B3: DDB `listUsers` ignores `id_in`. Fix with `teams_in`.

## 16. Open items for the plan

- Exact GraphQL names and the model id for the renamed review model.
