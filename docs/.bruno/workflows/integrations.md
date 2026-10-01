# Workflows: CMS and Website Builder integrations

Discovery notes for `api-headless-cms-workflows`, `app-headless-cms-workflows`, `api-website-builder-workflows` and `app-website-builder-workflows`. Paths are relative to `packages/`. Snapshot of branch `bruno/refactor/workflows-flow` on 2026-10-01.

## 1. What each package registers

### api-headless-cms-workflows

- Entry: `src/index.ts` exports `CmsWorkflowsFeature` (`src/CmsWorkflowsFeature.ts:9-29`), registered at `api-event-handler-core/src/registerApiRequestStack.ts:128`.
- License gate: returns early unless the `advancedPublishingWorkflow` flag is on (`CmsWorkflowsFeature.ts:14`).
- Registers:
  - `EntryWorkflowsFeature` and a local `WorkflowsFeature` (both named "CmsWorkflows").
  - The core `WorkflowsFeature` again (`:20`). The stack already registers it at `registerApiRequestStack.ts:127`, so it is registered twice. `createFeature` does not deduplicate (`feature/src/api/createFeature.ts:18-29`).
  - A `CmsGraphQLSchemaFactory` that adds `CmsEntrySystem.workflow` (`src/graphql/entrySystemSchema.ts:6-15`).
- `EntryWorkflowsFeature` (`src/features/EntryWorkflows/feature.ts:13-27`):
  - `ModelAfterDeleteEventHandler` → `DeleteWorkflowsOnModelAfterDelete`
  - `EntryAfterDeleteEventHandler` → `DeleteWorkflowStateOnEntryAfterDelete` (permanent deletes only, `:12`)
  - `EntryBeforePublishEventHandler` → `ValidateWorkflowStateOnEntryBeforePublish`
  - `EntryBeforeMoveEventHandler` → `BlockMoveOnActiveWorkflowState`
  - Core `WorkflowStateAfterCreateHandler`, `WorkflowStateAfterUpdateHandler`, `WorkflowStateAfterDeleteHandler`, `WorkflowStateCancelHandler` → handlers that write or clear `entry.system.workflow`
  - Decorators: `WorkflowStateContextProvider` → `CmsWorkflowStateContextProvider`; `WorkflowStateFilter` → `CmsWorkflowStateFilter`
- Local `WorkflowsFeature`: `WorkflowBeforeCreateHandler` (`DisallowUnpublishableModelsOnBeforeCreate.ts:5-34`) rejects workflows for models tagged `$publishing:false`.
- Utils: `utils/appName.ts:6-16` (`createWorkflowAppName`, `getModelIdFromAppName`, regex `/^cms\.([a-zA-Z0-9_-]+)$/`), `utils/modelAllowed.ts:4-13` (excludes private and singleton models), `utils/state.ts:4-13` (`getStateValues`).

### api-website-builder-workflows

- Entry: `src/index.ts` exports `WebsiteBuilderWorkflowsFeature` (`src/WebsiteBuilderWorkflowsFeature.ts:6-18`), registered at `registerApiRequestStack.ts:112`. Does not register the core `WorkflowsFeature`; relies on the stack (`:127`).
- Registers `PageWorkflowsFeature` and `WebsiteBuilderPageSchemaFactory` (`src/WebsiteBuilderPageSchemaFactory.ts:14-23`, adds `extend type WbPage { system: CmsEntrySystem }`).
- `PageWorkflowsFeature` (`src/features/PageWorkflows/feature.ts:12-25`) mirrors the CMS set minus the model-delete handler: before-publish, after-delete, before-move, the four core state events, `WbWorkflowStateContextProvider`, `WbWorkflowStateFilter`.
- Utils: `WB_PAGE_APP = "wb.page"` (`utils/appName.ts:1`); `utils/state.ts` copies the CMS `getStateValues`.

### app-headless-cms-workflows

- Entry: `src/index.tsx:16-37` exports `<CmsWorkflows/>`, mounted at `app-serverless-cms/src/Admin.tsx:57`. Same feature flag gate.
- `CmsWorkflowsFeature` (`src/presentation/feature.ts:9-19`):
  - Registers app-workflows `WorkflowsFeature` and `WorkflowStatePresenterFeature` again; `WorkflowsAdminApp` already registers both (`app-workflows/src/app.tsx:22-23`).
  - `ContentEntryFormPresenter` decorator → `ContentEntryFormPresenterWorkflowDecorator`
  - `TableRowMapper` decorator → `TableRowMapperWorkflowDecorator`
  - `ListEntriesGraphQLFieldSelection`, `GetEntryGraphQLFieldSelection` implementations
- `CmsWorkflowsCacheFeature` (`src/features/feature.ts`): `WorkflowStateChangedHandler` → `WorkflowStateCacheHandler`, patches `ContentEntriesCacheProvider`.
- `CmsWorkflowsEditorPresenterFeature`: lists models as workflow "apps" (`src/presentation/cmsWorkflowsEditor/CmsWorkflowsEditorPresenter.ts:21-44`).
- Components: `ListOpenInNewWindow`, `CmsEntriesWorkflowStateListFooterMenu`, `CmsWorkflowsEditor` (route `/cms/workflows`), `ContentEntryFormWorkflow`, `CmsEntryFormTooltipButton`, `CmsEntryFormScheduleMenuItemAction`, `CmsEntryFormCreateNewRevisionButton`.

### app-website-builder-workflows

- Entry: `src/index.tsx:8-25` exports `<WebsiteBuilderWorkflows/>` (`Admin.tsx:58`).
- Features: `PageListWorkflowsFeature` (`ListPagesGraphQLFieldSelection` + `TableRowMapper` decorator), `PageGetWorkflowsFeature` (`GetPageGraphQLFieldSelection`).
- Components: `WebsiteBuilderWorkflowsMenu` (route `/website-builder/workflows`), `PageEditorConfig`, `PagesList`, `ListOpenInNewWindow`.
- Does not register `WorkflowsFeature` or `WorkflowStatePresenterFeature`; relies on `WorkflowsAdminApp` (or the CMS app).
- No `WorkflowStateChangedHandler`, so the pages-list cache is not patched after a workflow action.

## 2. How a workflow is bound to content

- The "app" string identifies the target type: CMS `cms.<modelId>`, WB constant `"wb.page"` for all pages.
- One workflow per app. `CreateWorkflowStateUseCase` lists workflows `where:{app}` with `limit:1` and fails with `MultipleWorkflowsFoundError` when `totalCount > 1` (`api-workflows/src/features/workflowState/CreateWorkflowState/CreateWorkflowStateUseCase.ts:45-77`). Client `WorkflowStatePresenter.init` takes `workflows[0]` (`app-workflows/src/presentation/workflowState/WorkflowStatePresenter.ts:147-156`).
- Steps are copied into the state at creation: `steps: workflow.steps.map(...)` (`CreateWorkflowStateUseCase.ts:118-123`).
- Client sends `createWorkflowState(app, targetRevisionId, title)` (`api-workflows/src/graphql/workflowState.ts:217-221`). Server requires a versioned revision id (`CreateWorkflowStateUseCase.ts:36-43`).
- Stored record (`api-workflows/src/domain/workflowState/abstractions.ts:25-43`):

  ```ts
  interface IWorkflowStateRecord { id; app; title; workflowId; targetId; targetRevisionId; isActive;
    comment; state; steps; createdOn; savedOn; createdBy: IWorkflowStateIdentity; savedBy; targetContext: GenericRecord }
  ```

  `targetContext` is a `fields.json()` field (`stateModel.ts:42`).
- Active state lookup: `GetTargetWorkflowStateRepository` filters `{app, targetRevisionId, isActive:true}` (`GetTargetWorkflowStateRepository.ts:24-32`).
- `targetRevisionId` is the revision id (`entryId#000N`) for both CMS entries and WB pages (WB pages are CMS entries).
- Denormalised copy: handlers write `system.workflow = {workflowId, stepId, stepName, state}` onto the entry or page (`api-headless-cms-workflows/src/utils/state.ts:4-13`; `ICmsEntryWorkflowState` in `api-workflows/src/types.ts:3-8`). CMS uses `updateEntry.execute(..., {skipValidation:true})` (`UpdateEntryOnWorkflowStateAfterCreate.ts:31-36`); WB uses `updatePage.execute(...)` (`UpdatePageOnWorkflowStateAfterCreate.ts:20-24`).

## 3. Publish blocking while a review is in progress

### API

- CMS `ValidateWorkflowStateOnEntryBeforePublish.ts:12-49`: no active state (any lookup failure) allows publish; `state.done` clears `entry.system.workflow` and allows publish; otherwise throws `WORKFLOW_STATE_NOT_COMPLETED`. `done` means every step approved (`WorkflowState.ts:102-112`).
- WB `ValidateWorkflowStateOnPageBeforePublish.ts:11-45`: only the `Workflows/State/NotFound` failure returns early. Other failures fall through to `stateResult.value` (`:19-28`), which throws a plain `Error("Tried to get value from a failed Result.")` (`feature/src/api/Result.ts:68-71`). So a persistence error or `MultipleWorkflowsFoundError` crashes generically instead of reporting "not completed". On `done` it does not clear `system.workflow`.
- Neither publish handler sets `isActive=false` on a done state. After publish, `GetTargetWorkflowState` keeps finding it; the move handlers rely on `state.done` to allow moves (CMS `BlockMoveOnActiveWorkflowState.ts:30`, WB `:23`). Matters for the "one active state" invariant.
- Moves are blocked: `BlockMoveOnActiveWorkflowState` (CMS `:10-38`, WB `:9-30`), codes `Workflows/Entry/MoveBlockedByActiveState`, `Workflows/Page/MoveBlockedByActiveState`. Relevant to routing: content cannot change folder mid-review today.
- Deleting content deletes its state via `DeleteTargetWorkflowStateUseCase.execute(app, id)`. Both clear state only on permanent delete:
  - CMS checks the `permanent` flag (`DeleteWorkflowStateOnEntryAfterDelete.ts:12`).
  - WB `DeletePageRepository` calls `deleteEntry.execute(pageModel, id)` with default `permanently = true` (`api-website-builder/src/features/pages/DeletePage/DeletePageRepository.ts:16`, `api-headless-cms/src/features/contentEntry/DeleteEntry/DeleteEntryUseCase.ts:34`). Trash is a separate `TrashPage` use case (`{ permanently: false }`, `TrashPage/TrashPageRepository.ts:16-18`) publishing `PageAfterTrashEvent`, which no workflow handler listens to.

### UI, CMS

- `ContentEntryFormPresenterWorkflowDecorator.ts:28-37`: `canSave: base.canSave && !wfVm.hasState`, `canPublish: base.canPublish && (!wfVm.hasWorkflow || wfVm.isApproved)`. `saveRevision` returns false while a state exists (`:51-56`).
- `CmsEntryFormScheduleMenuItemAction.tsx:13-42` hides `schedule` unless no workflow or approved.
- `TableRowMapperWorkflowDecorator.ts:9-20` sets `$selectable:false` on rows whose state is not approved.

### UI, WB

- `PageFormWorkflowStatePublishButton.tsx:12-33` decorates `Ui.TopBar.Action name="buttonPublish"` with the same rule.
- `PageEditorAutoSave.tsx:11-30` hides `autoSave` while a state exists.
- Read-only mode is set by both `ToggleEditorMode.tsx:6-20` and `ToggleReadonly` in `PageEditorLayout.tsx:9-23` (duplicated).
- `PageListChangeStatus.tsx:12-29` hides `changeStatus` unless approved; `TableRowMapperDecorator.ts:9-18` sets `$selectable:false`.

## 4. Content metadata at review-request time

- Client input is only `{app, targetRevisionId, title}` (`app-workflows/src/features/requestReview/abstractions.ts:4-8`).
- Server enrichment point is `WorkflowStateContextProvider` (`api-workflows/.../CreateWorkflowState/WorkflowStateContextProvider.ts:4-11`):

  ```ts
  export interface IWorkflowStateContextProviderParams { app: string; targetRevisionId: string; }
  export interface IWorkflowStateContextProvider { provide(params): Promise<GenericRecord>; }
  ```

  Default returns `{}`. Result is stored as `targetContext` before steps are copied (`CreateWorkflowStateUseCase.ts:103-117`).
- CMS provider (`CmsWorkflowStateContextProvider.ts:14-38`) returns `{ folderId: entry.location?.folderId || null, modelId }`. Uses `entry.location`, not the legacy `wbyAco_location`.
- WB provider (`WbWorkflowStateContextProvider.ts:12-28`) returns `{ folderId }` only.

| Routing dimension | Status today |
|---|---|
| Requester user | Record `createdBy` comes from the state CMS entry's own metadata (`CreateWorkflowStateRepository.ts:20-22`, mapped at `WorkflowStateMapper.ts:26`); the use case does not set it. Not in `targetContext` |
| Requester teams | Fetched only after the record is created (`getUserTeams.execute(identity.id)`, `:133-135`), not persisted |
| Content folder | `targetContext.folderId` for both |
| Folder ancestors | Not computed. ACO `GetAncestorsUseCase` exists (`api-aco/src/exports/api/aco/folder.ts`) |
| Content model | `targetContext.modelId` for CMS; also encoded in the app string |
| Content locale | Not provided. `CmsEntry` has no locale or language field. WB `page.properties.language` is untyped (`CmsEntryWbPageProperties` is `{ title; [key: string]: any }`, `api-website-builder/src/domain/page/abstractions.ts:9-12`), written only by `TranslatePageUseCase.ts:67`, read in `GetPageLanguagePathsRepository.ts:43,51`. Untranslated pages may lack it |
| Content author | On the loaded entry/page, not copied into `targetContext` |

- `targetContext` is an untyped `GenericRecord` with no test coverage.
- Both providers return `{}` (not the default provider) when the model or target lookup fails (`CmsWorkflowStateContextProvider.ts:21-30`, `WbWorkflowStateContextProvider.ts:19-21`). The state is then created without `folderId`, and the FLP filters treat a missing `folderId` as visible to everyone (`CmsWorkflowStateFilter.ts:49-52`, `WbWorkflowStateFilter.ts:49-52`).
- Client GraphQL selection includes `targetContext` (`app-workflows/src/features/graphqlFields.ts:43`), but client `IWorkflowState` omits it and has no `workflowId` (`app-workflows/src/types.ts:78-95`).

## 5. UI integration points

- Shared presenter `WorkflowStatePresenter` (`app-workflows/src/presentation/workflowState/abstractions.ts:68-86`), DI singleton, accessed through `useWorkflowState()`:

  ```ts
  init(app: string, targetRevisionId: string, title: string): Promise<void>; requestReview(): Promise<void>; ...
  vm: { hasWorkflow; hasState; isApproved; isRejected; isPending; isInReview; canCancel; ... }
  ```

  `requestReview` calls `RequestReviewUseCase`, then publishes `WorkflowStateChangedEvent{app,targetRevisionId,state}` (`WorkflowStatePresenter.ts:196-229`). The "Request Review" button in `WorkflowStateBarRequestReview.tsx:20-23` opens the dialog (`presenter.showRequestReviewDialog`); the dialog calls `requestReview`. Rendered by `Components.ContentReview.WorkflowStateBar`.
- CMS entry editor:
  - `ContentEntryFormPresenterWorkflowDecorator.loadRevision` calls `workflowPresenter.init(\`cms.${modelId}\`, id, \`${model.name}: ${title}\`)` for any revision status (`:39-49`). Singletons skipped.
  - `ContentEntryFormWorkflow` decorates `ContentEntryFormContent`, renders `WorkflowStateBar` and the "Any changes you do on the entry will not be stored!" alert (`ContentEntryFormWorkflow.tsx:14-44`).
  - `CmsEntryFormTooltipButton` adds `workflowStateTooltip` before `save`.
  - `CmsEntryFormCreateNewRevisionButton` adds a `createNewRevision` menu item.
  - List sidebar footer gets "Content Reviews" via `WorkflowStateListAppOverlay app={cms.<modelId>}`.
- WB page editor (`PageEditorConfig.tsx:9-24`):
  - `PageEditorTopBar` calls `presenter.init(WB_PAGE_APP, page.id, \`Website Builder: ${title}\`)` only when `status === Draft`, disposes on unmount (`PageEditorTopBar.tsx:35-42`).
  - `PageFormWorkflowState` renders the bar with the same alert.
  - Tooltip action `buttonWorkflowStateTooltip` before `buttonPublish`.
- Pages list: `Browser.Sidebar.Footer name="contentReviews"` with `WorkflowStateListAppOverlay app="wb.page"`.
- Workflow editors wrap `Components.Admin.WorkflowsEditor` with `apps`.
  - CMS: one app per publishable non-singleton model. Menu entry guarded by `HasWorkflowsEditorPermission` and `canCreateContentModels` (`CmsWorkflowsEditorView.tsx:22-45`). Route guarded by `useCanUseWorkflows` + `SecureRoute permission="cms.contentModel"` (`Routes/CmsWorkflowsEditor.tsx:27-36`); view checks `canCreateContentModels` only (`:104`).
  - WB: one hard-coded "Pages" app. Route uses `SecureRoute permission="wb.page"` (`Routes/WebsiteBuilderWorkflowsMenu.tsx:38`). No `HasWorkflowsEditorPermission` wrapper on the menu (`PageWorkflowsEditorView.tsx:16-27`).

## 6. Duplication, inconsistencies, bugs

### Near-identical code

These differ only by how the app maps to a target:

- Context provider (CMS / WB)
- Workflow state filter (`CmsWorkflowStateFilter.ts:13-56` / `WbWorkflowStateFilter.ts:13-56`, identical apart from app predicate)
- Before-publish and before-move handlers
- After-create, after-update, after-delete, cancel sync handlers
- `getStateValues` (two copies), errors
- Frontend: OpenInNewWindow, editor view and route wrapper, field-selection GraphQL strings, `TableRowMapper` decorator, bar-plus-alert component

Candidate: one core `WorkflowTargetAdapter` abstraction (`matches(app)`, `load(targetRevisionId)`, `getContext(target)`, `writeSystemWorkflow(id, value | null)`). Collapses about 9 handler pairs into generic core handlers and gives routing a typed context (folderId + ancestors, modelId, locale, author).

### Inconsistencies and bugs

1. WB publish check crashes with a generic "failed Result" error on non-NotFound lookup failures and does not clear `system.workflow` on done. CMS allows publish on any failure and clears (`ValidateWorkflowStateOnEntryBeforePublish.ts:23-36`).
2. Delete behaviour is equivalent (permanent delete only); expressed differently (WB separate trash event, CMS `permanent` flag). Not a bug.
3. CMS context has `modelId`; WB has no equivalent. Neither has author or locale.
   - WB sync handlers call `updatePage.execute(id, {system:{workflow}})` without `skipValidation`; CMS passes `{skipValidation:true}`. A WB page failing validation leaves the copy stale silently (all four `UpdatePageOn*` / `ClearPageStateOn*` handlers).
4. App-name parsing exists three times: API regex (`api-headless-cms-workflows/src/utils/appName.ts:10-16`), app `parseAppName`/`isCmsAppName` (`app-headless-cms-workflows/src/utils/appName.ts`), and inline in `WorkflowStateCacheHandler.ts:10-13`.
5. `WorkflowStateCacheHandler.ts:23` writes `workflowId: state.id` (state record id; server uses workflow definition id). Client cannot switch easily: neither client `IWorkflowState` nor `WORKFLOW_STATE_FIELDS` has `workflowId`. It also replaces `meta.system` wholesale (`:50-57`). `state: state.state` vs server `currentStep.state` matches in practice, because every transition sets record and step state together (`WorkflowState.ts:202-206, 274, 303, 348-355`).
6. Double registration, no dedup at any layer (API `feature/src/api/createFeature.ts:18-29`, admin `feature/src/admin/createFeature.ts:9-24`, `RegisterFeature` registers every render pass `app-admin/src/components/RegisterFeature.tsx:20-28`, `@webiny/di` appends):
   - API core `WorkflowsFeature` (`registerApiRequestStack.ts:127` and `CmsWorkflowsFeature.ts:20`). Also doubles `MailNotificationTransport` (`features/notifications/NotificationTransport/feature.ts:7`), `WorkflowsSchemaFactory` and private models (`WorkflowsFeature.ts:47-49`).
   - Admin `WorkflowsFeature` + `WorkflowStatePresenterFeature` (WorkflowsAdminApp and CMS app `presentation/feature.ts:12-13`). Two singleton registrations of the presenter; which instance `resolve` returns is unverified.
   - WB API and app depend on these implicitly.
7. Two API features both named "CmsWorkflows" (`CmsWorkflowsFeature.ts:10`, `features/Workflows/feature.ts:5`); the app-side feature is also "CmsWorkflows" (`app-headless-cms-workflows/src/presentation/feature.ts:10`).
8. `folderId: "root"` hard-coded in OpenInNewWindow (CMS has a TODO at `OpenInNewWindow.tsx:21-22`; WB `:17-20`). `targetContext.folderId` is fetched but untyped on the client.
9. Editor init differs: CMS any status, WB Draft only.
10. WB read-only logic duplicated (`ToggleEditorMode` and `ToggleReadonly`).
11. Unused routes: `Routes.ContentEntries.ContentReviews` (CMS `routes.ts:16`), `Routes.Pages.WorkflowStateList` (WB `routes.ts:14`).
12. "Publishable" rules duplicated: API `isModelAllowed` + `$publishing:false` check; app editor presenter filters `$publishing:false` and `"singleEntry"` by literal strings (`CmsWorkflowsEditorPresenter.ts:25-30`), while `ContentEntryFormWorkflow` uses `CMS_MODEL_SINGLETON_TAG` (= `"singleEntry"`, `app-headless-cms-common/src/constants.ts:1`). Unlike API `isModelAllowed`, the app does not filter `isPrivate`.
13. One workflow per app is enforced. Routing needs per-step evaluation in `CreateWorkflowStateUseCase` (`:93-124`) or later at step activation. The context provider runs before steps are built, so it is the natural input. Requester teams are fetched only after the record is created (`:133`); that call must move earlier.
