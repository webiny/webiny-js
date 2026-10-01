# Workflows: API (api-workflows)

Discovery notes for `packages/api-workflows` (about 9.9k LOC across src and tests). Paths are relative to the package root unless they start with `/packages`. Snapshot of 2026-10-01.

Headline findings:

- Notifications are configured on steps but never sent.
- Start, approve, reject and take-over persist through `UpdateWorkflowStateRepository` directly, so no `afterUpdate` event fires and `system.workflow` on the entry or page goes stale after creation.
- Workflow-state use cases have almost no permission checks.
- Steps have no type, and nobody is assigned. Reviewers are "member of any team listed on the step".

## 1. Layout, entry points, registration

- `src/index.ts:1` exports only `WorkflowsFeature`. `package.json` exports `"./*"`, so consumers deep-import internals (`features/workflowState/.../events.js`, `domain/workflowState/WorkflowState.js`).
- Layout:
  - `src/domain/{workflow,workflowState,notifications}`: types, abstractions, errors, CMS model factories, mappers, the `WorkflowState` aggregate and guards.
  - `src/features/<area>/<UseCase>/`: `abstractions.ts`, `<X>UseCase.ts`, optional `<X>Repository.ts`, `events.ts`, `feature.ts`, `index.ts`. Areas: `workflow`, `workflowState`, `internal/GetUserTeams`, `notifications`.
  - `src/graphql/`: `workflows.ts`, `workflowState.ts`, `notifications.ts`, `validation/*` (zod).
  - `src/WorkflowsSchemaFactory.ts`: one DI `GraphQLSchemaFactory` calling three `add*Schema(builder)` (`:11-19`).
  - `src/constants.ts`: `WORKFLOW_MODEL_ID="wbyWorkflow"`, `WORKFLOW_STATE_MODEL_ID="wbyWorkflowState"`, `WORKFLOWS_PERMISSION="workflows"`.
  - `src/types.ts`: `ICmsEntryWorkflowState`, `IWorkflowsSecurityPermission { editor: boolean }`; augments `IEntrySystem` with `workflow?: ICmsEntryWorkflowState | null` (`:20-24`).
- `src/WorkflowsFeature.ts:36-89`:
  - Licence gate: `FeatureFlags.get().isEnabled("advancedPublishingWorkflow")` (`:41-43`), mapped to `License.canUseWorkflows()` (`/packages/api-core/src/features/featureFlags/decorators/FeatureFlagsWithLicenseDecorator.ts:30`).
  - Registers model factories, schema factory, model providers, mappers, notification features, workflow CRUD, `GetUserTeamsFeature`, 14 workflow-state features.
- Model providers (`src/features/WorkflowModelProviders.ts:21-53`) resolve the tenant model on demand through `GetModelUseCase` (#5634 removed `WorkflowsInitializer`).
- Double registration (verified):
  - `registerApiRequestStack.ts:127` registers `WorkflowsFeature`; `:128` registers `CmsWorkflowsFeature`, which registers `WorkflowsFeature` again (`/packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts:20`).
  - Neither `createFeature` nor `@webiny/di` deduplicates (`node_modules/@webiny/di/dist/index.js:53-60`; `resolveMultiple` returns one instance per registration, `:213-224`). Single resolves take the last. CMS/WB context providers and filters are decorators (`EntryWorkflows/feature.ts:24-25`, `PageWorkflows/feature.ts:22-23`), so re-registered defaults do not displace them.
  - Verified effects of multi resolves (production stack only; test harnesses register once):
    - `GraphQLSchemaFactory`: workflow SDL appended twice (`api-graphql/.../GraphQLSchemaComposer.ts:16,22-24`, `GraphQLSchemaBuilder.ts:11-14,79`). `makeExecutableSchema` merges identical typeDefs; resolvers overwrite at the same path (`GraphQLSchemaBuilder.ts:85-98`). No error, wasted work.
    - `NotificationTransport`: `listWorkflowNotificationTypes` returns `[{id:"e-mail"},{id:"e-mail"}]` (`ListNotificationTypesRepository.ts:14-19,26`).
    - `ModelFactory` (`/packages/api-headless-cms/src/features/modelBuilder/feature.ts:62`): `wbyWorkflow` and `wbyWorkflowState` each appear twice in `ModelsProvider.list()` (`/packages/api-headless-cms/src/features/modelBuilder/models/ModelsProvider.ts:20-35`).
  - `StoreWorkflowFeature.register` (`features/workflow/StoreWorkflow/feature.ts:10-11`) re-registers Create and Update, already registered at `WorkflowsFeature.ts:65,67`.

## 2. Domain model and persistence

### Workflow

`src/domain/workflow/abstractions.ts:6-31`:

```ts
interface IWorkflowStepTeam { id: string }
interface IWorkflowStepNotification { id: string }   // NotificationTransport id, e.g. "e-mail"
interface IWorkflowStep { id; title; color; description?; teams: NonEmptyArray<IWorkflowStepTeam>; notifications?: IWorkflowStepNotification[] }
interface IWorkflowValues { app: string; name: string; steps: NonEmptyArray<IWorkflowStep> }
interface IWorkflow extends IWorkflowValues { id: string }
```

- Duplicated as `IWorkflowStepInput` / `IWorkflowInput` in `src/features/shared/abstractions.ts:3-24`.
- `app` is free-form: `cms.<modelId>` or `"wb.page"`.
- Private CMS model `wbyWorkflow` (`src/domain/workflow/workflowModel.ts:6-46`): `name`*, `app`*, `steps` (object list, min 1) with `id`* (`:24`), `title`*, `color`, `description`, `teams[{id}]`, `notifications[{id}]`. `color` and `teams` are not required here but required in GraphQL, zod and the state model.
- Workflow id is caller-supplied, stored as `id#0001` (`createIdentifier({id, version:1})` in Get/Update/Delete repositories and `ListWorkflowsRepository.convertWorkflowId`, `:63-69`).
- `WorkflowMapper.toCmsEntry` leaves `id` inside values.

### WorkflowState

`src/domain/workflowState/abstractions.ts:6-71`:

```ts
enum WorkflowStateRecordState { pending="pending", inReview="inReview", approved="approved", rejected="rejected" }
interface IWorkflowStateIdentity { id; displayName; type }
interface IWorkflowStateRecordStep extends IWorkflowStep { state: WorkflowStateRecordState; comment: string|null; savedBy: IWorkflowStateIdentity|null }
interface IWorkflowStateRecord { id; app; title; workflowId; targetId; targetRevisionId; isActive: boolean; comment: string|undefined;
  state: WorkflowStateRecordState; steps: Steps[]; createdOn; savedOn; createdBy; savedBy; targetContext: GenericRecord }
interface IEnrichedWorkflowStateRecordStep extends IWorkflowStateRecordStep { isOwner; canTakeOver; canReview }
```

- `IWorkflowState` adds computed `done`, `currentStep`, `nextStep`, `previousStep`.
- Steps are a snapshot copied at creation (`CreateWorkflowStateUseCase.ts:118-123`). Later workflow edits do not affect running reviews.
- Comments: one per step (approve optional, reject required). `record.comment` is always `undefined` and set by nothing. No threads.
- Owner: step `savedBy` = whoever started or took over. Only the owner can approve or reject. No assignee field.
- Private CMS model `wbyWorkflowState` (`src/domain/workflowState/stateModel.ts:25-93`):
  - Display name `"RecordWorkflow State"` (typo).
  - Fields: `workflowId`, `app`*, `title`*, `targetRevisionId`, `targetId`, `isActive`, `comment`, `state` (predefined), `targetContext` (json), `steps[]`* with `id`*, `title`*, `color`*, `description`, `teams[]`* (min 1), `notifications[]`, `state`, `savedBy{id,displayName,type}`, `comment`.
  - `createdBy`, `savedBy`, `createdOn`, `savedOn` come from entry metadata (`WorkflowStateMapper.ts:25-28`).
- `WORKFLOW_STATE_MODEL_ID` defined twice (`constants.ts:2`, `stateModel.ts:4`); `WorkflowModelProviders.ts:5-6` imports one from each.

### Repositories

All wrap CMS use cases; most `.inSingletonScope()` in a per-request container.

| Repository | CMS use case | Location |
|---|---|---|
| Workflow Create / Get / Update / Delete / List | Create, GetEntryById, Update, Delete, ListLatestEntries + `CmsWhereMapper` | `features/workflow/*/…Repository.ts` |
| CreateWorkflowState | CreateEntry | `features/workflowState/CreateWorkflowState/CreateWorkflowStateRepository.ts` |
| GetWorkflowState | GetEntryById | `.../GetWorkflowState/GetWorkflowStateRepository.ts` |
| GetTargetWorkflowState | ListLatestEntries, `values {app, targetRevisionId, isActive:true}`, limit 1, fails if `totalCount>1` | `.../GetTargetWorkflowState/GetTargetWorkflowStateRepository.ts:22-62` |
| UpdateWorkflowState | GetEntryById, merge, UpdateEntry (full values) | `.../UpdateWorkflowState/UpdateWorkflowStateRepository.ts:24-63` |
| ListWorkflowStates | ListLatestEntries, default limit 50, `createdOn_DESC` | `.../ListWorkflowStates/ListWorkflowStatesRepository.ts` |
| DeleteWorkflowState | DeleteEntry; ignores result, always `Result.ok()` | `.../DeleteWorkflowState/DeleteWorkflowStateRepository.ts:12-17` |

## 3. Lifecycle and state machine

Aggregate: `src/domain/workflowState/WorkflowState.ts`, built as `new WorkflowState(record, currentUserTeams, currentIdentity)` (`:33-38`). Use cases load, build, mutate, persist `toRecord()`.

- Request review: `CreateWorkflowStateUseCase.execute({app, targetRevisionId, title})` (`CreateWorkflowState/CreateWorkflowStateUseCase.ts:35-144`).
  1. Requires a version in `targetRevisionId`.
  2. Finds the workflow via `listWorkflows({where:{app}, limit:1})`; fails if none or `totalCount>1`. One workflow per app is enforced only here.
  3. Fails with `ActiveStateExistsError` only when the active-state lookup succeeds (`:79-91`). Any lookup failure (persistence error, multiple active states) is treated as "none" and another state is created.
  4. Calls `WorkflowStateContextProvider.provide` for `targetContext`.
  5. Creates record `state=pending`, `isActive=true`, all steps `pending`.
  6. Publishes `WorkflowStateAfterCreateEvent`.
  - No permission check.
- Start: `state.start()` (`WorkflowState.ts:182-210`). Takes first `pending` step; fails if record `rejected` or `inReview`, or `!canReview`. Sets step and record `inReview`, step `savedBy` = current user. `StartWorkflowStateStepUseCase.ts:15-42` persists via repository, publishes `WorkflowStateStartStepEvent`.
- Take over: `takeOver()` (`:212-245`). Needs active `inReview` step, `canTakeOver`, `canReview`. Replaces step and record `savedBy`. Event `WorkflowStateTakeOverStepEvent`.
- Approve: `approve(comment?)` (`:247-278`). Needs active `inReview` step, `canReview`, `isStepOwner`. Step `approved`; record `pending` if a next step exists, else `approved`. Next step is not started; waits `pending` until a reviewer calls start. Event `WorkflowStateApproveStepEvent`.
- Reject: `reject(comment)` (`:280-307`). Same checks. Step and record `rejected`. Terminal: later actions fail with `WorkflowStateRejectedError`. Record stays `isActive=true`; author must cancel before a new request. Event `WorkflowStateRejectEvent`.
- Cancel: `CancelWorkflowStateUseCase.ts:13-28` calls `UpdateWorkflowStateUseCase.execute(id, {isActive:false})` (publishes `afterUpdate`), then publishes `WorkflowStateCancelEvent`. Two events for one action. No check that caller is the creator.
- Complete: no explicit step. `done` = all steps `approved` (`:102-112`). Final approval does not publish. Publish stays manual, gated by `EntryBeforePublish` / `PageBeforePublish` handlers (`WORKFLOW_STATE_NOT_COMPLETED`) and UI `canPublish && (!hasWorkflow || isApproved)`.
- Other:
  - `UpdateWorkflowStateUseCase` (`UpdateWorkflowState/UpdateWorkflowStateUseCase.ts:25-67`): generic partial update; requires the workflow to still exist (`:33-45`), so cancel fails after the workflow is deleted.
  - `DeleteWorkflowStateUseCase` by id; `DeleteTargetWorkflowStateUseCase` by `(app, targetRevisionId)`. Returns `Result.ok()` on any `GetTargetWorkflowState` failure, not only not-found (`DeleteTargetWorkflowStateUseCase.ts:24-27`); inactive states orphaned; fails if workflow gone. It wraps the `WorkflowState` aggregate in `new WorkflowState(...)` again as if it were a record (`:29,53`), so the `afterDelete` payload is double-wrapped with steps enriched twice. Both use cases publish `WorkflowStateAfterDeleteEvent` (lives in DeleteTarget folder).
- `start`, `approve`, `reject`, `takeOver` never check `isActive` (`WorkflowState.ts:182-307`; use cases load by id). A cancelled state can still progress.
- Completed states are never deactivated. On publish, the CMS handler only nulls `entry.system.workflow`; the state stays `isActive=true` (`/packages/api-headless-cms-workflows/src/features/EntryWorkflows/handlers/ValidateWorkflowStateOnEntryBeforePublish.ts:30-36`).
- A workflow is not mandatory for publish: no active state or any lookup failure lets publish through (`ValidateWorkflowStateOnEntryBeforePublish.ts:23-26`).
- Computed:
  - `currentStep` (`:121-143`): first of in review, rejected, first pending, last approved.
  - `getActiveStep()` (`:168-180`): `inReview` step, or `null` if any step rejected.
- Domain events (`DomainEvent` + `*Handler` abstraction via `EventPublisher`):
  - Workflow: `workflow.{before,after}{Create,Update,Delete}`.
  - State: `workflowState.afterCreate`, `afterUpdate`, `cancel`, `afterDelete`, `startStep`, `takeOverStep`, `approveStep`, `reject`.
  - Payload `{ state: WorkflowState }`, the live aggregate with identity-relative flags. `afterUpdate` also carries `original`.

| Event | Subscribers |
|---|---|
| `workflow.beforeCreate` | `DisallowUnpublishableModelsOnBeforeCreate` (CMS). Not on `beforeUpdate`, so `storeWorkflow` updating an existing workflow skips the check (`DisallowUnpublishableModelsOnBeforeCreate.ts:30-34`) |
| `workflowState.afterCreate` | `UpdateEntryOnWorkflowStateAfterCreate`, `UpdatePageOnWorkflowStateAfterCreate` |
| `workflowState.afterUpdate` | `UpdateEntryOnWorkflowStateAfterUpdate`, `UpdatePageOnWorkflowStateAfterUpdate` |
| `workflowState.cancel` | `ClearEntryStateOnWorkflowStateCancel`, `ClearPageStateOnWorkflowStateCancel` |
| `workflowState.afterDelete` | `ClearEntryStateOnWorkflowStateAfterDelete`, `ClearPageStateOnWorkflowStateAfterDelete` |
| `startStep`, `takeOverStep`, `approveStep`, `reject`, other workflow events | none |

Consequence: `system.workflow` is written at create and not refreshed on start/approve/reject/take-over (verified: `ApproveWorkflowStateStepUseCase` depends on `UpdateWorkflowStateRepository`, not the use case). List views filtering on `system.workflow.state` show stale values.

## 4. Reviewer resolution and permissions

- `GetUserTeamsUseCase` (`features/internal/GetUserTeams/GetUserTeamsUseCase.ts:6-38`) calls api-core `ListUserTeamsUseCase`, maps to `[{id}]`, caches per userId for the request. Failures return `[]` silently.
- `enrichStep` (`WorkflowState.ts:368-407`) per current identity:
  - Creator gets all flags false: requester never reviews own content.
  - `isOwner = step.savedBy?.id === identity.id`.
  - `canReview` = step teams intersect user's teams.
  - `canTakeOver = canReview && !!step.savedBy?.id && step.state === inReview && !isOwner`.
  - Guards in `domain/workflowState/guards/*.ts` read these flags. No users, roles or explicit assignment.
- Permission checks:
  - Create/update/delete workflow and list notification types require `workflows` permission with `name === "*"` or `editor: true`. `ensureManageAccess` is copy-pasted in `CreateWorkflowUseCase.ts:52-67`, `UpdateWorkflowUseCase.ts:54-69`, `DeleteWorkflowUseCase.ts:57-72`, `ListNotificationTypesUseCase.ts:31-46`.
  - `GetWorkflowUseCase` only rejects anonymous (`:33-39`). `ListWorkflowsUseCase` has no check.
  - Workflow-state get, getTarget, list, create, cancel, delete have no permission check. Only domain guards on start/approve/reject/take-over.
- Lists:
  - `ListOwnWorkflowStatesUseCase.ts:12-37`: `where.createdBy = identity.id`, `values.isActive = true`.
  - `ListRequestedWorkflowStatesUseCase.ts:14-48`: `createdBy_not = identity.id`, `values.isActive = true`, `values.steps.teams.id_in = userTeamIds`. Matches any step naming the user's team, not the current step; does not exclude finished or rejected reviews.
  - `ListWorkflowStatesUseCase.ts:19-72` wraps records in `WorkflowState` and runs `WorkflowStateFilter` (default pass-through; CMS/WB decorators drop states in folders the user cannot read) with a page-accumulating loop. Pagination is fragile: each iteration re-requests `requestedLimit`, cursor after slicing can skip items, `totalCount` adjusted only by filtered items seen.

## 5. GraphQL schema

Everything under `Query.workflows` / `Mutation.workflows`. Responses mostly `{data, error: WorkflowError, meta?}`; exception `ListWorkflowNotificationTypesResponse { data, error: WorkflowNotificationTypeError }`, no meta (`graphql/notifications.ts:7-22`).

- Workflow types (`graphql/workflows.ts:15-125`): `WorkflowStepInput {id!,title!,color!,description,teams!,notifications}` (`:30-37`), `StoreWorkflowInput {name, steps}`, `Workflow {id,app,name,steps}`, `ListWorkflowsWhereInput {app, app_in, id, id_in}`, responses. `CreateWorkflowResponse` unused.
- Queries:
  - `listWorkflows(where, limit, sort, after)`, `getWorkflow(app, id)` (maps any failure to `NotFoundError`, `:161-165`).
  - `listWorkflowNotificationTypes` (`graphql/notifications.ts:24-26`).
  - `getWorkflowState(id)`, `getTargetWorkflowState(app, targetRevisionId)` (null when not found, TODO at `workflowState.ts:275-281`), `listWorkflowStates`, `listOwnWorkflowStates`, `listRequestedWorkflowStates` (`workflowState.ts:191-213`).
- Mutations:
  - `storeWorkflow(app, id, data)`: upsert via get then create/update (`StoreWorkflowUseCase.ts:14-34`).
  - `deleteWorkflow(app, id)`.
  - `createWorkflowState(app, targetRevisionId, title)`; zod requires title min 5 chars with message "Title is required." (`validation/createWorkflowState.ts:6`).
  - `startWorkflowStateStep(id)`, `approveWorkflowStateStep(id, comment)`, `rejectWorkflowStateStep(id, comment!)`, `cancelWorkflowState(id): Boolean`, `takeOverWorkflowStateStep(id)` (`workflowState.ts:215-226`).
- State types (`workflowState.ts:29-189`): `enum CmsEntryStateValue`, `CmsEntrySystemWorkflow`, `extend type CmsEntrySystem { workflow }` + where inputs, `WorkflowStateStep` (step fields + `state`, `comment`, `savedBy`, `canReview`, `isOwner`, `canTakeOver`), `WorkflowState` (record + `done`, `currentStep!`, `nextStep`, `previousStep`, `targetContext: JSON`).
- CMS endpoint copy: `CmsEntrySystemWorkflow` with `state: String` (`/packages/api-headless-cms-workflows/src/graphql/entrySystemSchema.ts`). WB adds `extend type WbPage { system: CmsEntrySystem }`.
- Mismatches:
  - List resolvers wrap the whole validated `where` into `where.values` (`workflowState.ts:301-308, 330-337, 359-366`). `CmsWhereMapper` passes `values` through (`/packages/api-headless-cms/src/features/whereMapper/WhereMapper.ts:76-86`). Verified broken: filtering by `createdBy`, `savedBy`, `createdOn_gte/lte`, `savedOn_gte/lte` throws `FIELD_ERROR` (DDB `There is no field with the field path "values.createdBy"`, `/packages/api-headless-cms-storage/src/handlers/objectFilterCreateHandler.ts:37-40`; OpenSearch `There is no field "values.createdBy"`, `/packages/api-headless-cms-utils-os/src/features/CmsEntryOpenSearchFilter/fields/ObjectFilter.ts:33-36`). Absent keys are skipped; root `createdBy`/`createdBy_not` injected by ListOwn/ListRequested is fine. Tests filter only model fields, so CI misses it.
  - `ListWhereInputCmsEntrySystemWorkflowInput.state` is typed as an input object (`ListWhereInputCmsEntrySystemWorkflowStateInput`), not the enum (`workflowState.ts:47-59`).
  - zod `listWorkflowStatesValidation` omits `steps`, `teams`, `notifications`; those GraphQL filters are stripped silently.

## 6. Notifications

- Exists: `NotificationTransport` `{id, title, send({users, message: {title, body, url}})}` (`features/notifications/NotificationTransport/abstractions.ts:8-32`); `MailNotificationTransport` (`id: "e-mail"`, BCC via `MailerService`, console errors); `ListNotificationTypesUseCase`; step `notifications: [{id}]`; message abstractions `NotificationTypeMessageOn{RequestReview, RequestReviewCancel, ReviewStepStart, ReviewStepApprove, ReviewReject, ReviewApprove}` (`domain/notifications/abstractions.ts:9-92`).
- Missing: nothing calls `send()`, no message implementations, no recipient resolution (team members to emails).

## 7. Step type, automation, AI, assignee

- None exist. Only `type` field is `IWorkflowStateIdentity.type`.
- Step shape `{id,title,color,description,teams,notifications}` repeated in 5 places: workflow model, state model, GraphQL input/output, zod `stepValidation`, TS interfaces. Required-ness differs between models.
- Human-only state machine: pending → inReview (manual start sets owner) → approved/rejected.
- `aiPowerups.*` flags exist (`/packages/feature-flags/src/FeatureFlags.ts`), unused by workflows.
- Natural hook points: `WorkflowState.start`, `approve`, `getPendingStep`; next-step transition in `approve()` (`:271-275`); unused `startStep` / `approveStep` events.

## 8. Extension points for integrations

- `WorkflowStateContextProvider` (`features/workflowState/CreateWorkflowState/WorkflowStateContextProvider.ts`): default `{}`; CMS `{folderId, modelId}`, WB `{folderId}`. Stored as `targetContext`.
- `WorkflowStateFilter` (`features/workflowState/ListWorkflowStates/WorkflowStateFilter.ts`): default pass-through; CMS/WB apply folder-level read checks on `targetContext.folderId`.
- Domain event handlers (section 3).
- App naming `cms.<modelId>`, `wb.page`. Details in `integrations.md`.

## 9. Tests

- `__tests__/`: `WorkflowUseCases.test.ts`, `WorkflowStateUseCases.test.ts`, `WorkflowMapper.test.ts`, `graphql/{workflows,workflowStates}.test.ts`, `*.validation.test.ts`, `validation/{step,workflow}.test.ts`, `mocks/workflow.ts`.
- Harness `__tests__/__helpers/handler.ts`: `createCmsTestHandler` from `@webiny/api-headless-cms-testing`, `setup` registers `WorkflowsFeature` and decorator `GetUserTeamsTestMock` (returns identity `teams` or `FULL_ACCESS_TEAM_ID`, `:58-82`). Permission `{name:"*"}`.
  - Two near-identical factories: `createContextHandler`, `createGraphQLHandler`.
  - `createWorkflowState` built with `createQuery` instead of `createMutation` (`handler.ts:153-156`); query named `GET_WORKFLOW_STATE_MUTATION`.
- Covered: create, get, list, approve and progression, reject, multiple states after deactivation, wrong-team denial, own lists, take-over.
- Not covered: notifications, events, `listRequested` via GraphQL beyond basics, permissions on state operations.
- Integration tests: `/packages/api-headless-cms-workflows/__tests__`, `/packages/api-website-builder-workflows/__tests__/wbPageSystem.test.ts`.
- Run: `yarn test packages/api-workflows`; storage variants `test:ddb`, `test:os`. `ci.config.json` runs `["ddb", "ddb-os,ddb"]`.
- Licence in tests: `createCmsTestHandler` loads `params.testProjectLicense ?? createTestWcpLicense()` (`/packages/api-headless-cms-testing/src/createCmsTestHandler.ts:93-98`), which enables `APW = "advancedPublishingWorkflow"` (`/packages/wcp/src/testing/createTestWcpLicense.ts:33-35`, `/packages/wcp/src/types.ts:58`). `License.canUseWorkflows()` (`/packages/wcp/src/License.ts:108-110`). No feature-flag config involved.

## 10. Code smells and refactor candidates

1. Double registration (section 1). CMS local feature also named `"CmsWorkflows"` and exported as `WorkflowsFeature`.
2. State transitions bypass the update use case; sync handlers never fire for them. Cancel emits two events. Wants one "save state" path.
3. Authorization scattered and mostly missing; `ensureManageAccess` duplicated 4×; `editor` permission shape ad hoc.
4. Error naming:
   - `MultipleWorkflowsFoundError` reused for "multiple active states" (`GetTargetWorkflowStateRepository.ts:50-57`).
   - "Not in review" is `WorkflowStateNotAuthorizedError` in approve/takeOver but `WorkflowStateNotInReview` in reject; the latter receives the aggregate where a record is expected (`WorkflowState.ts:287-290`).
   - Use-case error unions list errors never returned.
5. Inconsistent `index.ts` exports (some Event only, some Handler, some `export *`). Feature names follow no convention (`Workflows/…`, `WorkflowState/…`, `workflows.internal.getUserTeams`, `WorkflowNotifications/…`).
6. Step shape defined five times with differing required-ness.
7. Leftovers: old context-plugin comment (`StoreWorkflow/abstractions.ts:13`), unused `CreateWorkflowResponse`, unused `record.comment`, `"RecordWorkflow State"` typo, `UpdateWorkflowUseCaseImpl.execute` signature differs from interface, `id` inside mapper values.
8. One workflow per app enforced only at review creation, not at store. Ids caller-chosen.
9. Lifecycle gaps: deleting a workflow orphans its states and breaks Update/Cancel/DeleteTarget (`WorkflowNotFoundError`); DeleteTarget only finds active states; delete repository swallows failures; rejected states stay active; next step never auto-starts.
10. Query issues: system fields pushed into `values`; nested filters stripped by zod; `listRequested` matches any step; fragile pagination.
11. `GetUserTeams` test mock depends on identity `teams`; production silently maps failures to `[]`.
12. Event payloads carry the mutable, identity-relative aggregate; other packages import `domain/workflowState/WorkflowState.js` directly.

Everything is DI-native. Remaining plugin-style code is in the CMS integration (`CmsGraphQLSchemaPlugin` in `entrySystemSchema.ts`) and `addLegacyResolvers` in the WB schema factory.
