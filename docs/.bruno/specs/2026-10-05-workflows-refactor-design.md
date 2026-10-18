# Workflows refactor: design

Status: draft, 2026-10-05, updated 2026-10-18 (phase 9a: D165 validation errors point at the step and field; D166 workflows lists teams for the editor; D167 the AI step editor ships with the editor; D168 step forms per type; D169 colour presets are theme tokens), earlier updated 2026-10-17 (phase 8b: D160 silent review change message; D161 run tasks kept and read by workflows; D162 client gates mirror the workflows permissions; D163 content reload after an automated step; D164 pre-check before the CMS bulk trash), earlier updated 2026-10-16 (phase 8a: D157 trash and delete warning driven by the server refusal; D158 review steps carry team names; D159 shared admin core in app-workflows), earlier updated 2026-10-13 (D137: least loaded counts load per app; D135: the review title comes from the content and may be changed on request; D136: every workflows GraphQL operation is on the main `/graphql` endpoint; D132: api-workflows is an internal engine, apps own checks and GraphQL; D133: no cross-app reviews, shared configuration operations, engine identity touch points; D134: trash and delete refused while a review is in progress, create as published allowed, bound-model guards). Consolidates decisions D1-D169 in `docs/.bruno/workflows/decisions.md`; where decisions refine or supersede each other, this document states the final result. Decision ids are given in brackets for traceability. Discovery background lives in `docs/.bruno/workflows/` (`README.md`, `api.md`, `app.md`, `integrations.md`, `infrastructure.md`); the product brief for routing is `docs/.bruno/workflows/routing.md`; the UI design brief is `docs/.bruno/specs/2026-10-06-workflows-ui-design-brief.md` (UI decisions D88-D131).

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
- At least one step ("Add at least one step.") [D108]. AI steps need non-empty `instructions` (no minimum length, no default prompt) and a `model` that has a configured connection; every `tools` entry must be a registered workflow AI tool; a step whose config no longer parses fails with `Step "<title>" has an invalid AI configuration.` and a model list that cannot be loaded fails with `Step "<title>" could not be checked: the configured AI models could not be loaded.`; the model is checked only for new or changed steps, so an unrelated edit of a workflow whose connection was removed still saves [D101, D109, D139]. Every rule needs a target; required automation settings must be present (the same checks run in the editor before Save).
- Editing is always allowed. Deleting is blocked while any of the workflow's reviews is `inProgress`. The engine's error carries the exact count and the blocking reviews (content reference, title, step position and name); the app wrapper filters them to the ones the caller can read and keeps 5. The count stays exact. Finished reviews do not block it [D81, D115, D133].
- No tombstone: a save that finds the workflow deleted only learns that it no longer exists [D123].
- Saves are checked optimistically: the base `StoreWorkflow` use case takes the loaded `savedOn`, and each app's store mutation (e.g. `storeWebsiteBuilderPageWorkflow`) passes it through; a mismatch fails with `Workflows/Workflow/Conflict`, a missing workflow with `Workflows/Workflow/NotFound` [D131, D132].
- Designed for many-to-many in v2 (several models per workflow, several workflows per model) [D15].
- A validation failure carries `data: { stepId, field, workflowId }` (null where it does not apply): `stepId` and `field` name the step and the field (`name`, `models`, `steps` for the workflow; `id`, `title`, `type`, `config.teams`, `config.assignment.rules`, `config.automationId`, `config.settings.<path>`, `config.instructions`, `config.model`, `config.tools` and the review config paths for a step), and the duplicate-model error also carries the `workflowId` of the workflow that holds the model. The server does not validate the colour or the notification ids, so it names neither; the editor checks the colour on the client. Messages and codes are unchanged [D165].

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
    automationId: string;
    settings: unknown;         // validated by the definition's zod schema [D14]
}

// "ai" (registered by ai-powerups) [D56]
interface AiStepConfig {
    instructions: string;      // the reviewer prompt
    model: string;             // chosen AI model "<providerId>/<modelId>", required, must have a configured connection [D101]
    tools: string[];           // allowlist from the workflow AI tool registry, default [] [D55]
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
    issues: AiIssue[];                   // AI steps' structured findings; [] for every other step; reset by restart [D39, D145]
    pickedUserId?: string | null;        // requester's pick at submit [D22]
    candidateTeamIds: string[];          // resolved on step reached [D21]
    candidateTeams?: { id: string; name: string }[];   // read only: derived from candidateTeamIds when the review is read, never stored; unknown teams omitted [D158]
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

interface AiIssue {
    fieldPath: string | null;            // clamped to 500 characters
    severity: "error" | "warning" | "info";
    message: string;                     // clamped to 2000 characters
    suggestion: string | null;           // clamped to 2000 characters
}
```

- A review carries a full snapshot of its workflow. Editing a workflow never changes running reviews; no steps are inserted into a running review [D81].
- At most one active review per target revision. Rejected, approved and failed reviews stay active; only cancel deactivates [D23].
- Current-step fields after a finished review: on approve and reject they keep the last or rejecting step and its owner; only cancel clears them [D75, D119].
- `lastChangedOn` changes on request, step reached, start, take over, reassign, approve, reject, fail, restart and content updated by a step; edits outside the review do not touch it [D119].
- A step's `issues` hold what the AI reported with its decision (at most 50); steps written before they existed read as empty; facts and events carry no issues [D145].

### 4.3 Assignment log (`wbyWorkflowAssignment`) [D20, D45]

One record per assignment decision: `reviewId`, `workflowId`, `stepId`, `userId` (null for pool fall-through), `assignedOn`, `source` (`picked`, `rule`, `roundRobin`, `leastLoaded`, `pool`, `poolStart`, `takeOver`, `reassign`), `ruleId` (the rule that decided, also when a team-target rule narrowed the candidates for the strategy or the pool), `by` (actor for reassign and take over) [D127], `reason` (for skips and fall-through, fixed texts: "Not a member of the step's teams.", "Excluded from reviews.", "The requester cannot review.", "Cannot read this content.", "Not one of the step's teams." (a rule whose team target is not one of the step's teams), "No eligible candidate; the step went to the pool.", "Routing failed; the step went to the pool.", "The resolved owner is the requester, who cannot review their own content."; an exclusion's own reason never goes into a record [D89, D97]; a step routed to its pool by configuration has no reason), `kind` (`outcome` for the decision, `skip` for each person passed over). Deleted with its review; no time-based retention [D63].

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
| take over | human `inReview` | `inReview`, owner = user | as start, plus not the current owner, human step only [D9, D32]; the fact carries `notifyPreviousOwner` [D111] | read access to the target |
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
- The background task of an AI or automation step is kept after it finishes and is deleted with its review (the review delete cleans up the task of every attempt); cancel only aborts a running task. Workflows reads a kept task for operators (7.4, 10) [D161].
- The developer-mode "Remove Review Request" action on the rejected bar stays as an escape hatch [D25].
- Human actions: start and take over require membership of `candidateTeamIds` and not being the requester (engine; the wrapper supplies the actor's team ids), and read access to the target (app wrapper). Exclusions do not block them; exclusions only govern automatic assignment and the picker (brief). Reassign validates the chosen user like a pick: candidate, not excluded, not the requester, can read the target (engine, through the target adapter) [D33, D61, D133].
- API keys act as `user` actors with `identityType: "api-key"` under the same rules. A key belongs to no team, so it cannot start or take over pool steps; it can request, cancel its own review, and act where `reassign` suffices [D133].
- Exclusions govern new assignments only. Work already held by a user who becomes excluded stays with them (brief).
- An approved revision that was published and later unpublished can be published again without a new review [D121].
- When the last step is approved the review is `approved` and publish is allowed. On a workflow-bound model, publish requires an approved review on that revision, enforced in the API (not only the UI); a failed lookup blocks publish. Models without a workflow publish normally [D79]. The rule guards the publish action only: creating content as published (create, create-from, new revision with `status: "published"`) needs no review, for data transfer from other systems [D134].
- Trashing or deleting content with a review in progress is refused on bound models: CMS trash, permanent delete, single revision delete (that revision's review) and `deleteMultiple`, and WB page trash and delete fail with `Workflows/Review/ActiveReviewOnTrash` (data: the action and each in-progress review's id, target, title and current step). The admin shows the normal trash or delete confirmation first; when the server refuses, it warns and lists the blocking reviews ("This content has a review in progress. Trashing it cancels the review."); on confirm it calls the app's cancel-for-delete wrapper (`CancelCmsEntryReviewsForDelete`, `CancelWebsiteBuilderPageReviewsForDelete`, scoped to the revision when one revision is deleted) and repeats the action once, with no second confirm [D157]. Anyone who may delete the content may confirm, without cancel rights; the review is recorded as cancelled by that user with reason "content trashed" or "content deleted" (the reason travels on the cancelled event). After a permanent delete the reviews and their assignment records go with the content [D134]. The CMS bulk trash of all loaded rows runs as a background task, so before it starts the admin asks which of those entries have a review in progress and shows the same warning (13.8) [D164].

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
3. Strategy: `roundRobin` takes the latest assignment-log record for `workflowId` + `stepId` and picks the next candidate in stable order (candidates sorted by user id; the first id after the last assignee's id, wrapping around, so it works when the last assignee is no longer a candidate); `leastLoaded` counts each candidate's active in-review reviews (`currentOwnerId_in: candidates`, `currentStepState: inReview`) in the review's app only (CMS: every `cms.*` namespace; Website Builder: `wb.page`); fewest wins, ties go to the least recently assigned per the same app's assignment log (never assigned counts as least recent), then user id order [D20, D63, D137].
4. Pool: `awaiting`, logged with `userId: null` and, when something failed or nobody was eligible, the reason; a step routed to its pool by configuration (no pick, no matching rule, strategy `none`) has none [D45].

Assignment never blocks the review. Any error during resolution (identity or team lookup, read-access check, folder ancestors) falls through to the pool with the reason logged (brief).

If the requester is the only eligible member of the candidate teams, the step sits in `awaiting`; reassign is the way out.

Candidates are members of `candidateTeamIds` (default: the step's teams), minus the requester, minus active exclusions, minus users without read access to the target (folder access and model read) [D21, D61]. Strategy candidates that are excluded or the requester are dropped without a record; each candidate refused for read access gets a skip record; nobody readable sends the step to the pool with "No eligible candidate; the step went to the pool." [A50]. The engine asks the target adapter of the review's namespace whether a candidate can read the target (`canUserRead(userId, target)`); without a target revision (the rule inspector) it asks for folder-level access instead (`canUserReadInFolder(userId, model, folderId)`: model read and folder content read, no entry). The app supplies the permission logic. Read checks run lazily, in the order a source needs them. This is one of the engine's two identity touch points (the other is task triggers, 7.4) [D133].

Condition inputs:

- Requester user and teams: from the requester identity, fetched before evaluation.
- Folder: the target's current folder and its ancestors (ACO `GetAncestors`, includes the folder itself), evaluated at step reached so later steps see the folder as it is then. The folder is the review's `targetContext.folder`: moves are refused while a review is in progress, so it is the target's current folder; its ancestors are read at step reached through the per-app folder port, so a moved parent is seen as it is then [R130]. `includeDescendants` matches if the rule folder is in that chain.
- Model: the review's `model`.

A rule whose user target is currently excluded is skipped like any invalid target; the trace and the rule inspector (editor only) mark it "Skipped" with the exclusion reason ("Excluded from reviews." when it has none) and list the person among the skipped people, with the pick and the strategy candidates refused read access. The assignment-log record keeps the fixed "Excluded from reviews." [D118, D89, D97, R129].

Every decision writes an assignment-log record and sets the step's `assignmentSource`. Start from the pool, take over and reassign also write a record (sources `poolStart`, `takeOver`, `reassign`), so rotation, tie-breaks and "who holds this and why" stay explainable. Records are written after the review is saved; a failed write is logged and never fails the request. The folder chain comes from a per-app port (`ReviewTargetFolderChain`, ACO `GetAncestors` without folder-level permissions).

Submit-time validation of picks is lenient: the base `RequestReview` use case rejects only malformed input (unknown step id, step without `allowManualPick`). Everything else is validated when the step is reached.

Rule targets are also validated when the workflow is saved: user targets must be members of the step's teams, team targets must be among the step's teams. Invalid targets reject the save. A later team change can still invalidate a saved rule; evaluation then skips it and the editor flags it.

## 7. Step types

### 7.1 Extension point [D56]

`StepType` abstraction in api-workflows and app-workflows: id, config schema, editor fields, and runner (what happens on step reached). Built in: `review`, `automation`. ai-powerups registers `ai` (together with its `StepRunner`) only when both `aiPowerups` and `advancedPublishingWorkflow` are on; with only workflows on, `listStepTypes` keeps the disabled `ai` row [D122]. A step type may also define an async `checkConfig` for checks that need I/O (the AI step checks that its model has a configured connection); the save path runs it only for steps that are new or whose config changed [D139]. `StepRunner` is the matching extension point for the background task: one runner per step type, registered next to the type [D140]. Dependency direction is always plugin → workflows.

### 7.2 Automation steps [D14, D35, D36, D37, D38]

- Defined in code by developers; no automation ships with Webiny, and a "call a webhook" automation, a "create records" automation and so on are examples developers write themselves [D86].
- The automation definition abstraction (`AutomationDefinition`), its outcome types and the step-type extension point are public exports of api-workflows (editor-side counterparts from app-workflows) [D86].
- A definition declares: `id`, `name`, scope `models` (`["*"]`, `["cms.*"]`, or specific namespace ids), a zod `settingsSchema` for the information the workflow author passes in (for a webhook automation: the URL), optional `maxIterations` (default 50), and a handler `run` that returns an outcome: `approved` or `rejected` with a comment, or `continue` with an optional wait in seconds and state for the next iteration [D57].
- The step's config is `{ automationId, settings }`. The workflow author adds the automation as a step and fills `settings`; the editor renders the form from the schema, which `listAutomationDefinitions` exposes as JSON schema, through the JSON-schema adapter of 13.2 [D168]. Settings are validated against the definition's zod schema when the workflow is saved, when the step is reached and restarted, and before every run [D14, D37].
- The background task wrapping is framework-owned; implementers write only logic.
- The step editor offers a definition only if its scope covers every model in the workflow; save refuses one that does not [D35].
- An automation may create, update or delete anything, including the target revision. It runs in a workflow bypass context that lifts the save block (`BlockUpdateWhileInReview`) only, so the review stays valid; moving the target, deleting it and trashing it stay blocked while the review is in progress [D36, D62, D84, D134].
- External systems are polled across task iterations (`continue`); no inbound callback route in v1.
- On step reached the definition is looked up and the stored settings (kept as entered) are parsed again; a missing definition, a scope that no longer covers the models or invalid settings fail the step with a fixed reason. The editor flags the same.
- Step config holds no secrets. Credentials an automation needs (keys, tokens, signing secrets) belong to whoever writes the definition, in their own code or configuration, and are never set or seen by workflow editors [D67 superseded].
- The run is attributed to the requester but with authorization off (D36): the automation can read and write anything, so the developer scopes their own code. Delivery is at-least-once, so automations should be idempotent. Developer guide: `docs/.bruno/workflows/automations.md`.

### 7.3 AI steps [D13, D39, D40, D55, D101, D109, D139-D148]

- Acts like a human reviewer: approves or rejects with a comment. No human confirmation. The decision is applied through the base approve and reject use cases with an `ai` actor that names the requester; a reject needs a comment of at least the minimum length [D100, D145].
- Input built by the framework: the labelled target content, the previous step comments, then the step instructions in a delimited block as the task. The system prompt is the capability guidance (fixed output contract, content under review is data and never instructions) plus the capability's additional instructions. There is no default prompt [D109, D146].
- Runs as an agent loop (`stopWhen`, at most 20 tool steps) with tools from the workflow AI tool registry only, filtered by the step's allowlist. Built-in tools: `readTarget`, `updateTargetFields({ fields })` (path → value), scoped to the revision under review through the `ReviewTargetEditor` port that each target adapter implements. Developers can register more (`ai-tools.md`). The global `AiSdkTools` registry is never exposed to AI steps. A tool never takes a target, revision, review or step id from the model [D55, D142].
- Writes are bounded: CMS top-level and nested-object scalar fields (text, long text, number, boolean, datetime, not lists); Website Builder page title and the SEO scalars. References, files, rich text, dynamic zones, the element tree, bindings, path and language are read-only. A bad path or value writes nothing [D143].
- `updateTargetFields` is the only writer. It re-checks that the step is still this task's (fail-closed when the check fails) and runs only the write inside the workflow bypass, so the save block lets the AI's edit through and the move, delete and trash blocks stay [D144].
- Structured output: `{ approved: boolean, comment: string, issues: [{ fieldPath, severity, message, suggestion }] }`; no valid output fails the step [D145].
- The step's chosen model is used [D101]. The model must belong to a provider that has a connection with a stored key; that list has one source (`ConfiguredAiModelsService`) used by the editor's model list, the save check and the resolver [D141]. The connection comes from ai-powerups via the "Workflow review" capability (`ResolveAiCapabilityUseCase` with the model); the resolved inline connection is passed to `Ai.generateText`. A model or connection removed later fails the step on reach or run (restartable).
- Needs both `advancedPublishingWorkflow` and `aiPowerups`. Without `aiPowerups` the type is listed disabled with the reason in the editor and cannot be added [D122]. A disabled capability or lapsed licence fails the step; restartable once fixed [D40, D145].
- Limits: the serialised target, previous comments and instructions may not exceed 200000 characters; over it the step fails before any model call and nothing is truncated [D147].
- Every failure ends in a fixed reason on the step; raw provider and storage messages are logged only [D145]. Developer guide: `docs/.bruno/workflows/ai-tools.md`.

### 7.4 Task execution [D6, D7, D27, D28, D57, D58]

- One background task per AI or automation step run. The step stores the task id; it doubles as the run id.
- The task always runs as the requester, including restarts, so records it creates or changes are attributed to the requester. The engine's step-reached path triggers the task inside `IdentityContext.withIdentity(requester, ...)`, also when the step is reached inside another task or a base use case with no wrapper; `TaskService.trigger` is unchanged [D87]. This is the engine's only identity write; transitions still use the explicit actor (`ai` or `automation`) [D132, D133].
- Stale-result guard: on finish the task reloads the review and applies its result only if the review is still active, the step is still current, and the step's task id matches. The same guard applies to failure writes (`onError`, `onMaxIterations`) and to stuck detection, so a late hook from an old task cannot fail a restarted step. The narrow write race is accepted.
- `onError` and `onMaxIterations` set the step `failed` with the reason; the write is idempotent.
- Stuck detection on read: only on single-review reads (`getReview`, `getTargetReview`), not in lists. If the task is done, failed or aborted while the step is still `inReview`, the step is set `failed` ("task ended without result"). A task that is gone (a task is kept until its review is deleted, so a missing one is unusual, D161) or cannot be read counts as stuck after a five-minute grace from the step start. Known limitation (user decision 2026-10-15): a task left running after its runtime was killed hard is not failed; a person restarts or cancels the step.
- Cancel aborts the running task where possible (`TaskService.abort`); the guard discards late results. Step implementations handle cancellation of their own work [D25].
- One private background task definition, `workflowsStepRun`, serves every automation and AI step: input is only `{ reviewId, stepId }`, everything else comes from the review snapshot. The engine triggers the task before the review is saved and stores its id on the step in the same save; the handler waits briefly (up to three short waits) for the id to appear, and a failed save aborts the task. GraphQL `triggerTask` refuses private definitions like unknown ones (R147), and the handler never trusts its input. The handler dispatches by step type to a `StepRunner` (automation and AI each have one); a step whose type has no runner fails with `The step type "<type>" is not available.` and fixed neutral texts [D140]. The task is kept after it finishes and is deleted with its review, so an operator can read its status; every outcome is also on the step [D161, R256]. Private tasks: R180.
- The handler enforces the automation definition's own `maxIterations` from the task's iteration count (waits for the task id are not counted); the task definition has one high ceiling. Fixed failure reasons cover a missing definition, invalid settings, a scope mismatch, a failed trigger, a thrown error, an unknown outcome (`The automation failed: It returned an unknown outcome.`), a rejection without a comment, too many iterations, a task that ended without a result and an abort. Stuck detection gives a failed or aborted task a five-minute grace before it fails the step. The fixed reasons of an AI step are in `ai-tools.md` and decision D145.
- The AI runner is single-run: the task is one iteration and never continues. Once the id waits are over the handler persists the output before calling the runner, and a re-entered task (iteration above 1) fails without a second model call [D140, D145].
- The handler passes the runner an abort signal built from the task's remaining runtime minus a 30 second margin; a model call that outlives it fails the step with a timeout reason. A cancel or restart during the call is seen by a throttled re-read of the stored review (`StepRunStaleCheckService`, at most one read per 5 seconds, because the task's own abort flag does not see a cancel written by another request); the runner stops between tool steps and nothing is written afterwards. A call whose result is discarded as stale is accepted [D147, A56, A59].
- No step max duration and no watchdog.
- Reading a run [D161, R257, R258]: the internal `GetReviewStepRunUseCase(reviewId, stepId, taskId)` requires the task to be the step's current task or one of its `runs` (`Workflows/Review/StepRunNotFound` otherwise), reads the task and returns `ReviewStepRunInfo { taskId, status (pending, running, done, failed, aborted), startedOn, finishedOn, iterations, outcome, reason }`, or `null` when the task record is gone. `outcome` and `reason` come from the review step (the attempt record, or the step's own state), times prefer the review's record, `iterations` is the automation's own run count (the task's iterations minus the id waits). The task's input, output, logs and raw error are never returned [R146]. The app wrappers require the guard (signed in, the app's namespace, read access to the target) and then `editor` or `reassign`, else `Workflows/NotAuthorized`.

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
- implement the `ReviewTargetEditor` port behind the AI tools `readTarget` / `updateTargetFields`: read the content with a per-field `writable` verdict, and write only the bounded set, atomically (CMS: `cms.*`; WB: `wb.page`, registered under the same gate as the rest of the adapter) [D143];
- delete the review (and its assignment records) when the target is permanently deleted; a failed cleanup is logged and the delete stands, leaving the review orphaned;
- answer whether a user can read the target (`canUserRead(userId, target)`), used by the engine for candidates during routing and reassign [D61, D133]. The adapter reads the model (and, for CMS, its group) and the revision as the current identity, then runs its own read check (CMS: group read, model read, entry and folder access; WB: page read and folder access) as the candidate. The candidate must be an admin user of the current tenant (one lookup; no parent-tenant fallback); the check runs with authorization enforced even when the caller runs without authorization (background tasks), and any error answers "cannot read" (fail closed).

### 9.4 api-core

- Permissions are cached per identity object and tenant, so `IdentityContext.withIdentity` evaluates the other identity's permissions and never leaks them to the outer one; a failed load is not cached. `withAuthorization(cb)` re-enables authorization inside `withoutAuthorization`. Both are needed for candidates' read access (9.3) and for task triggers under `withIdentity(requester)` (7.4) [D134].
- `ListUsersInput.where.teams_in`, applied in the DDB and SQL `listUsers` (both filter in memory). Fix the DDB implementation ignoring `id_in` at the same time (bug B3) [D48, D50].

### 9.5 Audit logs [D65]

Not built in this refactor. Until it lands, the assignment log is the only record of reassignments (the brief's reassign audit entry is deferred). Domain events must carry enough data for a later "Workflows" audit app (entities workflow and review; actions workflow create/update/delete, review request, start, take over, approve, reject, cancel, reassign, restart, step failed). Remove the old v5 "APW" entry from `common-audit-logs/src/apps.ts` now.

### 9.6 api-website-builder

- `deletePageRevision(id: ID!)` on `WbMutation`: deletes one revision of a page through the CMS entry-revision path on the private page model, so the CMS rules apply unchanged (deleting the latest revision makes the previous one the latest; deleting the only revision deletes the page and publishes the page-delete events as well; a published revision is deletable exactly as a page is today, no unpublish step is added). Permission `WbPermissions.canDelete("page", page)`. No storage key, model or schema change. Workflows refuses it while the revision has a review in progress (same `Workflows/Review/ActiveReviewOnTrash` code and data as the CMS) and deletes the revision's reviews afterwards [D157].

## 10. GraphQL surface (outline)

Two kinds of operations [D132, D133]:

- **Per app** (CMS, Website Builder), e.g. `storeWebsiteBuilderPageWorkflow`, each backed by an app wrapper use case that reads the identity, builds the actor, checks permissions and target access, and calls the internal api-workflows use case. Nothing merges CMS and WB reviews.
- **Shared configuration operations** in api-workflows, guarded only by `editor`: settings, `listUsers`, step types, notification transports, automation definitions, AI tools. These are the only api-workflows operations exposed outside the backend.

The lists below name capabilities; each per-app capability exists once per app. Placement and final names [D136]: everything is on the main `/graphql` endpoint; there is no workflows operation on `/cms/*`, and the entry's `system.workflow` field stays there (R102).

- Root `workflows` (`WorkflowsQuery` / `WorkflowsMutation`): the shared configuration operations (`getSettings`, `updateSettings`, `listStepTypes`, `listUsers(search, ids, limit)` → `{ users: { id, displayName }[], missingIds }`, `listAutomationDefinitions` → `{ id, name, models, settingsSchema }[]` (the settings schema as JSON schema); later transports; `listAiTools` → `{ name, title, description, changesContent }[]` and `listAiModels` → `{ id, name, providerId, providerName }[]`, the latter registered by ai-powerups only when `aiPowerups` and `advancedPublishingWorkflow` are both on, so the field is absent otherwise). The review step exposes `taskId`, `runs` (the shared `WorkflowsStepRun { taskId, startedOn, finishedOn, outcome, reason }`, earlier attempts only) and `issues` (`WorkflowsAiIssue { fieldPath, severity, message, suggestion }`).
- Root `cms` (the existing `CmsQuery` / `CmsMutation`): `listCmsEntryWorkflows`, `getCmsEntryWorkflow(id)`, `getCmsEntryReview(id)`, `getCmsEntryTargetReview(modelId, revisionId)`, `listCmsEntryReviews(list, where, sort, limit, after)`, `listCmsEntryWorkflowModels(search, limit, after)`, `listCmsEntryStepCandidates(workflowId, stepId, modelId, revisionId)`, `listCmsEntryReviewStepCandidates(reviewId, stepId)`, `inspectCmsEntryRouting(stepConfig, modelId, requesterId, folderId)`, `cmsEntryFolderExists(id, type)`; `storeCmsEntryWorkflow(data, savedOn)`, `deleteCmsEntryWorkflow(id)`, `requestCmsEntryReview(modelId, revisionId, title, picks)`, `startCmsEntryReviewStep`, `takeOverCmsEntryReviewStep` (also `notifyPreviousOwner: Boolean = true`), `approveCmsEntryReviewStep`, `rejectCmsEntryReviewStep` (each `reviewId, stepId`, approve and reject also `comment`), `reassignCmsEntryReviewStep(reviewId, stepId, userId)`, `restartCmsEntryReviewStep(reviewId, stepId)`, `cancelCmsEntryReview(reviewId)`, `cancelCmsEntryReviewsForDelete(modelId, entryId, revisionId, action)`.
- Root `websiteBuilder` (the existing `WbQuery` / `WbMutation`): the same set with `WebsiteBuilderPage` in place of `CmsEntry` and no `modelId` (`getWebsiteBuilderPageTargetReview(revisionId)`, `requestWebsiteBuilderPageReview(revisionId, title, picks)`, `cancelWebsiteBuilderPageReviewsForDelete(pageId, revisionId, action)` (`revisionId` optional: only that revision's reviews when given, every revision of the page when omitted), `listWebsiteBuilderPageStepCandidates(workflowId, stepId, revisionId)`, `listWebsiteBuilderPageReviewStepCandidates(reviewId, stepId)`, `inspectWebsiteBuilderPageRouting(stepConfig, requesterId, folderId)`, `websiteBuilderPageFolderExists(id)` (the type is always `wb:page`), `reassignWebsiteBuilderPageReviewStep(reviewId, stepId, userId)`, `restartWebsiteBuilderPageReviewStep(reviewId, stepId)`); there is no WB model list.
- Step run read (8b): `getCmsEntryReviewStepRun(reviewId, stepId, taskId)` on `cms` and `getWebsiteBuilderPageReviewStepRun(reviewId, stepId, taskId)` on `websiteBuilder`, each returning `{ data: WorkflowsStepRunInfo, error }` (`WorkflowsStepRunInfo { taskId, status, startedOn, finishedOn, iterations, outcome, reason }`; the shared `WorkflowsStepRun` stays the attempt record), for viewers with `editor` or `reassign` and read access to the content, `data` null when the task is gone [D161].
- Blocking reviews (8b): `listCmsEntryBlockingReviews(modelId, entryIds)` on `cms` returns `{ data: [WorkflowsBlockingReview { reviewId, model, targetId, targetRevisionId, title, stepPosition, stepCount, stepName }], error }` for the reviews in progress of the given entries the viewer can read; at most 200 ids (`Workflows/Review/Validation` above), `[]` for an unbound model [D164].
- The silent websocket action `workflows.reviewChanged` is described in 12 [D160].
- Teams (9a): `workflows { listTeams(search, ids, limit) }` returns `{ data: { teams: [WorkflowsTeamSummary { id, name, memberCount }], missingIds }, error }` for viewers with `editor` (a search is sorted by name, an `ids` request keeps the request order); `search` is a case-insensitive name filter, more than 200 `ids` fail with `Too many team ids.`, `limit` defaults to 50 and is capped at 200 [D166].
- Operations that take a review id take no model; a request takes the revision id and the server derives the content id from it. Every operation returns `{ data, error }` (lists `{ data, meta: { cursor, hasMoreItems }, error }`).

Per-app queries:

- list and get workflows (the app's namespaces only)
- `getReview(id)`, `getTargetReview(model, targetRevisionId)`; each step returns its assignment-log entries; the wrapper strips per-user skip entries for viewers without `editor` / `reassign` [D89, D127]
- `listReviews(list: assignedToMe | pool | teamInReview | myRequests | failedSteps, where, sort: lastChangedOn_ASC | lastChangedOn_DESC, limit, after)` with `where: { modelId?, titleContains?, reviewState?, stepState? }` (review and step state only for `myRequests`; `modelId` only for CMS, without the `cms.` prefix) [D47, D94, D112, D119, D133]
- `listStepCandidates(workflowId, stepId, target revision)` for Request review (write access to the target; the workflow must belong to the app, another app's workflow is not found [R128]; read access checked per candidate), `listStepCandidates(reviewId, stepId)` for Reassign (`reassign` and read access; from the review snapshot) → every member of the step's teams except the requester, sorted by name: `{ id, displayName, excluded, excludedReason }` (excluded: an active exclusion or no read access); `excludedReason` only for `editor` / `reassign`; no workload counts [D48, D97, D104, D128]
- `inspectRouting(stepConfig, model, requesterId, folderId)` → resulting owner, per-rule trace (including skipped rules and why), strategy choice; evaluates unsaved config; returns no per-person load numbers [D45, D95, D104, D118]
- `folderExists(id, type)` → boolean, `editor` only; the type must be the app's (`cms:<modelId>` of a bindable model; Website Builder takes only the id, `wb:page`) [D69, D133]
- CMS only: the workflow editor's model list: `search`, `limit`, cursor; 20 per page, sorted by name; each row carries the bound workflow (id, name) if any; requires `editor` [D116, D130]. The WB editor has the single item Pages and needs no list.

Per-app mutations (base use case in brackets):

- store workflow (`StoreWorkflow`, with the loaded `savedOn`, optimistic check, D131), delete workflow (`DeleteWorkflow`)
- request review (`RequestReview`: model, target revision id, optional title (the content's title when missing, fixed afterwards) [D135], picks `[{ stepId, userId }]`)
- start (`StartReviewStep`), take over (`TakeOverReviewStep`, `notifyPreviousOwner = true`) [D111], reassign (`ReassignReviewStep`: `reviewId`, `stepId`, `userId`; the chosen user is validated like a pick, the current owner is refused), approve (`comment?`), reject (`comment`), restart (`RestartReviewStep`: `reviewId`, `stepId`; only a failed step; re-reaches it as the requester; returns the updated review, and `canRestart` is read through the review get operations, R158), cancel review
- Validation: review title at least 5 characters; reject comment at least 10 characters [D100].

Shared configuration operations (api-workflows, `editor`):

- settings: get, update
- `listUsers(search, ids, limit)` → `{ users: { id, displayName }[], missingIds }` [D48, D104]; also accepts a list of ids (up to 200) and reports which do not exist, so the editor can show saved targets as "Deleted user" [D117]
- step types (with config JSON schemas, `available` and `unavailableReason` per type [D130]), notification transports (`id`, `title`, `description`; the operation `listNotificationTransports`) [D129], automation definitions (with scope and the settings schema as JSON schema, `listAutomationDefinitions`), AI tools (`listAiTools` → `{ name, title, description, changesContent }`) and AI models (`listAiModels`, only with `aiPowerups`)

Errors return `code`, `message` and `data`; the admin keeps them (`GraphQLOperationError`). `Workflows/Workflow/Validation` carries `{ stepId, field, workflowId }` in `data` (4.1) [D165].

Review reads (steps preview, review details) include each step's `description` [D120]. Reviewer candidates carry no workload counts [D104]. Each review step also returns `candidateTeams { id name }`, resolved from `candidateTeamIds` [D158]. Each skip entry of a step returns `userDisplayName` (resolved server-side, name only) and the review returns `cancelledBy { id displayName }`, the actor stored when the review was cancelled.

## 11. Review lists [D47]

Each app has its own lists over its own reviews (CMS: `cms.*`; Website Builder: `wb.page`); nothing merges them [D133].

| List | Filter |
|---|---|
| Assigned to me | `currentOwnerId = viewerUserId`, `currentStepState = inReview` |
| Pool | `currentStepState = awaiting`, `viewerTeamIds` intersect `currentCandidateTeamIds`, the viewer is not the requester |
| Team in review | `currentStepState = inReview`, owner is not the viewer, `viewerTeamIds` intersect `currentCandidateTeamIds` |
| My requests | `createdBy = viewerUserId` |
| Failed steps (only with `reassign`) | `currentStepState = failed`, current step type AI or automation [D112] |

An AI step that fails (fixed reason, `ai-tools.md`) appears in Failed steps like an automation step and is restarted the same way.

The engine's list use case takes `viewerUserId` and `viewerTeamIds` explicitly; the app wrapper supplies them from the identity and offers Failed steps only with `reassign` [D132]. The admin shows the Failed steps tab only to viewers with `reassign` or full access (a display gate, the server check stays) [D162].

All lists also require `isActive: true` [D75].

Each row carries the viewer flags `canStart`, `canTakeOver`, `canReassign`, `canRestart` and `canCancel`, computed by the app wrapper (5.3), so row actions follow the server.

Sort only by `lastChangedOn`: oldest first by default in Assigned to me, Pool, Team in review and Failed steps; newest first in My requests; the client can switch the direction [D119].

Lists keep the folder-level read filter on the target, so review titles from restricted folders do not leak. The app wrapper passes a target-read predicate (its own folder and model permissions for the viewer) to the engine's list use case, which applies it and runs the rewritten pagination: keep fetching pages until `limit` is filled, return the cursor of the last scanned record, and do not promise an exact `totalCount` [D76, D133].

## 12. Notifications [D44, D60, D96, D103, D107, D111, D126, D129, D133, D149-D156, D160]

| Event | Recipients |
|---|---|
| Step reached, pool | Members of the candidate teams |
| Step reached, owner is a user (routing, pick) | Owner |
| Reassign | Old and new owner |
| Take over | Previous owner, unless the taker opts out [D111] |
| Review approved, review rejected, step failed | Requester |
| Review cancelled | The owner of the step the review was on, if a user |

- An assignment never notifies the whole team.
- Pool notifications exclude the requester, excluded users and users who cannot read the content [D61].
- Channels: transports configured on the step (`notifications[]`, e.g. e-mail via `MailNotificationTransport`) plus a websocket message every time. Each event uses the channels of the step where it happened: approved the last step, rejected the rejecting step, cancelled the current step, failed the failed step [D103].
- AI and automation steps are named by their step title as decider or owner, never by the automation's name [D107, D126].
- The toast message is one action, `workflows.notification`, with the event in `data`: `{ event, reviewId, stepId, namespace, targetId, targetRevisionId, title, body }`, where `event` is `poolReached`, `assigned`, `reassigned`, `takenOver`, `approved`, `rejected`, `failed` or `cancelled`; `title` and `body` are the in-app texts. Workflows lists the recipient's connections (`WebsocketsListConnectionsUseCase`), keeps the ones in the review's own tenant and sends to them (`WebsocketsSendToConnectionsUseCase`), at most 10 recipients at a time; `WebsocketsSendToIdentityUseCase` is not used; the notifier delivers only to the recipient's connections in the review's tenant [D149]. Only connections younger than 3 hours receive it; there is no stored inbox and no retry [D60]. A recipient with no connection gets nothing and that is not an error.
- A second, silent websocket action, `workflows.reviewChanged`, tells open views that a review changed: data `{ kind, reviewId, stepId, namespace, targetId, targetRevisionId }` with `kind` `requested`, `stepStarted`, `stepApproved` or `stepRestarted`; no title, no body, no toast. It is sent when a review is requested and when a step starts, is approved while the review stays `inProgress` or restarts (the final approval sends `approved` only), to the requester and the current user owner, de-duplicated, never to the acting user. A failure sends none: the owner of a failed step is AI or automation and the requester refetches on the `failed` notification. There is no pool lookup, so pool members and the people who get no toast for a take-over, reassign, reach or final decision see those changes on reload or after their own action. Delivery is the one tenant-scoped sender of the notification messages; a failure is logged and never fails the review action [D160, D149].
- Messages are built from fixed texts and the content title, the step title, a person's display name, the rejection comment (at most 300 characters) and a step failure's fixed reason; never field values, model names, team or rule names, or any error text [D155]. The transport message is `{ title, body, url, linkLabel }`: `title` is the subject, `body` the plain text, `url` the link or `null`, `linkLabel` the link text. E-mail is HTML-escaped, one mail per 50 bcc recipients, the subject on one line [D153].
- A transport's `send` never throws and never fails the notification; a failing transport, mailer, websocket or lookup is logged once and the review action still succeeds [D156]. The shared `listNotificationTransports` operation (`editor` only) lists the registered transports (`id`, `title`, `description`) for the editor's "Notify via" list [D152]. Transport ids on a step are not validated on save; an unregistered id is skipped and logged at send time [D151].
- The e-mail links to the content in the admin: the admin host from service discovery, the app's path through the `ReviewTargetLink` port (CMS content entry, Website Builder page editor) and the current tenant's id (the review's own tenant) as the `tenantId` query parameter; without a host, a link adapter or a tenant the mail goes without a link. The websocket carries no URL: the client builds it from `namespace`, `targetId` and `targetRevisionId` [D133, D155].
- Take over carries `notifyPreviousOwner` (default true) from the GraphQL argument through the wrapper and the engine to the fact; it is never stored [D111, D154]. Developers add channels by registering a `NotificationTransport` (`docs/.bruno/workflows/notifications.md`).
- A notification links to the content or to the review in its own app (CMS or Website Builder); the message carries the review's namespace so the client opens that app's review [D133].
- On the client an in-app notification is a toast through the admin `Notifications` feature; every workflow toast, including confirmations of the user's own actions, uses that one stack [D102, D125].
- On the client every `workflows.notification` message goes to one shared service: it shows the toast and signals the review activity bus, and the visible Content Reviews lists and dashboard widgets of that app refetch once per signal (own actions signal the same bus); there is no polling. New reviews appear in a list only through "New reviews are available." and Show. `ReviewChangedEvent` keeps the content lists' `system.workflow` cache in sync [D60, D157]. The shared `ReviewChangeMessageHandler` turns `workflows.reviewChanged` into a signal with source `remote` that carries the review id and the target revision id and shows nothing; the review bar refetches when it names the bar's review or revision, the details drawer when it names its review (the drawer subscribes after its first successful load, so a failed first load does not subscribe and Try again subscribes on success), lists and widgets on any signal of their namespace; a viewer's own action refreshes once, and an action taken in the drawer refreshes the bar only through the signal (the drawer's `onChanged` stays for conflicts) [D160].

## 13. Admin UI

Screens, states and copy are specified in the UI design brief (`docs/.bruno/specs/2026-10-06-workflows-ui-design-brief.md`, decisions D88-D126) and the Claude Design prototypes (local copy, `/design-pull`). This section keeps the architectural points.

### 13.1 Architecture

- Keep the DI + MobX presenter pattern. Presenters are transient: each target view, dialog, request dialog, details drawer, list and widget gets its own instance [D71]; singletons are services (activity bus, toasts, notification service, trash collector and guard), each app's gateway and use cases, and each editor's session.
- The shared core lives in `app-workflows` and knows no app: domain types, DTOs, field fragments and mappers of the shared `Workflows*` types, the gateway interface, one shared `ReviewUseCases` implementation, presenters, views, dialogs, toasts, activity and notification handling, the cache-sync handler, the trash and delete warning flow and the mounting components. There is no namespace registry [D159].
- Each app package (CMS, Website Builder) owns only what differs: GraphQL operation documents and the gateway that runs them, the registration binding its gateway to the shared use cases under its own tokens, a content adapter, a cache writer and thin glue at app-specific extension points. Shared presenters depend on use-case interfaces, never on a gateway; no logic is duplicated across the app packages [D159]. The shared configuration operations of the editor (step types, automation definitions, notification transports, teams, AI models, AI tools) have one gateway and one use-case token; settings and users are not read by the 9a editor [D132, D133, D166].
- Gateways return the `{ data, error }` envelope; the shared use cases turn `error` into a typed `GraphQLOperationError` (`@webiny/app`) that keeps `code`, `message` and `data`, and presenters map by code. The base CMS and Website Builder delete gateways throw the same error [D157].
- Per-viewer flags come from the server; the client invents no rights. Two display gates read the viewer's `workflows` permission through one pure function (full access, `editor`, `reassign`): the Failed steps tab (`reassign` or full access) and the Background task link (`editor` or `reassign`); the server keeps every check [D162]. The workflow editor's route, menu item and configuration queries are one more such gate: they show only to viewers with `editor`.
- Mouse and keyboard only; no touch behaviour.
- Workflows decorators and registrations exist only when the `advancedPublishingWorkflow` feature is on; without it CMS and Website Builder are unchanged. Each app loads its workflow list once and caches it per namespace; the editor shows the bar only for content with a bound workflow.
- Every workflow toast, including confirmations of the user's own actions, goes through the admin `Notifications` stack [D102, D125].
- Each app's cache writer updates the content list cache only for the review's own revision, so other revisions of the same content keep their state.

### 13.2 Workflow editor

One shared view in `app-workflows`, mounted per app at `/cms/workflows` and `/website-builder/workflows`; the route, the menu item and every configuration query show only to viewers with the workflows `editor` permission (a display gate, the server keeps its checks) [D162]. Phase 9a built everything below except the assignment part, which is 9b.

- Bound to models (`models`), one model per workflow in v1. A panel lists the models (panel label "Content models" in the CMS, "Website Builder" in the Website Builder, shown uppercase by the panel's style). CMS: `listCmsEntryWorkflowModels` (public, publishable models only), 20 per page, server search (debounced 250 ms, a new search restarts at the first page), Load more, "No models match “{q}”." when empty. Website Builder: the single item Pages (no search). Each row shows the model icon, the name, a sub line (`{n} steps` for the open workflow, the bound workflow's name for other bound models, "No workflow" otherwise), the bound indicator and a dot for unsaved changes on the open model. Create workflow starts a draft named "{Model} review", dirty from the start [D116].
- Steps: a Draft card, the numbered step cards with a `+` between them, a Published card; an empty workflow shows "No steps yet" and Add step. Add step opens a picker with one card per step type in the order `listStepTypes` returns, named People (`review`), Automation and AI (D98); an unavailable type is listed and disabled with its reason (D122), and the type cannot be changed later (D91). Each card shows the title, the type tag, a summary line (People: the teams joined with `+`; Automation: the automation's name; AI: `{Model} · n tool(s)` with ` · can change content` when a tool can write, or `No model chosen · 0 tools`), warning lines (a team without members, a missing automation, settings that no longer validate, a retired AI model, the missing licence) and, after a failed save, the error strip. Cards reorder by drag (the shared `SortablePresenter`) or with the up and down buttons; a keyboard move keeps focus on the moved card and announces "Step moved to position {position} of {total}." in a polite live region.
- Step drawer (560 px, from the card's edit button): one FormModel form per step with the common fields (Title, Colour, Description, Notify via) and the type's own fields, in one body (no tabs in 9a) [D56, D66, D168]. Done applies the form to the draft; X, Escape and the scrim keep the edits too, and an unfinished hex colour keeps the old colour (only Done is blocked by it). Nothing is stored until the workflow is saved. Colour: ten theme presets stored as CSS variable strings and a custom `#RRGGBB` [D169]. Notify via: one checkbox per transport from `listNotificationTransports`; a new People step starts with `e-mail` ticked, unlisted ids on a loaded step are kept on save and not shown, and the text "Only in-app notifications are available. No other channels are configured." shows when there are no transports [D96, D129, D151].
- People step: `teams` through the shared searchable multi picker over `listTeams` (a team with no members shows "This team has no members"); `assignment` is carried unchanged and edited in 9b.
- Automation step: radio cards of the definitions whose scope covers the model; the settings form is generated from the definition's JSON schema through a JSON-schema to FormModel adapter in `@webiny/app-admin` (string, enum, number and integer with bounds, boolean, object, list of strings, list of objects; anything else is a JSON text field; the `ui` hints `textarea` and `team`; required from the schema's `required` unless the field has a default, booleans and nested objects excepted). The validator is rebuilt with `z.fromJSONSchema` and flags stored settings that no longer validate [D14, D35, D37, D66, D168]. Switching to another automation with settings entered asks first. A stored automation that no longer exists shows a warning.
- AI step: Instructions, Model (single picker over `listAiModels`, required; a stored model that is no longer listed shows as retired with a warning and does not block saving) and Tools (checkboxes over `listAiTools`; unlisted names are kept and not shown), only when the `ai` type is available; without the licence AI cards are disabled and an existing AI step is read-only, with move and delete still enabled [D101, D109, D138, D139, D167].
- Save is explicit and enabled only when the draft is dirty [D92]. The client validates first (name, at least one step, a title per step, at least one team, required automation settings, instructions, a model, a valid colour); on failure the failing steps are marked, the first scrolls into view and a toast says to fix the highlighted steps or fields. Edits are ignored while a save is in flight. The store mutation carries the loaded `savedOn` string unchanged (null for a new workflow or Save as new). Server errors map back: a validation error with a `stepId` marks that step and field (a field with no form field shows the message on the card and at the top of the drawer) and a toast says to check the highlighted step; `name` or `steps` mark the name input or the "No steps yet" box; a duplicate-model error shows the banner "Could not save the workflow — {Model} already has a workflow: “{name}”. A model can have one workflow." (Website Builder: "Pages already have a workflow: “{name}”. Pages can have one workflow.") with Reload; any other validation error shows "Could not save the workflow — {server message}"; a conflict opens "Someone else changed this workflow" with Keep editing and Reload workflow; a deleted workflow opens "This workflow was deleted" with Discard changes and Save as new workflow [D123]; a transport failure shows the banner "Could not save the workflow" with Try again. The draft stays dirty after every failure [D131, D165].
- A successful save makes the returned workflow the baseline, updates the model row and refreshes the review UI's cached workflow list, so the bar, requests and lists see the new steps without a reload.
- Delete asks "Delete workflow?" (finished reviews keep their history). When reviews are in progress the server refuses and the dialog "This workflow can't be deleted yet" shows the count, up to five of the reviews (title, `Step {n} of {N} · {step}`, linked to the content) and, by the viewer's `reassign` permission, how to proceed, with Close as the only action [D115]. Delete step asks first.
- Leaving with unsaved changes asks (switching the model, leaving the route through the router, and the browser's own prompt while dirty) [D92].
- Not in 9a, still to build: the People step's Assignment section (strategy selector, `allowManualPick` toggle, reorderable rule list, rule inspector, `WorkflowUserPicker` over `listUsers`, `WorkflowTeamPicker` limited to the step's teams, the standard `FolderPicker` with "restricted folder" preserved and the invalid-target flags of D69, D72, D61) and saved-reference resolution (D117): 9b. The exclusion settings page and the permission UI: 9c. Several workflows per model and secret settings are not planned.

### 13.3 Request review dialog

- The dialog previews the workflow's steps (title, type, how the owner is chosen, description). For each step with `allowManualPick`, a choice between automatic (preselected) and "Choose a person"; all picks are captured in one dialog and sent only for steps with a person chosen.
- The picker (`ReviewerPicker`, over the admin autocomplete) uses `listStepCandidates`; candidates arrive unpaged and are searched on the client. Excluded users show as "Unavailable", with the reason only when the server returns one (`editor` / `reassign`) [D22, D72, D97].
- The title is prefilled with the content title and needs at least 5 characters; the server stays authoritative [D100, D135].

### 13.4 Review view (bar, tooltip, dialogs, details)

- The bar shows a loading state, a failed state with "Try again" (and a no-access variant), no bar for content without a workflow, and for an active review the review state tag, the current step and owner, a progress popover and a tooltip. Editing and publishing are unavailable while the status is loading or failed.
- All six step states (pending, awaiting, in review, approved, rejected, failed) render in the tag, popover and details. A running AI or automation step (in review with a non-user owner) reads "{Step} running since {hh:mm}" in the bar and the popover and carries the tag Running; a failed step reads "{Step} failed: {reason}" (just "{Step} failed." without a reason) and carries the tag Failed. The tag tooltips read "{Step} is running since {hh:mm}." and "{Step} failed. The requester or an operator can restart it." [D82, D90].
- Actions come from server flags: request review, start (confirmed [D114]), take over (checkbox to notify the previous owner [D111]), reassign, approve, reject, cancel and restart (Restart in the bar, the details drawer and the Content Reviews row, only when the server flag `canRestart` is set). The restart dialog is titled "Restart “{Step}”?" and says when the last attempt failed and why and that the step runs again from the beginning; a toast "Restarted “{Step}”" ("The step is running again.") follows; when someone restarted the step first the dialog stays open with "Someone restarted “{Step}” at {time}. It is running again, so your restart was not saved." [D34, D82]. The cancel dialog of a running step ends with "{Step} is running and will be stopped.". Conflicts ("Someone else acted first") keep the dialog open, collapse it to Close and re-read the review; a typed comment is kept. Each dialog takes an optional conflict callback, so the host (the bar, the details drawer or a Content Reviews list) refreshes itself when a conflict happens. Own actions end with a toast.
- The Review details drawer (D88) shows the header, the timeline with owner, "Why this owner" (hidden for AI and automation), times, comment and the skipped-by-assignment box exactly as received [D89]; it opens from the bar and from a list row, as presenter state (no route). For an AI or automation step it also lists the Attempts, oldest first (`#{n} {start}–{end} {Outcome} {reason}`, the current attempt last, "since {start}" while it runs), and for an AI step the "Issues reported by the AI" (severity Error, Warning or Info, the field or "Whole content", the message, "Suggestion: {text}" or "—"). Viewers with `editor` or `reassign` get a "Background task" link per attempt that opens a panel with Status, Started, Finished, Iterations and Reason (a row without a value is left out; times in full; "This task is no longer available." when the task is gone) [D90, D161]. The drawer refetches when a change message names its review [D160].
- Editor rules: editing is open without a workflow and without an active review; publishing needs no workflow or an approved review; an approved revision that was unpublished keeps "Review: Approved" and can be published again [D121]; moving is disabled while the revision is in review (the CMS list Move action too); an unpublished page that was reviewed can be published again with no new review (a page published before the workflow was bound has no review and the server refuses with `Workflows/Review/PublishBlocked`, shown as an error toast); the Website Builder shows the bar for every page status, hides "New Revision" while a review is in progress and offers "Create new revision" on a rejected page [D24]. A disabled Publish stays visible, `aria-disabled`, with its reason.
- Team pool owners read "Waiting in the {Team} team pool" with the names from `candidateTeams` [D158]; the bar names the viewer's own teams among them (the viewer's team names come from the admin `Identity`, no API change). Only a failed step is shown in a destructive (red) tag; the Rejected tag is neutral-dark for the review as a whole and for a step alike, while the progress segments keep the design's red for rejected steps.
- The skipped-by-assignment box shows the display names of the skipped people (resolved server-side, name only); a cancelled review reads "{Name} cancelled this review at {time}." from the stored cancelling actor (`cancelledBy`; reviews cancelled before 8a read "Someone cancelled this review at {time}.").
- Permissions follow the content: each app's own GraphQL carries that app's content permission checks, so a `Workflows/NotAuthorized` read happens only for a viewer without access to the content and shows the no-access state; the lock cannot hit a user who can edit the content.

- When an AI or automation step finishes while the editor is locked and the revision changed, the editor reloads the revision (the CMS entry form, the Website Builder page) and the bar shows "Content updated by {step title}. The editor loaded the latest version." with the icon `auto_awesome` (AI) or `bolt` (automation). The CMS reload is skipped while the form is dirty, the reload never re-initialises the review presenter, and a reload that was overtaken by a dispose or a new init is skipped [D163].

### 13.5 Lists and dashboard

- Content Reviews exists once per app (CMS, Website Builder), each with four lists over that app's reviews: Assigned to me, Team pool, Team in review and My requests, and a Failed steps list for viewers with `reassign` or full access only (oldest first; search and the content type filter only; empty text "No failed steps" and "AI and automation steps that hit a technical error appear here."; `?tab=failedSteps` without the permission opens the default list), with Restart on each row [D112, D162]. Sorting is by `lastChangedOn` only; search, a content type filter (CMS only), "Any review state" and "Any step state" (My requests only); load more by cursor [D47, D112, D113, D119, D133].
- The list view and presenter work on app-neutral rows through a use-case interface and a row provider, and row links and actions resolve per row namespace, so a later global Content Reviews view can combine several apps without changing the view. No global route exists yet.
- Live updates: the visible list refetches after the user's own actions and on every incoming `workflows.notification` or `workflows.reviewChanged` message for its namespaces; a signal that arrives while the list is still loading is queued and applied once after the load; new reviews are announced with "New reviews are available." and appear on Show; no polling [D60]. A conflict on an action started from a list ends with "The list has been refreshed." in the dialog, and the list refreshes.
- Empty states of the Assigned to me and Team pool lists name the viewer's own teams (from the admin `Identity`).
- Dashboard widgets per app: "For me to review" (segments Assigned to me, Team pool) and "My requests", five rows each, "View all" opens the matching list of that app; a widget also queues a signal that arrives during its load [D71, D133].
- The Content Reviews menu item of each app is the one shared component, wrapped in `AdminConfig`, nested under that app's menu group.
- CMS and WB content lists: row selectability reads `system.workflow.reviewState`; nothing else changes [D70].

### 13.6 Settings

- Exclusion list page under the Settings menu, requiring `editor`. Date picker for `endsOn` converted to end of that day in the user's timezone, stored as UTC [D16, D43, D73].

### 13.7 Security

- Workflows permission UI with full and custom access (`editor`, `reassign` checkboxes) [D54].

### 13.8 Trash and delete warning

- The normal trash or delete confirmation runs first. When the server refuses with `Workflows/Review/ActiveReviewOnTrash`, a warning lists the blocking reviews; Confirm cancels them through the app's cancel-for-delete wrapper (scoped to the revision for a revision delete) and repeats the action once; Dismiss changes nothing. Trash, revision delete, permanent delete and bulk delete all use the one shared guard [D157].
- A bulk delete collects the refusals of the whole run, shows one warning and retries only the blocked items. A CMS bulk trash of all loaded rows runs as a background task whose refusals the client cannot see, so before it starts the admin asks `listCmsEntryBlockingReviews(modelId, entryIds)` for those entries (chunks of 200 ids), shows one warning for the reviews it lists and, on confirm, cancels them per target and starts the task; with none listed the task starts at once, a dismissed warning starts nothing, and a failed pre-check shows the error toast and starts nothing; only entries the viewer can read are listed. The base bulk presenter reports whether the task started, and the trash action's "Entries will be trashed in the background" toast and the deselection follow only a started task [D164]. The Website Builder bulk delete runs per item. A bulk retry's results dialog lists only the retried items; the first pass shows a `Notifications.warning` toast "{done} of {total} items done. {n} still need your confirmation.".
- During a bulk run the per-item delete use cases report "not done" (`false`) instead of throwing, and the base CMS and Website Builder callers treat `false` as not done.
- The Website Builder revision delete has no first confirmation dialog, so the warning is its only dialog. A trashed WB page cannot have an active review, so the WB trash bin has no hook; the CMS trash bin is covered by the `PermanentlyDeleteEntryUseCase` decorator.

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
