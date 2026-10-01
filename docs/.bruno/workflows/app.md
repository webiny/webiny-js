# Workflows: admin UI (app-workflows)

Discovery notes for `packages/app-workflows` (about 7.3k LOC, 192 files, no tests) and how the CMS and WB admin packages consume it. Snapshot of 2026-10-01.

Path roots:

- `[AW]` = `packages/app-workflows/src`
- `[CMS]` = `packages/app-headless-cms-workflows/src`
- `[WB]` = `packages/app-website-builder-workflows/src`
- `[API]` = `packages/api-workflows/src`

Nothing related to step types, assignees, automation or AI exists in the UI today.

## 1. Layout, entry points, registration, gating

- Layout:
  - `domain/`: MobX models, an event, the permission schema.
  - `features/<useCase>/`: `abstractions.ts`, Gateway, UseCase, `feature.ts` per use case.
  - `presentation/<area>/`: presenter, `abstractions.ts`, `feature.ts`, `use*` hook, components. Areas: `workflowsEditor`, `workflowState`, `workflowStateList`, `workflowStatesWidget`, `shared`, `permissions`.
  - `routes.ts`, `types.ts`, `hooks/canUseWorkflows.ts`.
- Dependencies: @webiny/admin-ui, app, app-admin, feature, form, utils, validation, mobx, mobx-react-lite. No Apollo.
- Mounting: `packages/app-serverless-cms/src/Admin.tsx:56-58` renders `<WorkflowsAdminApp/>`, `<CmsWorkflows/>`, `<WebsiteBuilderWorkflows/>`.
- `WorkflowsAdminApp` (`[AW]/app.tsx:12-31`):
  - Gated by `featureFlags.isEnabled("advancedPublishingWorkflow")`, tied to licence via `l.canUseWorkflows()` (`packages/project/src/decorators/GetFeatureFlagsWithLicense.ts:9`).
  - Registers WorkflowsPermissionsFeature, WorkflowsFeature and four presenter features via `<RegisterFeature>`.
  - Renders `<SecurityPermissions/>` and `<ContentReviews/>`.
  - Both consumer packages apply the same gate (`[CMS]/index.tsx:17-21`, `[WB]/index.tsx:9-13`).
- Public API (`[AW]/index.tsx`):
  - Hooks/types: `useCanUseWorkflows`, `useWorkflowState`, `useWorkflowsPermission`, `IWorkflowApplication`, `IWorkflowState`, `WorkflowStateValue`.
  - All feature objects, plus `WorkflowStatePresenter`.
  - `Components` (30-54): `ContentReview.{WorkflowStateTooltip, WorkflowStateOverlay, WorkflowStateBar}`, `Permissions.HasWorkflowsEditorPermission`, `Admin.WorkflowsEditor`, `Overlay.WorkflowStateListAppOverlay`, `Widget.{OwnWidget, RequestedWidget}`, `List.Options.OpenInNewWindow`.
  - Consumers deep-import `domain/events.js`, `types.js`, `presentation/workflowState/feature.js`, `abstractions.js`. Those paths are effectively public.
- Routes, menus, widgets, permissions:
  - Route `Workflows/ContentReviews` at `/workflows/content-reviews`, params `type?: "own"|"requested"`, `state?: WorkflowStateValue` (`[AW]/routes.ts:4-17`).
  - `[AW]/presentation/ContentReviews.tsx:12-44`: route with AdminLayout around `WorkflowStateListView`, `WorkflowsMenu` (`workflowStateList/components/WorkflowsMenu.tsx:13-28`, menu `workflows.contentReviews`), dashboard widgets `workflows.requested` and `workflows.own`.
  - Permissions: `createPermissionSchema({prefix:"workflows", fullAccess:{editor:true}})` (`[AW]/domain/permissionsSchema.ts:3-6`), shown via `Security.Permissions` (`presentation/permissions/SecurityPermissions.tsx:11-17`).
  - Workflow editors are routed by consumers, not here.
  - Settings menu pattern for a tenant exclusion-list page: `Menu parent="settings"` + `Menu.Group` (`packages/app-admin/src/modules/AccessManagementExtension.tsx:143-160`, `packages/app-admin/src/base/Base/Menus.tsx:25-44`).

## 2. Architecture pattern

One consistent pattern, no legacy hooks or Apollo:

- DI: `@webiny/feature/admin` `createAbstraction` / `createFeature`, `X.createImplementation({implementation, dependencies})`.
- Gateways call `MainGraphQLClient` (`@webiny/app/features/mainGraphQLClient/abstractions.js`).
- Use cases are pure passthroughs to gateways (e.g. `features/storeWorkflow/StoreWorkflowUseCase.ts:7-13`). All 12 identical in shape.
- Presenters: MobX `makeAutoObservable` classes with a `vm` getter, `.inSingletonScope()`, resolved through `useFeature(Feature).presenter`.
- Views are `observer` components.
- Domain: MobX models with snapshot-based `dirty` (`domain/WorkflowModel.ts:8-21`).
- Events: `WorkflowStateChangedEvent` / `WorkflowStateChangedHandler` (`domain/events.ts:5-26`) via `EventPublisher`.
- Extensibility: `makeDecoratable` components (`WorkflowStateBarComponent`, `WorkflowStateOptionsOpenInNewWindow`).

Features (`features/feature.ts:15-31`): ListWorkflows, StoreWorkflow, DeleteWorkflow, GetTargetWorkflowState, RequestReview, StartStep, ApproveStep, RejectStep, TakeOverStep, CancelWorkflowState, ListWorkflowStates, ListNotificationTypes.

Mixed-style leftovers:

- Permissions on two systems: DI `WorkflowsPermissions` abstraction + feature (`features/permissions/abstractions.ts:5`, `feature.ts:5-8`), registered but never consumed; legacy `useSecurity().getPermission("workflows")` (`presentation/permissions/useWorkflowsPermission.ts:23-40`), actually used.
- Step editor uses `@webiny/form` `<Form>/<Bind>` + `@webiny/validation`; dialogs use ad-hoc `useState` validation.
- `@webiny/app` `<Plugins>` mounted inside `WorkflowStateBar` render (`workflowState/components/Bar/WorkflowStateBar.tsx:53-63`).

## 3. Workflow editor

- `WorkflowsEditor` (`workflowsEditor/components/WorkflowsEditor.tsx:5-11`): wrapped in `HasWorkflowsEditorPermission`, renders `WorkflowsEditorBase`.
  - Props `{ apps: IWorkflowApplication[]; app: string|null|undefined; onAppClick(id) }` (`WorkflowsEditorBase.tsx:17-21`).
  - SplitView: `WorkflowsDataList` (app list with client-side search, `DataList/WorkflowsDataList.tsx:15-59`) + `SimpleForm` with `WorkflowEditor` (`WorkflowsEditorBase.tsx:45-64`). Footer is empty (57-59), no global Save.
- `WorkflowEditor` (`Editor/WorkflowEditor.tsx:21-31`): `presenter.init({app, defaultWorkflow})` on app change. `createDefaultWorkflow` sets `id: mdbid()`, `name:"Default Workflow"`, `steps: [] as unknown as NonEmptyArray` (12-19).
- `WorkflowsEditorPresenter` (`workflowsEditor/WorkflowsEditorPresenter.ts`):
  - `init` (61-90) loads notification types and `listWorkflows({where:{app}})` in parallel, falls back to default, wraps in `WorkflowModel`.
  - Only `_workflows[0]` used (49, 92-94). View comment mentions multiple workflows per app (`WorkflowEditorView.tsx:26-28`).
  - Save: every add/update/remove/move mutates the model and calls `updateWorkflow`, which fires `storeWorkflowUseCase.execute(...)` without await (96-105, 118-182). Error only sets `_error`. No loading state, no rollback, response not applied back.
  - Removing the last step deletes the workflow (130-138). Move swaps array entries (146-182).
  - VM (`abstractions.ts:36-44`): `{dirty, workflows, notifications, workflow, loading, error, app}`.
- Steps UI (`Editor/WorkflowEditorSteps.tsx:26-56`): locked pseudo-steps "Draft" and "Published" via `InactiveStep` (13-24); one `Step` per step in between; `NewStep` at the end.
- `Step` (`Editor/Step/Step.tsx:46-209`):
  - `<Form<IWorkflowStep> data={step} onSubmit>`. Edit mode: Card with Cancel/Save. Read mode: Accordion item with move up/down/remove.
  - Fields: `StepFormTitle` (required), `StepFormColor` (required ColorPicker), `StepFormDescription`, `StepFormTeams`.
  - `StepFormNotifications` commented out (13, 58, 148-150); component `Form/StepFormNotifications.tsx` is a required CheckboxGroup.
  - Snackbar "Workflow saved successfully." shown before the async store resolves (100-107).
- `NewStep` (`Editor/Step/NewStep.tsx:14-23`): `{id: generateAlphaNumericId(), title:"", description:"", color:"#E28743", teams: [] as unknown as NonEmptyArray, notifications: []}`.
- Teams selector (`Form/StepFormTeams.tsx:14-47`): `<Bind name="teams" validators={validation.create("required,minLength:1")}>` with `TeamsMultiAutocomplete` from app-admin (`packages/app-admin/src/components/TeamsMultiAutocomplete/index.tsx:14-50`, backed by `TeamsAutocompletePresenterFeature`). Maps `{id}[]` to `string[]`.
- No user picker exists in app-admin. Only cognito-specific lists (`packages/cognito/src/admin/features/users/listUsers/ListUsersGateway.ts`) and ACO `UsersTeamsMultiAutocomplete` with options as props (`packages/app-aco/src/dialogs/DialogSetPermissions/UsersTeamsMultiAutocomplete.tsx`). Manual reviewer picker and user-target rules need a new users source.
- Validation: client Bind validators only; server zod `stepValidation` (`[API]/graphql/validation/step.ts:5-37`) requires id, title, color, at least one team.
  - Error UI (`Editor/Error/WorkflowError.tsx`, `FormattedError.tsx`) expects `error.data.invalidFields`, but gateways throw `new Error(message)`. Field list always empty.
- Key types (`[AW]/types.ts:28-51`):

  ```ts
  export interface IWorkflowStep { id: string; title: string; color: string; description?: string;
      teams: NonEmptyArray<IWorkflowStepTeam>; notifications?: IWorkflowStepNotification[]; }
  export interface IWorkflow { id: string; app: string; name: string; steps: NonEmptyArray<IWorkflowStep>; }
  ```

  The 6 fields are hand-copied in `WorkflowStepModel` (`domain/WorkflowStepModel.ts:5-39`), `WorkflowStateStepModel` (`domain/WorkflowStateStepModel.ts:5-62`), `WORKFLOW_FIELDS` (`features/graphqlFields.ts:72-88`), `WORKFLOW_STATE_STEP_FIELDS` (`features/graphqlFields.ts:13-34`). Every new step field needs adding in all of them plus API input and type.

## 4. Content review flows

- State types (`[AW]/types.ts:53-95`):

  ```ts
  export enum WorkflowStateValue { pending="pending", inReview="inReview", approved="approved", rejected="rejected" }
  export interface IWorkflowStateStep extends IWorkflowStep { state: WorkflowStateValue; comment: string|null|undefined;
      savedBy: IIdentity|null|undefined; canTakeOver: boolean; canReview: boolean; isOwner: boolean; }
  export interface IWorkflowState { id; title; isActive; app; targetId; targetRevisionId; comment; state; steps;
      createdBy: IIdentity; savedBy: IIdentity; createdOn; savedOn; currentStep; nextStep; previousStep; }
  ```

  `targetContext` is queried (`graphqlFields.ts:43`) but missing from the type.
- `WorkflowStatePresenter` (`workflowState/WorkflowStatePresenter.ts`), one singleton for the open entry or page:
  - `init(app, targetRevisionId, title)` (131-178): `listWorkflows({where:{app}})`; none means `hasWorkflow=false`; else `getTargetWorkflowState`.
  - `requestReview`, `start`, `approve(comment?)`, `reject(comment)`, `cancel`, `takeOver` (206-334) all: set `_executing`, call use case, `setState`, `publishStateChanged`. `start`, `approve`, `reject`, `takeOver` then open `"<x>:success"` (`:237, 258, 279, 321`); `requestReview` and `cancel` set `_dialog = null` (`:216, 300`). Failures set `_error` with `code:null`. `_error` is cleared only in `init` (`:138`), never before an action.
  - `canCancel` = owner, no `previousStep`, not approved or rejected (91-103). `isOwner` compares `createdBy.id` with `IdentityContext` (83-89).
  - Dialog is an object `IWorkflowStatePresenterViewModelDialog { type; step?: IWorkflowStateStep | null }` (`abstractions.ts:30-44`). `type` is `"cancelReview"|"requestReview"|"start"|"start:success"|"approve"|"approve:success"|"reject"|"reject:success"|"comment"|"takeOver"|"takeOver:success"`. `comment` carries `step` (`WorkflowStatePresenter.ts:365`).
  - VM (`abstractions.ts:46-66`) adds `hasWorkflow`, `hasState`, `isApproved`, `isRejected`, `isPending`, `isInReview`, `lastApprovedStep`, `lastRejectedStep`, `nextStep`, `canCancel`, `executing`.
- State bar (`workflowState/components/Bar/`):
  - `WorkflowStateBar.tsx:38-73` renders the dialog switch (`WorkflowStateBarDialogs.tsx:18-46`) and decorators of `WorkflowStateBarComponent` (`makeDecoratable`, `WorkflowStateBarComponent.tsx:15-35`). Decorator order in `<Plugins>` (54-62) matters.
  - One decorator per state in `Bars/`:
    - `WorkflowStateBarRequestReview.tsx:13-28`: no state; "Request Review" opens dialog.
    - `WorkflowStateBarCancelReview.tsx:11-27`: owner can cancel.
    - `WorkflowStateBarStartReview.tsx:11-29`: pending; with `canReview`, "Start Review" calls `presenter.start` directly.
    - `WorkflowStateBarReview.tsx:17-63`: in review; non-owner sees "Take Over" alert naming `step.savedBy`; owner sees Approve/Reject.
    - `WorkflowStateBarApproved.tsx`, `WorkflowStateBarRejected.tsx`: "Remove Review Request" (DeveloperMode only) and "View Comment" (always). Rejected bar is gated on `vm.lastRejectedStep`, not `isRejected` (`WorkflowStateBarRejected.tsx:11-14, 22-32`).
    - `WorkflowStateBarLoading.tsx`, `WorkflowStateBarError.tsx`, `WorkflowStateBarWorkflow.tsx`.
  - Assignee today is `step.savedBy` (whoever started or last acted). Display text at `WorkflowStateBarReview.tsx:25-26` and `Bar/Dialogs/TakeOverDialog.tsx:17`.
- Dialogs:
  - Base dialogs in `[AW]/presentation/shared/dialogs/`:
    - `RequestReviewDialog.tsx:11-50`: confirmation only, `{onRequestReview(), hide(), loading}`. No inputs. Home for the manual reviewer picker.
    - `ApproveDialog.tsx:13-66` (optional comment), `RejectDialog.tsx:15-108` (required, min 10 chars), `StartDialog.tsx`, `TakeOverDialog.tsx`, `CancelReviewDialog.tsx`, `CommentDialog.tsx:45-65`.
    - Success dialogs link to the list via `YouCanTrackAllContentReviewsHere.tsx`.
  - Two adapter sets over the base dialogs: Bar adapters taking `presenter` (`workflowState/components/Bar/Dialogs/*.tsx`), Widget adapters taking `state` (`workflowStatesWidget/components/Dialogs/*.tsx`).
- Comments: one per step (`step.comment`), set on approve/reject. Shown in `CommentDialog` and tooltip (`Tooltip/WorkflowStateTooltipContent.tsx:13-52`). No thread. `IWorkflowState.comment` unused in UI.
- Tooltip/overlay: `WorkflowStateTooltip` (`Tooltip/WorkflowStateTooltip.tsx:14-53`) popover per step; `WorkflowStateOverlay` (`Overlay/WorkflowStateOverlay.tsx:18-24`) render-prop.
- Content reviews list page (`workflowStateList/`):
  - `WorkflowStateListPresenter.ts:13-121`: `list`, `filterBy`, `nextPage`, `setType("all"|"own"|"requested")`, forced `limit:50`, `where.isActive=true` (39-51).
  - `WorkflowStateList.tsx:11-97`: DataTable columns Title, Submitted By, Modified By, Last Modified, Workflow, Status, options.
  - `WorkflowStateListFilters.tsx:7-62`: state and type segmented controls ("My Content Reviews" = own, "I Can Access" = requested).
  - `WorkflowStateListOptions.tsx:10-14` passes no handlers, so only "Open in new window". No actions, no assignee column, no pagination on the page; overlay has infinite scroll (`Overlay/WorkflowStateListAppOverlayView.tsx:18-24`).
  - `WorkflowStateListAppOverlay.tsx:19-48` is the per-app overlay used by CMS and WB.
- Dashboard widgets (`workflowStatesWidget/`):
  - `WorkflowStatesWidgetPresenter.ts:28-269`: `init({type, states})`, one list query per state, `limit:5`. Optimistic `moveStepBetweenStates`, `adjustTotal` (122-147).
  - VM uses separate `showXDialog: IWorkflowState|null` fields (`abstractions.ts:14-30`) instead of a dialog union.
  - `WorkflowStatesOwnWidget.tsx` ("assigned by me") and `WorkflowStatesRequestedWidget.tsx` ("assigned to me", pending and inReview).
  - Row option visibility (`shared/Options/OptionItem/*.tsx`): Approve/Reject need `inReview && canReview && isOwner`; Start needs `pending && canReview`; TakeOver needs `canTakeOver`.

## 5. GraphQL operations

All under `workflows { ... }`. Fragments in `[AW]/features/graphqlFields.ts`.

| UI gateway (`[AW]/features/...`) | Operation | API |
|---|---|---|
| `listWorkflows/ListWorkflowsGateway.ts:18-31` | `listWorkflows(where,limit,sort,after)`, always `createdOn_DESC` | `[API]/graphql/workflows.ts:97-103,173` |
| `storeWorkflow/StoreWorkflowGateway.ts:15-28` | `storeWorkflow(app,id,data:{name,steps})` | `workflows.ts:39-42,123,195` |
| `deleteWorkflow/DeleteWorkflowGateway.ts:16` | `deleteWorkflow(app,id)` → Boolean | `workflows.ts:124,221` |
| `listNotificationTypes` | `listWorkflowNotificationTypes{data{id title}}` | `[API]/graphql/notifications.ts:24-35` |
| `getTargetWorkflowState` | `getTargetWorkflowState(app,targetRevisionId)` | `[API]/graphql/workflowState.ts:194` |
| `listWorkflowStates/ListWorkflowStatesGateway.ts:21-79` | `listWorkflowStates`, `listOwnWorkflowStates`, `listRequestedWorkflowStates` | `workflowState.ts:195-212` |
| `requestReview/RequestReviewGateway.ts:18-31` | `createWorkflowState(app,targetRevisionId,title)` | `workflowState.ts:216-220` |
| `startStep` | `startWorkflowStateStep(id)` | `:221` |
| `approveStep` | `approveWorkflowStateStep(id,comment?)` | `:222` |
| `rejectStep` | `rejectWorkflowStateStep(id,comment!)` | `:223` |
| `cancelWorkflowState` | `cancelWorkflowState(id)` → Boolean | `:224` |
| `takeOverStep` | `takeOverWorkflowStateStep(id)` | `:225` |

Unused by the UI: `getWorkflow`, `getWorkflowState`, `WorkflowState.done/workflowId`, `savedOn` sort, date and `workflowId` filters (`workflowState.ts:153-174`).

## 6. Consumer contract

CMS and WB rely on: `useWorkflowState().presenter` (`init`, `dispose`, `vm.hasWorkflow/hasState/isApproved`), `WorkflowStatePresenter` as DI dependency, `WorkflowStateChangedHandler`, `Components.*`, `WorkflowStateValue`, `IWorkflowApplication`, `useCanUseWorkflows`, and the `system.workflow` shape `{workflowId, stepId, stepName, state}`. Details in `integrations.md`.

## 7. Bugs

All verified against code.

1. `useCanUseWorkflows()` returns `{canUseWorkflows}` (`hooks/canUseWorkflows.ts:8-10`), but `WorkflowsEditorBase.tsx:28,37`, `WorkflowStatesOwnWidget.tsx:9,24`, `WorkflowStatesRequestedWidget.tsx:9,19` test `!obj`. Always false; "no access" alerts are dead. Redundant anyway: all three mount only behind the same flag gate.
2. `WorkflowStatesWidgetPresenter` is a singleton (`workflowStatesWidget/feature.ts:8`); `useFeature` is `useMemo(() => feature.resolve(container))` (`packages/app/src/shared/di/useFeature.ts:8`), so both dashboard widgets get the same instance in the tenant container.
   - `_type` and `_states` overwritten by the last `init` (`WorkflowStatesWidgetPresenter.ts:84-85`).
   - `_values` keyed only by state, so "own" and "requested" results for `pending`/`inReview` overwrite each other; last response wins (`:107`).
   - Both cards render the same tabs; "View All" uses one shared `vm.type` (`WorkflowStatesWidgetCard.tsx:70`).
   - Both cards render every `showXDialog`, so each dialog opens twice, stacked (`WorkflowStatesWidgetCard.tsx:31-54`).
   - List presenter is also a singleton (`workflowStateList/feature.ts:8`): `_type` set on the page (e.g. "own") leaks into the per-app overlay because `list()` never resets it (`WorkflowStateListPresenter.ts:18, 39-51`; `WorkflowStateListAppOverlay.tsx:36-40`).
3. Gateway response types declare only `error: { message }` and throw `new Error(error?.message ...)`, dropping `code`/`data` already requested by `ERROR_FIELDS` (`graphqlFields.ts:1-5`; e.g. `StoreWorkflowGateway.ts:10,49`, `ApproveStepGateway.ts:13,45`). Presenters set `code: null`.
   - `WorkflowStateBarError.shouldRenderOriginal` returns true on `!error?.code`, so its alert never renders (`Bars/WorkflowStateBarError.tsx:11-16`).
   - `FormattedError` always shows empty fields (`FormattedError.tsx:31`).
   - Nothing else reads the bar presenter's `vm.error`; action errors are silent.
   - Widgets never read `vm.error` / `vm.actionError` either (`WorkflowStatesWidgetPresenter.ts:32-34, 116, 167`).
4. `RemoveStep.tsx:28` `onClick={close}`: `close` is undefined locally (`useToggler` gives `on, toggle, toggleOn`, `:14`), so it resolves to `window.close`. Low impact: dialog still closes via `DialogClose` (`admin-ui/src/Dialog/components/CancelAction.tsx:8`); would close a script-opened window.
5. Editor save fire-and-forget; only `.catch` sets `_error` (`WorkflowsEditorPresenter.ts:96-105`). Snackbar synchronous (`Step.tsx:104`). `WorkflowModel.snapshot` is `private readonly`, set in constructor only (`domain/WorkflowModel.ts:13, 24`), so `dirty` stays true. Nothing reads `vm.dirty`.
6. Approve success dialog shows the wrong step. `approve` calls `setState(data)` before opening the dialog (`WorkflowStatePresenter.ts:257-258`); dialog reads `vm.step = currentStep` (`:111`; `Bar/Dialogs/ApproveSuccessDialog.tsx:12`; widget `workflowStatesWidget/components/Dialogs/ApproveSuccessDialog.tsx:13`). After approving a non-final step, API `currentStep` is the next pending step (`api-workflows/src/domain/workflowState/WorkflowState.ts:121-143, 269-275`), so the dialog says "<next step> Approved". Final step shows correctly. Reject shows correctly.
7. Not a bug, code smell only: `ApproveDialog` passes `required={true}` with "(optional)" in `description` and no `label` (`shared/dialogs/ApproveDialog.tsx:53-58`). `FormComponentLabel` returns null without label text (`admin-ui/src/FormComponent/Label.tsx:28-30`); nothing enforces it.
8. `WorkflowStatePresenter.init` (`:131-178`) has no request token before either `runInAction` (`:149, 165`). A slow response for a previous target overwrites the current one.
9. `WorkflowStateListView` calls `presenter.setType(...)` and `presenter.list(...)` in the same effect (`WorkflowStateListView.tsx:21-26`). Two requests; `setType` uses stale `_listParams` (`WorkflowStateListPresenter.ts:95-98`); last response wins.
10. App search in `WorkflowsDataList` compares `name.toLowerCase().includes(filter)` without lowercasing `filter` (`WorkflowsDataList.tsx:18-22`). Uppercase queries never match.

## 8. Duplication and dead code

- Duplicated "where" type trees (`features/listWorkflowStates/abstractions.ts:4-47`, `presentation/workflowStateList/abstractions.ts:5-48`). Error and invalid-field types copied (`workflowsEditor/abstractions.ts:11-34`, `workflowState/abstractions.ts:5-28`).
- 12 passthrough use cases; identical error `catch` block about 15 times across presenters.
- Two dialog-adapter sets with different dialog-state exposure. Both presenters hold a `_dialog` union internally (widget also `_dialogState`, `WorkflowStatesWidgetPresenter.ts:17-26, 35-36`); the widget VM expands it into eight `showXDialog` fields (`:71-79`).
- Field lists hand-copied across models, fragments, API types.
- `displayName` fallback duplicated, with precedence bug (`"unknown: "+undefined` is always truthy) at `WorkflowStateBarReview.tsx:25-26`, `Bar/Dialogs/TakeOverDialog.tsx:17`. Widget uses another fallback (`Dialogs/TakeOverDialog.tsx:23`).
- Tooltip renders `Tag` inline instead of `TagStep` (`WorkflowStateTooltipContent.tsx:31-35`). State names map duplicated (`WorkflowStatesWidgetCardTabs.tsx:21-26`, `shared/helpers/stateName.ts`).
- CMS hardcodes `cms.${modelId}` (`ContentEntryFormPresenterWorkflowDecorator.ts:48`) instead of `createAppName`.
- Dead: DI `WorkflowsPermissions`; `StepFormNotifications`; bar `StartDialog`; `IWorkflowStateBarProps.children`; `vm.dirty`, `vm.workflows`; `IWorkflowState.comment`; `targetContext` selection; unused consumer routes; sortable columns not wired; default `WorkflowStateOptionsOpenInNewWindow` renders "Implement your decoration..." (`shared/Options/OptionItem/OpenInNewWindow.tsx:13`); stale `dist/` next to `src`.
- Not dead: CMS registers `WorkflowsFeature` + `WorkflowStatePresenterFeature` again (`app-headless-cms-workflows/src/presentation/feature.ts:12-13`); `RegisterFeature` does not dedupe (`app-admin/src/components/RegisterFeature.tsx:20-28`). Second singleton registration of the presenter CMS and the bar resolve. Which registration wins is unverified.

## 9. Design issues for the planned work

- Singleton per-target presenters block concurrent contexts (e.g. reviewer picker opened from the list page).
- One workflow per app hardcoded (`_workflows[0]`, `WorkflowStatePresenter.ts:156`).
- Fixed lifecycle `pending | inReview | approved | rejected`. Automated and AI steps need states like running and failed. Steps without reviewers break `TagState`, Start/Approve/TakeOver option rules and "not in the team" bar text.
- Step editor not type-aware; fields fixed in `Step.tsx:135-151`. Needs a step-type registry or decoratable field slots for assignment config, rule list, manual-selection toggle, AI and check config.
- `requestReview(): Promise<void>` sends only `{app, targetRevisionId, title}` (`requestReview/abstractions.ts:4-8`, `WorkflowStatePresenter.ts:209-213`). Manual selection must thread through dialog, presenter, use case, gateway, mutation.
- No reassign operation or assignee field. List table has no assignee column and no actions.
- No tests in any of the three UI packages.
- Naming inconsistent: Workflow vs WorkflowState vs ContentReview; `WorkflowStateList` exists twice (page and widget); API enum `CmsEntryStateValue` names a generic state; "own"/"requested" vs "assigned by me"/"assigned to me".
