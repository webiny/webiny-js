# Workflows refactor: design

Status: draft, 2026-10-05, updated 2026-10-13 (D135: the review title comes from the content and may be changed on request; D136: every workflows GraphQL operation is on the main `/graphql` endpoint; D132: api-workflows is an internal engine, apps own checks and GraphQL; D133: no cross-app reviews, shared configuration operations, engine identity touch points; D134: trash and delete refused while a review is in progress, create as published allowed, bound-model guards). Consolidates decisions D1-D136 in `docs/.bruno/workflows/decisions.md`; where decisions refine or supersede each other, this document states the final result. Decision ids are given in brackets for traceability. Discovery background lives in `docs/.bruno/workflows/` (`README.md`, `api.md`, `app.md`, `integrations.md`, `infrastructure.md`); the product brief for routing is `docs/.bruno/workflows/routing.md`; the UI design brief is `docs/.bruno/specs/2026-10-06-workflows-ui-design-brief.md` (UI decisions D88-D131).

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
    type: string;              // step type id: "review" (UI label "People", D98) | "automation" | "ai" | custom [D56]
    notifications: { id: string }[];   // transport ids, e.g. "e-mail" [D44]
    config: unknown;           // validated by the step type's schema [D56]
}
```

- v1 validation on create and update (same path): exactly one entry in `models`, the model is publishable, and no other workflow is bound to it. The uniqueness race is accepted [D15, D41]. "Publishable" is checked by the app package on the engine's workflow before-save events (the CMS workflows package for `cms.*`), so every caller of the base use case gets it.
- At least one step ("Add at least one step.") [D108]. AI steps need non-empty `instructions` and a `model` [D101, D109]. Every rule needs a target; required automation settings must be present (the same checks run in the editor before Save).
- Editing is always allowed. Deleting is blocked while any of the workflow's reviews is `inProgress`. The engine's error carries the exact count and the blocking reviews (content reference, title, step position and name); the app wrapper filters them to the ones the caller can read and keeps 5. The count stays exact. Finished reviews do not block it [D81, D115, D133].
- No tombstone: a save that finds the workflow deleted only learns that it no longer exists [D123].
- Saves are checked optimistically: the base `StoreWorkflow` use case takes the loaded `savedOn`, and each app's store mutation (e.g. `storeWebsiteBuilderPageWorkflow`) passes it through; a mismatch fails with `Workflows/Workflow/Conflict`, a missing workflow with `Workflows/Workflow/NotFound` [D131, D132].
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
    model: string;             // chosen AI model, required [D101]
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
    lastChangedOn: string;              // updated on every review event; list sort key [D119]
}

type StepState = "pending" | "awaiting" | "inReview" | "approved" | "rejected" | "failed";   // [D4]

interface ReviewStep extends WorkflowStep {
    state: StepState;
    owner: Actor | null;
    comment: string | null;              // decision or failure reason
    issues?: AiIssue[];                  // AI steps [D39]
    pickedUserId?: string | null;        // requester's pick at submit [D22]
    candidateTeamIds: string[];          // resolved on step reached [D21]
    assignmentSource?: string | null;    // rule id, "strategy", "picked", "pool", "poolStart", "takeOver", "reassign" [D45]
    assignment?: { source: string; ruleId?: string; reason?: string; by?: Actor };   // "why this owner" [D127]
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
    identityType?: string;                // identity kind of a user actor, e.g. "admin", "api-key" [D30, D133]
}
```

- A review carries a full snapshot of its workflow. Editing a workflow never changes running reviews; no steps are inserted into a running review [D81].
- At most one active review per target revision. Rejected, approved and failed reviews stay active; only cancel deactivates [D23].
- Secret config fields are kept encrypted in the snapshot and stripped from read responses [D67].
- Current-step fields after a finished review: on approve and reject they keep the last or rejecting step and its owner; only cancel clears them [D75, D119].
- `lastChangedOn` changes on request, step reached, start, take over, reassign, approve, reject, fail, restart and content updated by a step; edits outside the review do not touch it [D119].

### 4.3 Assignment log (`wbyWorkflowAssignment`) [D20, D45]

One record per assignment decision: `reviewId`, `workflowId`, `stepId`, `userId` (null for pool fall-through), `assignedOn`, `source` (rule id, strategy, picked, reassign, pool, poolStart, takeOver), `by` (actor for reassign and take over) [D127], `reason` (for skips and fall-through, e.g. "pick excluded", "rule target invalid", "no read access"). Deleted with its review; no time-based retention [D63].

### 4.4 Tenant settings (`wbyWorkflowSettings`, singleton per tenant) [D16]

```ts
interface WorkflowSettings {
    exclusions: { userId: string; reason?: string; endsOn?: string }[];   // endsOn: ISO datetime, UTC [D43]
}
```

No artificial cap; save fails naturally above the DDB item limit. Expired entries are filtered in memory.

- `userId` is unique across the list, enforced on save; an expired entry stays until removed, and excluding someone again means editing their entry [D105].
- Saves write the whole record; the last save wins, with no version check [D106].
- `endsOn` is end of the picked day in the saving admin's browser timezone; active or expired is computed from the instant. Editing without changing the date keeps the stored instant [D110, D124].

### 4.5 `system.workflow` on the target [D29]

```ts
system.workflow = { workflowId, reviewState, stepId, stepName, stepState } | null
```

- Written only through the new `UpdateEntrySystemUseCase` (section 9.1) [D52].
- Filterable fields registered in DDB and OpenSearch (SQL reuses the DDB field registry): `workflowId`, `reviewState`, `stepId`, `stepState` [D53]. The legacy `state` system field is untouched.
- Nulled on every new revision by one `EntryRevisionBeforeCreate` handler [D59].
- Publishing does not change it; the published revision keeps `reviewState: approved` (today's CMS clearing on publish is removed) [D85].
- Content created directly with `status: "published"` (create, create-from, new revision) has no review and `system.workflow = null`; this stays allowed on bound models for data transfer from other systems [D134].

## 5. Lifecycle

### 5.1 Transitions

All transitions live in the review aggregate, take an explicit actor, and never read the current identity, so they run inside background tasks [D5]. Every transition persists through one save path that refreshes the current-step fields and syncs `system.workflow` [D19, D52].

Two layers enforce the rules [D132, D133]. The engine (aggregate and api-workflows use cases) enforces state preconditions and the rules it can decide from the review and the explicit input: owner equals actor, a user actor is not the requester, the actor's team ids (`actorTeamIds`, supplied by the caller) intersect `candidateTeamIds`. The app wrapper (CMS or Website Builder) reads the identity, builds the actor and its team ids, and enforces the `workflows` permission and target access before calling the engine. AI and automation tasks call the engine directly with an `ai` or `automation` actor.

| Transition | From | To | Engine enforces | App wrapper enforces |
|---|---|---|---|---|
| request | (no active review) | review `inProgress`, step 1 reached | no active review; picks well-formed | write access to the target [D77] |
| reach step | `pending` | `awaiting`, or `inReview` if an owner resolves | state; a resolved owner who is the requester goes to the pool | (system, no wrapper) |
| start | `awaiting` | `inReview`, owner = user | user actor, not the requester, member of `candidateTeamIds` | read access to the target |
| take over | human `inReview` | `inReview`, owner = user | as start, plus not the current owner, human step only [D9, D32] | read access to the target |
| reassign | `awaiting` or human `inReview` | `inReview`, owner = chosen user | state, human step; the chosen user is a valid candidate (candidates' read access through the target adapter, D61, D133) | `workflows.reassign`, read access to the target [D33] |
| approve | `inReview` | `approved`; next step reached, or review `approved` | owner (user, AI or automation) equals actor | read access to the target (user actors) |
| reject | `inReview` | `rejected`; review `rejected` | owner equals actor | read access to the target (user actors) |
| fail | AI/automation `inReview`, or on reach (`pending`) when the definition is missing, settings are invalid, or the AI capability/licence is unavailable | `failed` (reason in comment) | system [D8, D28, D37, D40] | (system, no wrapper) |
| restart | `failed` | re-runs step reached (definition lookup, settings re-validation, new task); clears `comment` and `issues`, keeps owner, appends the previous attempt to `runs` [D82] | state | requester or `workflows.reassign`, and read access to the target (decided 2026-10-11) [D34] |
| cancel | review `inProgress` | review `cancelled`, `isActive = false`, current-step fields cleared, `system.workflow = null`, running task aborted | state (not approved, rejected or cancelled) | requester or `workflows.reassign`, and read access to the target (decided 2026-10-11) [D25, D54, D75]; before trashing or deleting the content, anyone with delete access to it, through the cancel-for-delete wrapper (reason recorded) [D134] |

The wrapper authorizes with permission-only predicates from api-workflows (requester or `reassign` for cancel and restart, each also needing read access to the target, `reassign` for reassign) and leaves state errors to the engine, so a finished review fails with the engine's `InvalidState`, not with "not authorized".

Rules:

- The requester never reviews their own content. This is an engine rule for `user` actors only (AI and automation actors carry the requester's id, D58): it applies to start and take over, and to candidates and picks during routing.
- Reject is final for that revision. To continue, create a new revision, fix it, request a new review [D10]. A rejected step cannot be restarted [D8].
- AI and automation steps cannot be taken over [D9].
- Cancel is allowed at any point unless the review is approved or rejected. After cancel, a new request on the same revision starts from step 1 [D25].
- The developer-mode "Remove Review Request" action on the rejected bar stays as an escape hatch [D25].
- Human actions: start and take over require membership of `candidateTeamIds` and not being the requester (engine; the wrapper supplies the actor's team ids), and read access to the target (app wrapper). Exclusions do not block them; exclusions only govern automatic assignment and the picker (brief). Reassign validates the chosen user like a pick: candidate, not excluded, not the requester, can read the target (engine, through the target adapter) [D33, D61, D133].
- API keys act as `user` actors with `identityType: "api-key"` under the same rules. A key belongs to no team, so it cannot start or take over pool steps; it can request, cancel its own review, and act where `reassign` suffices [D133].
- Exclusions govern new assignments only. Work already held by a user who becomes excluded stays with them (brief).
- An approved revision that was published and later unpublished can be published again without a new review [D121].
- When the last step is approved the review is `approved` and publish is allowed. On a workflow-bound model, publish requires an approved review on that revision, enforced in the API (not only the UI); a failed lookup blocks publish. Models without a workflow publish normally [D79]. The rule guards the publish action only: creating content as published (create, create-from, new revision with `status: "published"`) needs no review, for data transfer from other systems [D134].
- Trashing or deleting content with a review in progress is refused on bound models: CMS trash, permanent delete, single revision delete (that revision's review) and `deleteMultiple`, and WB page trash and delete fail with `Workflows/Review/ActiveReviewOnTrash` (data: the action and each in-progress review's id, target, title and current step). The admin warns ("This content has a review in progress. Trashing it cancels the review."); on confirm it calls the app's cancel-for-delete wrapper (`CancelCmsEntryReviewsForDelete`, `CancelWebsiteBuilderPageReviewsForDelete`) and repeats the action. Anyone who may delete the content may confirm, without cancel rights; the review is recorded as cancelled by that user with reason "content trashed" or "content deleted" (the reason travels on the cancelled event). After a permanent delete the reviews and their assignment records go with the content [D134].

### 5.2 Step reached [D2]

On step reached the step type decides:

- Review step: run assignment resolution (section 6). Owner found: step starts as `inReview` with that owner. No owner: step becomes `awaiting` and the pool is notified.
- AI or automation step: step starts as `inReview` with owner `{ type, id: requester.id, displayName: requester.displayName }` [D58], and a background task is triggered.

One code path handles step reached for every type. AI and automation steps never chain inside one task: when a task approves its step, the next step goes through the same step-reached path and, if needed, triggers a new task [D6].

### 5.3 Viewer flags [D5, D54]

Computed on the server for the reading user only: `canStart`, `canTakeOver`, `canApprove`, `canReject`, `canCancel`, `canReassign`, `canRestart`, and per step at submit `canPick`. The app wrapper computes them with the api-workflows helper from the actor, the actor's team ids, the `workflows` permission set and the review, and ANDs its own target access (read access for every flag: start, take over, approve, reject, cancel, reassign and restart; write access for request and `canPick`) [D132, D133].

## 6. Assignment resolution (review steps)

Runs on step reached, against current team membership, exclusions and load. The same evaluator powers the rule inspector [D45].

Order (first to produce an owner wins):

1. Pick: `pickedUserId` stored at submit, if the step allows picks. Validated now: still a candidate, not excluded, not the requester, can read the target. Invalid pick is skipped and logged [D22].
2. Rules: first rule whose conditions all match. A user target is valid when the user is a member of the step's teams, not excluded, not the requester, and can read the target; an invalid user target skips the rule. A team target is valid when it is one of the step's teams; it narrows `candidateTeamIds` to that team, then the strategy runs inside it. With strategy `none`, or when the strategy finds nobody in the narrowed set, the step goes to that team's pool [D46, brief].
3. Strategy: `roundRobin` takes the latest assignment-log record for `workflowId` + `stepId` and picks the next candidate in stable order (candidates sorted by user id; the first id after the last assignee's id, wrapping around, so it works when the last assignee is no longer a candidate); `leastLoaded` runs one query (`currentOwnerId_in: candidates`, `currentStepState: inReview`, active), groups by owner, ties go to the least recently assigned per the assignment log [D20, D63].
4. Pool: `awaiting`, logged with `userId: null` and the reason [D45].

Assignment never blocks the review. Any error during resolution (identity or team lookup, read-access check, folder ancestors) falls through to the pool with the reason logged (brief).

If the requester is the only eligible member of the candidate teams, the step sits in `awaiting`; reassign is the way out.

Candidates are members of `candidateTeamIds` (default: the step's teams), minus the requester, minus active exclusions, minus users without read access to the target (folder access and model read) [D21, D61]. The engine asks the target adapter of the review's namespace whether a candidate can read the target (e.g. `canUserRead(userId, target)`); the app supplies the permission logic. This is one of the engine's two identity touch points (the other is task triggers, 7.4) [D133].

Condition inputs:

- Requester user and teams: from the requester identity, fetched before evaluation.
- Folder: the target's current folder and its ancestors (ACO `GetAncestors`, includes the folder itself), evaluated at step reached so later steps see the folder as it is then. `includeDescendants` matches if the rule folder is in that chain.
- Model: the review's `model`.

A rule whose user target is currently excluded is skipped like any invalid target; the trace and the rule inspector mark it "Skipped" with the exclusion reason [D118].

Every decision writes an assignment-log record and sets the step's `assignmentSource`. Start from the pool and take over also write a record (sources `poolStart`, `takeOver`), so rotation, tie-breaks and "who holds this and why" stay explainable.

Submit-time validation of picks is lenient: the base `RequestReview` use case rejects only malformed input (unknown step id, step without `allowManualPick`). Everything else is validated when the step is reached.

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
- The step's chosen model is used [D101]. The connection comes from ai-powerups via the "Workflow review" capability (`ResolveAiCapabilityUseCase`); the resolved inline connection is passed to `Ai.generateText` / `streamText`. A model that is no longer available fails the step on reach (restartable).
- Needs both `advancedPublishingWorkflow` and `aiPowerups`. Without `aiPowerups` the type is listed disabled with the reason in the editor and cannot be added [D122]. A disabled capability or lapsed licence fails the step on reach; restartable once fixed.

### 7.4 Task execution [D6, D7, D27, D28, D57, D58]

- One background task per AI or automation step run. The step stores the task id; it doubles as the run id.
- The task always runs as the requester, including restarts, so records it creates or changes are attributed to the requester. The engine's step-reached path triggers the task inside `IdentityContext.withIdentity(requester, ...)`, also when the step is reached inside another task or a base use case with no wrapper; `TaskService.trigger` is unchanged [D87]. This is the engine's only identity write; transitions still use the explicit actor (`ai` or `automation`) [D132, D133].
- Stale-result guard: on finish the task reloads the review and applies its result only if the review is still active, the step is still current, and the step's task id matches. The same guard applies to failure writes (`onError`, `onMaxIterations`) and to stuck detection, so a late hook from an old task cannot fail a restarted step. The narrow write race is accepted.
- `onError` and `onMaxIterations` set the step `failed` with the reason; the write is idempotent.
- Stuck detection on read: only on single-review reads (`getReview`, `getTargetReview`), not in lists. If the task is done, failed or aborted while the step is still `inReview`, the step is set `failed` ("task ended without result").
- Cancel aborts the running task where possible (`TaskService.abort`); the guard discards late results. Step implementations handle cancellation of their own work [D25].
- No step max duration and no watchdog.

## 8. Permissions [D54]

One `workflows` permission with custom boolean actions, plus full access. The same permission serves every app's wrappers; there is no per-app split [D133]:

| Action | Grants |
|---|---|
| `editor` | Create, update, delete workflows; tenant workflow settings (exclusions); the routing tools and user lists (`listUsers`, `inspectRouting`, `folderExists`). |
| `reassign` | Reassign; restart failed steps; cancel reviews requested by others. |
| full (`*`, `workflows.*`) | Everything. |

- Security UI gets a "custom" access level with these checkboxes.
- One shared permission checker in api-workflows replaces the four copied `ensureManageAccess` functions. It is a building block: the checks run in each app's wrapper use cases and in the shared configuration operations, never in the api-workflows use cases, which are internal and take an explicit actor [D132, D133].
- Requesting a review needs write access to the target [D77]. Reviewing needs team membership plus read access to the target.
- All review operations check permissions on the server (today none do), in the app wrappers (CMS, Website Builder) that call the internal api-workflows use cases [D132]. Each app checks its own model, folder and content permissions [D133].
- The engine never checks the caller's permissions. It touches identity in two places only: candidates' read access through the app's target adapter (section 6) and `withIdentity(requester)` around task triggers (7.4) [D133].
- Redaction: the engine returns full data; the wrapper strips per-user skip entries and `excludedReason` for viewers without `editor` / `reassign` [D89, D97, D127, D128].

Query permissions [D78], checked by the operation's layer [D132, D133]:

| Capability | Layer | Who |
|---|---|---|
| list and get workflows | per app | any authenticated admin user |
| store and delete workflow | per app (e.g. `StoreWebsiteBuilderPageWorkflow`) | `editor` |
| `listStepCandidates(workflowId, stepId)` | per app | write access to the workflow's model (can request a review) |
| `listStepCandidates(reviewId, stepId)` | per app | `reassign` [D128] |
| `inspectRouting`, `folderExists` | per app | `editor` |
| editor model list | CMS | `editor` [D130] |
| settings (get, update), `listUsers` | shared configuration operations (api-workflows) | `editor` |
| step types, notification transports, automation definitions, AI tools | shared configuration operations (api-workflows) | `editor` [D129, D130] |

The shared configuration operations are the only api-workflows operations exposed outside the backend [D133].

Requesters see exclusion data only through `listStepCandidates` (refines D43).

## 9. API changes outside api-workflows

### 9.1 api-headless-cms

- `UpdateEntrySystemUseCase`, modelled on `UpdateRevisionDescription`: load revision, change only `system.*` keys, save via `UpdateEntryRepository`, publish its own narrow events, no meta rebuild. Used for every `system.workflow` write, under `withoutAuthorization` [D52].
- Filterable `system.workflow.*` fields in the DDB and OpenSearch filter registries [D53].

### 9.2 Workflow handlers on CMS events (in the CMS workflows package, `api-headless-cms-workflows`)

Each is one handler covering CMS entries and WB pages, because WB pages are CMS entries (`wbyWbPage`):

- `EntryRevisionBeforeCreate`: set `system.workflow = null` [D59].
- `EntryBeforeUpdate`: on a model bound to a workflow, reject updates to a revision with an active review, including an approved one; an approved revision stays locked until published [D80]. The binding is checked first, so unbound models never look up reviews (they stay editable when the review lookup fails, and leftover approved or rejected reviews stop locking once their workflow is deleted) [D134]. `UpdateEntrySystemUseCase` does not fire this event; automation and AI tool writes run in the bypass context [D62].
- `DeleteModelUseCase` decorator: return `Workflows/Model/BoundToWorkflow` listing the bound workflows; the workflow must be deleted or the model removed from it first. Replaces `DeleteWorkflowsOnModelAfterDelete` [D41, D64]. The "fully delete model" background task (`api-headless-cms-tasks`, which deletes every entry before it calls `DeleteModelUseCase`) is refused at start with the same error, before anything is deleted [D134]. A caller who cannot delete the model gets the CMS's own error.

Adapters that handle other CMS events must match their namespace and model explicitly, since WB operations also fire CMS entry events [D59].

### 9.3 Target adapters [D42]

One adapter per namespace, replacing the duplicated CMS/WB handler pairs: `cms.*` for CMS entries in `api-headless-cms-workflows`, `wb.page` for WB pages in `api-website-builder-workflows`. Each app package also holds that app's wrapper use cases and GraphQL operations [D132]. Each adapter:

- load target revision; produce typed `TargetContext` (folder id and type, model id, title, author);
- publish blocking (D79) and move blocking: moves are blocked only while the review is `inProgress` [D84]; both only on bound models;
- trash and delete refusal while a review is in progress, and the app's cancel-for-delete wrapper as the confirm path [D134];
- `system.workflow` sync via `UpdateEntrySystemUseCase`;
- implement the AI tools `readTarget` / `updateTargetFields`;
- delete the review (and its assignment records) when the target is permanently deleted; a failed cleanup is logged and the delete stands, leaving the review orphaned;
- answer whether a user can read the target (`canUserRead(userId, target)`), used by the engine for candidates during routing and reassign [D61, D133]. The adapter reads the model (and, for CMS, its group) and the revision as the current identity, then runs its own read check (CMS: group read, model read, entry and folder access; WB: page read and folder access) as the candidate. The candidate must be an admin user of the current tenant (one lookup; no parent-tenant fallback); the check runs with authorization enforced even when the caller runs without authorization (background tasks), and any error answers "cannot read" (fail closed).

### 9.4 api-core

- Permissions are cached per identity object and tenant, so `IdentityContext.withIdentity` evaluates the other identity's permissions and never leaks them to the outer one; a failed load is not cached. `withAuthorization(cb)` re-enables authorization inside `withoutAuthorization`. Both are needed for candidates' read access (9.3) and for task triggers under `withIdentity(requester)` (7.4) [D134].
- `ListUsersInput.where.teams_in`, applied in the DDB and SQL `listUsers` (both filter in memory). Fix the DDB implementation ignoring `id_in` at the same time (bug B3) [D48, D50].

### 9.5 Audit logs [D65]

Not built in this refactor. Until it lands, the assignment log is the only record of reassignments (the brief's reassign audit entry is deferred). Domain events must carry enough data for a later "Workflows" audit app (entities workflow and review; actions workflow create/update/delete, review request, start, take over, approve, reject, cancel, reassign, restart, step failed). Remove the old v5 "APW" entry from `common-audit-logs/src/apps.ts` now.

## 10. GraphQL surface (outline)

Two kinds of operations [D132, D133]:

- **Per app** (CMS, Website Builder), e.g. `storeWebsiteBuilderPageWorkflow`, each backed by an app wrapper use case that reads the identity, builds the actor, checks permissions and target access, and calls the internal api-workflows use case. Nothing merges CMS and WB reviews.
- **Shared configuration operations** in api-workflows, guarded only by `editor`: settings, `listUsers`, step types, notification transports, automation definitions, AI tools. These are the only api-workflows operations exposed outside the backend.

The lists below name capabilities; each per-app capability exists once per app. Placement and final names [D136]: everything is on the main `/graphql` endpoint; there is no workflows operation on `/cms/*`, and the entry's `system.workflow` field stays there (R102).

- Root `workflows` (`WorkflowsQuery` / `WorkflowsMutation`): the shared configuration operations (`getSettings`, `updateSettings`, `listStepTypes`; later users, transports, automation definitions, AI tools).
- Root `cms` (the existing `CmsQuery` / `CmsMutation`): `listCmsEntryWorkflows`, `getCmsEntryWorkflow(id)`, `getCmsEntryReview(id)`, `getCmsEntryTargetReview(modelId, revisionId)`, `listCmsEntryReviews(list, where, sort, limit, after)`, `listCmsEntryWorkflowModels(search, limit, after)`; `storeCmsEntryWorkflow(data, savedOn)`, `deleteCmsEntryWorkflow(id)`, `requestCmsEntryReview(modelId, revisionId, title, picks)`, `startCmsEntryReviewStep`, `takeOverCmsEntryReviewStep`, `approveCmsEntryReviewStep`, `rejectCmsEntryReviewStep` (each `reviewId, stepId`, approve and reject also `comment`), `cancelCmsEntryReview(reviewId)`, `cancelCmsEntryReviewsForDelete(modelId, entryId, revisionId, action)`.
- Root `websiteBuilder` (the existing `WbQuery` / `WbMutation`): the same set with `WebsiteBuilderPage` in place of `CmsEntry` and no `modelId` (`getWebsiteBuilderPageTargetReview(revisionId)`, `requestWebsiteBuilderPageReview(revisionId, title, picks)`, `cancelWebsiteBuilderPageReviewsForDelete(pageId, action)`); there is no WB model list.
- Operations that take a review id take no model; a request takes the revision id and the server derives the content id from it. Every operation returns `{ data, error }` (lists `{ data, meta: { cursor, hasMoreItems }, error }`).

Per-app queries:

- list and get workflows (the app's namespaces only)
- `getReview(id)`, `getTargetReview(model, targetRevisionId)`; each step returns its assignment-log entries; the wrapper strips per-user skip entries for viewers without `editor` / `reassign` [D89, D127]
- `listReviews(list: assignedToMe | pool | teamInReview | myRequests | failedSteps, where, sort: lastChangedOn_ASC | lastChangedOn_DESC, limit, after)` with `where: { modelId?, titleContains?, reviewState?, stepState? }` (review and step state only for `myRequests`; `modelId` only for CMS, without the `cms.` prefix) [D47, D94, D112, D119, D133]
- `listStepCandidates(workflowId, stepId)` for Request review, `listStepCandidates(reviewId, stepId)` for Reassign (from the review snapshot) → `{ id, displayName, excluded, excludedReason }`; `excludedReason` only for `editor` / `reassign`; no workload counts [D48, D97, D104, D128]
- `inspectRouting(stepConfig, model, requesterId, folderId)` → resulting owner, per-rule trace (including skipped rules and why), strategy choice; evaluates unsaved config; returns no per-person load numbers [D45, D95, D104, D118]
- `folderExists(id, type)` → boolean [D69, D133]
- CMS only: the workflow editor's model list: `search`, `limit`, cursor; 20 per page, sorted by name; each row carries the bound workflow (id, name) if any; requires `editor` [D116, D130]. The WB editor has the single item Pages and needs no list.

Per-app mutations (base use case in brackets):

- store workflow (`StoreWorkflow`, with the loaded `savedOn`, optimistic check, D131), delete workflow (`DeleteWorkflow`)
- request review (`RequestReview`: model, target revision id, optional title (the content's title when missing, fixed afterwards) [D135], picks `[{ stepId, userId }]`)
- start (`StartReviewStep`), take over (`TakeOverReviewStep`, `notifyPreviousOwner = true`) [D111], reassign (`reviewId`, `userId`), approve (`comment?`), reject (`comment`), restart, cancel review
- Validation: review title at least 5 characters; reject comment at least 10 characters [D100].

Shared configuration operations (api-workflows, `editor`):

- settings: get, update
- `listUsers` [D48]; also accepts a list of ids and reports which do not exist, so the editor can show saved targets as "Deleted user" [D117]
- step types (with config JSON schemas, `available` and `unavailableReason` per type [D130]), notification transports (`id`, `title`, `description`) [D129], automation definitions (with scope and settings JSON schemas), AI tools

Errors return `code`, `message` and `data`; the admin must keep them (today gateways drop them).

Review reads (steps preview, review details) include each step's `description` [D120]. Reviewer candidates carry no workload counts [D104].

## 11. Review lists [D47]

Each app has its own lists over its own reviews (CMS: `cms.*`; Website Builder: `wb.page`); nothing merges them [D133].

| List | Filter |
|---|---|
| Assigned to me | `currentOwnerId = viewerUserId`, `currentStepState = inReview` |
| Pool | `currentStepState = awaiting`, `viewerTeamIds` intersect `currentCandidateTeamIds`, the viewer is not the requester |
| Team in review | `currentStepState = inReview`, owner is not the viewer, `viewerTeamIds` intersect `currentCandidateTeamIds` |
| My requests | `createdBy = viewerUserId` |
| Failed steps (only with `reassign`) | `currentStepState = failed`, current step type AI or automation [D112] |

The engine's list use case takes `viewerUserId` and `viewerTeamIds` explicitly; the app wrapper supplies them from the identity and offers Failed steps only with `reassign` [D132].

All lists also require `isActive: true` [D75].

Each row carries the viewer flags `canStart`, `canTakeOver`, `canReassign`, `canRestart` and `canCancel`, computed by the app wrapper (5.3), so row actions follow the server.

Sort only by `lastChangedOn`: oldest first by default in Assigned to me, Pool, Team in review and Failed steps; newest first in My requests; the client can switch the direction [D119].

Lists keep the folder-level read filter on the target, so review titles from restricted folders do not leak. The app wrapper passes a target-read predicate (its own folder and model permissions for the viewer) to the engine's list use case, which applies it and runs the rewritten pagination: keep fetching pages until `limit` is filled, return the cursor of the last scanned record, and do not promise an exact `totalCount` [D76, D133].

## 12. Notifications [D44, D60]

| Event | Recipients |
|---|---|
| Step reached, pool | Members of the candidate teams |
| Step started by routing, pick or reassign | Owner |
| Reassign | Old and new owner |
| Take over | Previous owner, unless the taker opts out [D111] |
| Review approved, review rejected, step failed | Requester |
| Review cancelled | Current owner, if any |

- An assignment never notifies the whole team.
- Pool notifications exclude the requester and excluded users.
- Channels: transports configured on the step (`notifications[]`, e.g. e-mail via `MailNotificationTransport`) plus a websocket message every time. Each event uses the channels of the step where it happened: approved the last step, rejected the rejecting step, cancelled the current step, failed the failed step [D103].
- AI and automation steps are named by their step title as decider or owner, never by the automation's name [D107, D126].
- Workflows only sends the websocket message (`WebsocketsSendToIdentityUseCase`); the websockets layer handles delivery. No stored inbox.
- A notification links to the content or to the review in its own app (CMS or Website Builder); the message carries the review's namespace so the client opens that app's review [D133].
- On the client an in-app notification is a toast through the admin `Notifications` feature; every workflow toast, including confirmations of the user's own actions, uses that one stack [D102, D125].
- On the client every workflow websocket message also fires `WorkflowStateChangedEvent`, so the open bar, lists and editor refetch; the editor reloads the entry when its content changed.

## 13. Admin UI

Screens, states and copy are specified in the UI design brief (`docs/.bruno/specs/2026-10-06-workflows-ui-design-brief.md`, decisions D88-D126) and the Claude Design prototypes (local copy, `/design-pull`). This section keeps the architectural points.

### 13.1 Architecture

- Keep the DI + MobX presenter pattern. No shared singleton presenters across independent views: each widget, list and target view gets its own instance [D71].
- Gateways keep error `code` and `data`; presenters surface action errors.
- Gateways are per app: the CMS and Website Builder workflow admin packages implement them over their app's operations. Shared presenters in app-workflows depend on a gateway abstraction and are shared only where the behaviour is truly app-neutral (review bar, dialogs, request dialog, editor shell); the six shared configuration operations (settings, users, step types, notification transports, automation definitions, AI tools) have one gateway [D132, D133].
- Per-viewer flags come from the server.

### 13.2 Workflow editor

- Bound to models (`models`), one model per workflow in v1.
- Step editor rebuilt on FormModel: a dynamic zone per step type; each step type contributes its editor fields [D56, D66].
- Automation settings forms are generated from JSON schema through a new JSON-schema → FormModel adapter, with UI hints in zod `.meta()` (user, team, secret, textarea). The client rebuilds validators with `z.fromJSONSchema` to flag invalid stored settings [D66].
- Review step assignment section: strategy selector, `allowManualPick` toggle, reorderable rule list (`ObjectAccordionMultipleRenderer`), rule inspector.
- Rule fields: `WorkflowUserPicker` over `listUsers` (shared configuration operation); `WorkflowTeamPicker` limited to the step's teams; standard `FolderPicker` filtered by folder permissions. A folder the editor cannot see shows as "restricted folder" and is preserved. The editor flags invalid targets, missing folders (the app's `folderExists`), and targets without read access [D69, D72, D61].
- The assignment section is shown only for review steps.

### 13.3 Request review dialog

- For each step with `allowManualPick`, a choice between automatic (preselected) and picking a person, all captured in one dialog.
- The picker uses `listStepCandidates`; excluded users show as "Unavailable", with the reason only for `editor` / `reassign` [D22, D72, D97].

### 13.4 Review view (bar, tooltip, dialogs)

- Shows per step: state (all six states), owner with actor type, assignment source, comment, AI issues.
- Actions driven by server flags: start, take over, reassign, approve, reject, restart, cancel.
- On a rejected WB draft, a "create new revision" action that navigates to the new revision (CMS already has one) [D24].

### 13.5 Lists and dashboard

- Content Reviews per app (CMS, Website Builder), each with the five lists over that app's reviews (Failed steps only with `reassign`); the CMS view has the "Content type" column and filter, the WB view (Pages only) does not need them [D47, D112, D113, D133].
- Dashboard widgets per app: "For me to review" (tabs Assigned to me, Pool) and "My requests"; "View all" opens the matching list of that app [D71, D133].
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
