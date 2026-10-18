# Workflows: admin UI (app-workflows)

Notes for `packages/app-workflows` and how the CMS and WB admin packages consume it. Sections 1, 2 and 4-6, 8 and 9 describe the code as built in phases 8a and 8b (2026-10-16 and 2026-10-17, D157-D164). Section 3 (the workflow editor) and the bugs of section 7 are the 2026-10-01 discovery notes for the editor code that stays until phases 9a-9c.

Path roots:

- `[AW]` = `packages/app-workflows/src`
- `[CMS]` = `packages/app-headless-cms-workflows/src`
- `[WB]` = `packages/app-website-builder-workflows/src`
- `[API]` = `packages/api-workflows/src`

## 1. Layout, entry points, registration, gating

- Layout of `[AW]`:
  - Editor code (kept until 9a-9c): `domain/` (workflow models, permission schema), `features/{listWorkflows,storeWorkflow,deleteWorkflow,listNotificationTypes,permissions}/`, `presentation/{workflowsEditor,permissions}/`, `hooks/canUseWorkflows.ts`.
  - The shared review core, `review/`: `domain/` (types, enums, error codes, constants, pure functions), `gateway/` (the gateway interface `IReviewGateway`, DTOs, field fragments, mappers), `useCases/` (the use-case interfaces and the one implementation `ReviewUseCases`), `events/`, `cache/`, `activity/`, `toasts/`, `notifications/`, `content/` (the content adapter interface), `presentation/{targetReview,actionDialog,reviewerPicker,requestReview,reviewDetails,reviewList,reviewWidget}/`, `editor/` (editor session and `EditorReviewBar`), `mounting/` (row provider, notification handler, route, menu and widget components), `trash/` (block collector, guard, warning presenter and dialog), `testing/` (fixtures and fakes), `feature.ts`.
- Mounting: `packages/app-serverless-cms/src/Admin.tsx` renders `<WorkflowsAdminApp/>`, `<CmsWorkflows/>`, `<WebsiteBuilderWorkflows/>` in that order, so the shared features are registered before the app features resolve them.
- All three roots return `null` unless `featureFlags.isEnabled("advancedPublishingWorkflow")` (tied to the licence). `WorkflowsAdminApp` registers the permissions, editor and shared review features and `SecurityPermissions`; it has no review route, menu or widget of its own.
- Public API (`[AW]/index.tsx`): `WorkflowsAdminApp`, `useCanUseWorkflows`, `useWorkflowsPermission`, `IWorkflowApplication`, the kept feature objects and `Components.{Permissions,Admin}`. Phase 8a adds nothing to this barrel: the review core (use-case and gateway types, `ReviewUseCases`, `EditorReviewSession`, `EditorReviewBar`, `ReviewListView`, the widgets, the mounting components, `AppReviewRowProvider`, `ReviewNotificationHandler`, `ReviewCacheSyncHandler`, `ActiveReviewGuard`, ...) is imported by deep `.js` paths (every admin package exports `"./*": "./*"`).
- Routes: none in `[AW]`. Content Reviews routes are per app: `Routes.ContentEntries.ContentReviews` (`/cms/content-reviews`, `[CMS]/routes.ts`) and the Website Builder one in `[WB]/routes.ts` (`/website-builder/pages/content-reviews`; its key is a historical name). Permissions: `createPermissionSchema({ prefix: "workflows", fullAccess: { editor: true } })` (`[AW]/domain/permissionsSchema.ts`), shown through `Security.Permissions`.

- Permissions in the admin (8b, D162): `getWorkflowsPermissionSet(identity)` (`[AW]/review/domain/getWorkflowsPermissionSet.ts`) returns `{ fullAccess, editor, reassign }` (`fullAccess` is `workflows.*` or `*`; several roles combine). `useWorkflowsPermission` returns `{ editor, reassign }` over it; `IWorkflowsSecurityPermission` is `{ name, editor?, reassign? }` and `WorkflowsSecurityPermissionAccessLevel` is gone (the stored values are booleans, the old comparison with the enum was a bug). Presenters read the identity through `IdentityContext`. The server keeps every check; these are display gates (the Failed steps tab, the Background task link).

## 2. Architecture pattern

- DI: `@webiny/feature/admin` `createAbstraction` / `createFeature`, `X.createImplementation({ implementation, dependencies })`. Gateways call `MainGraphQLClient` (`@webiny/app/features/mainGraphQLClient/abstractions.js`). No Apollo.
- Layering (D159): shared presenters and components depend on use-case interfaces (`IReviewUseCases` and its parts) and never on a gateway; the one `ReviewUseCases` class calls an app's gateway through `IReviewGateway`. Each app registers `<App>ReviewGateway`, `<App>ReviewUseCases` (a per-app subclass of the shared class, `<App>ReviewUseCasesImpl`, bound to its gateway, singleton, own workflow cache; the shared class is never bound itself) and `<App>ReviewContentAdapter` under its own tokens (`Cms/Workflows/...`, `WebsiteBuilder/Workflows/...`, `Wb/Workflows/ReviewContentAdapter`). Shared presenters receive `useCases` as an `init(...)` argument; app glue resolves its token and passes it in.
- Presenters: MobX `makeAutoObservable`, a `vm` of render-ready values only, transient (a new instance per `useFeature` resolve) so two views never share state; components are `createReactiveComponent`.
- Errors: gateways return the `{ data, error }` envelope; `ReviewUseCases` throws `GraphQLOperationError` (`@webiny/app/errors/GraphQLOperationError.ts`, code, message, data) and presenters map it by code ("Someone else acted first", field errors, no access, transport failure).
- Events and cache: `ReviewChangedEvent` (`workflows.review.changed`) after a target review loads; the app's `<App>ReviewCacheSyncHandler` (a subclass of the shared `ReviewCacheSyncHandler`) hands `toSystemWorkflow(review)` to the app's cache writer (`CmsReviewCacheWriter`, `WbReviewPageCacheWriter`) so the content lists show the review state. A writer updates only the review's own revision.
- Live updates: `ReviewActivity` signals `{ namespace, source, reviewId, targetRevisionId }` (the two ids are `null` when the caller has none). Own actions, every incoming `workflows.notification` (`ReviewNotificationHandler` per app, `ReviewNotificationService`, with a toast) and every silent `workflows.reviewChanged` (`ReviewChangeMessageHandler`, a shared plain class in `[AW]/review/mounting/`, subclassed per app as `CmsReviewChangeMessageHandlerImpl` and `WbReviewChangeMessageHandlerImpl`; source `remote`, no toast) notify it. Lists and widgets refetch once per signal of their namespace, and a signal that arrives during a load is queued and applied once after it. `TargetReviewPresenter` (the bar) refetches on a signal for its review or its revision and `ReviewDetailsPresenter` (the drawer) on one for its review (it subscribes after its first successful load, because its init params carry no namespace; a failed first load does not subscribe and Try again subscribes on success, and an action taken in the drawer refreshes the bar only through the signal, its `onChanged` stays for conflicts); both ignore a signal raised by their own `notify` call, so their own action refreshes once, and both keep at most one refetch queued during a load. A later `init` or `dispose` drops the subscription. No polling (D160).
- Toasts: `ReviewToasts` and `ReviewNotificationService` use the admin `Notifications` stack with link, duration, position, dismissible and the error variant.
- Extensibility: decorators on each app's extension points (editor components, `ContentEntryFormPresenter`, list field selections and row mappers, the delete use cases), each point decorated once.
- Tests: fixtures and fakes are in `[AW]/review/testing/` (imported as `@webiny/app-workflows/review/testing/...` by the app packages); all three packages have jsdom vitest setups; the review core and the app packages are covered, the kept editor code is not. The shared `review/testing` helpers cover the 8b views: `createWorkflowsIdentityContext` (a test identity with teams and permissions), `at` (one clock for the view tests), `createRunningAiStep`, `createRunningAutomationStep` and `createFailedAutomationStep` (in `createAutomatedStep.ts`), `createStepRunInfo` and `createStepRunInfoDto` (in `reviewFixtures.ts`), and `createFakeActivity` (a fake activity bus).

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

  The step fields are hand-copied in `WorkflowStepModel` (`domain/WorkflowStepModel.ts`) and `WORKFLOW_FIELDS` (`features/graphqlFields.ts`). Every new step field needs adding in both plus API input and type.

## 4. Content review flows (as built)

- Editor session: one `IEditorReviewSession { presenter, useCases }` per app (`CmsEntryReview` with `CmsEntryReviewImpl`, `WbPageReview` with `WbPageReviewSessionImpl`; both subclass the shared `EditorReviewSession`), singleton, reset on `dispose()`; `EditorReviewBar` renders `ReviewBar` and the details drawer. The CMS form presenter decorator (`CmsEntryFormPresenterReviewDecorator`) and the WB top bar, layout, autosave and publish button (`PageEditorTopBar`, `PageEditorLayout`, `PageEditorAutoSave`, `PageReviewPublishButton`) init the presenter for the open revision and apply `allowsEditing` / `allowsPublishing`.
- `TargetReviewPresenter` statuses: `loading | failed | noWorkflow | none | active`; actions come from the server's `flags`. Dialogs (start, take over, approve, reject, cancel, reassign) load the review by id and share `ReviewActionDialogPresenter`; each takes an optional conflict callback so its host (bar, drawer, list) refreshes, and a dialog opened from Content Reviews ends a conflict with "The list has been refreshed.". The request dialog (`RequestReviewPresenter`) previews the steps and takes picks; `ReviewDetailsPresenter` drives the drawer.
- Lists: `ReviewListPresenter` over `IReviewListUseCases` and an `IReviewRowProvider` (app-neutral rows, per-namespace link and actions); `ReviewListView` has up to five tabs (Assigned to me, Team pool, Team in review, My requests, and Failed steps for viewers with `reassign` or full access; `?tab=failedSteps` without the permission opens the default tab), filters, sorting by last change, load more and the live-update notice; widgets: `ReviewWidgetPresenter` with `ReviewForMeWidget` and `ReviewMyRequestsWidget` (names `workflows.{cms,wb}.{review,requested}`). The Content Reviews menu item is the shared `ReviewContentReviewsMenu` (wrapped in `AdminConfig`, name `workflows.{cms,wb}.contentReviews`).
- Trash and delete: `ActiveReviewGuard` (`run`, `runBulk`) with `ActiveReviewBlockCollector` and `ActiveReviewWarningDialog` (a named dialog); each app's `features/trash` decorates its delete use cases and the bulk delete presenter (D157). For the CMS bulk trash of all loaded rows the bulk decorator asks `listBlockingReviews` per chunk of 200 entry ids first and shows the warning through `ActiveReviewGuard.confirmBlocking` (D164); `runBulk` is built on it. The base `BulkDeletePresenter.execute` reports whether the background task started (Q39): the trash action's toast and deselection follow only `true`, and a failed pre-check shows the error toast.
- Restart (8b): the action kind `restart` (label Restart, icon `refresh`) is offered from the server flag `canRestart` in the bar, the drawer and the Content Reviews row; `ReviewActionDialogPresenter` calls `restartStep`, shows the toast "Restarted “{Step}”" and treats `Workflows/Review/TargetSync` as a success with a refresh; `getConflictMessage` has a restart branch for a step someone else already restarted. `getRestartDialogBody` builds the dialog text from the step's `finishedOn` and `comment` and drops one trailing "." of the server reason before " Restarting runs the step again from the beginning.". `isStepRunning(step)` (in review with a non-user owner) drives the running messages and tags and the cancel dialog's running suffix.
- Drawer additions (8b): `getAttempts` and `getAiIssues` build the `Attempts` and `Issues reported by the AI` sections; operators get a "Background task" link per attempt, which opens the task panel (`openStepRun`, `closeStepRun`, `getStepRunPanel`) over `getStepRun` (a row without a value is left out, times through `formatReviewTimeFull`).
- Content reload (8b, D163): `TargetReviewInitParams.contentReloader` (`IReviewContentReloader { reload(): Promise<boolean> }`) is built by the app glue: the CMS reloader `CmsEntryContentReloader` (`[CMS]/presentation/CmsEntryContentReloader.ts`, built in `CmsEntryFormPresenterReviewDecorator` over the undecorated presenter's `loadRevision`, skipped while the form is dirty; the form's loading overlay shows briefly during the reload, accepted, Q40), the WB reloader `WbPageContentReloader` (evicts the page from `FullPageCache`, reads it, applies it with `updateDocument`). `TargetReviewPresenter` calls it once when a non-user step stops being in review and sets `vm.contentNotice`, which the shared `ReviewBar` shows as a success strip inside the bar (`EditorReviewBar` is unchanged). The reload is skipped when the presenter was disposed or initialised again during the refresh.

## 5. GraphQL operations

- Per-app review operations live only in the app packages, one document per file: CMS `[CMS]/features/gateway/graphql/` over the `cms` root (`listCmsEntryWorkflows`, `getCmsEntryTargetReview`, `getCmsEntryReview`, `listCmsEntryReviews`, `listCmsEntryStepCandidates`, `listCmsEntryReviewStepCandidates`, `requestCmsEntryReview`, `startCmsEntryReviewStep`, `takeOverCmsEntryReviewStep`, `reassignCmsEntryReviewStep`, `approveCmsEntryReviewStep`, `rejectCmsEntryReviewStep`, `cancelCmsEntryReview`, `cancelCmsEntryReviewsForDelete`); WB `[WB]/features/gateway/graphql/` over the `websiteBuilder` root (the same set with `WebsiteBuilderPage`, no `modelId`). The shared field fragments are `[AW]/review/gateway/reviewFields.ts`.

- Added in 8b: per app `restartCmsEntryReviewStep` and `restartWebsiteBuilderPageReviewStep`, `getCmsEntryReviewStepRun` and `getWebsiteBuilderPageReviewStepRun` (documents in the same folders), and CMS only `listCmsEntryBlockingReviews` (the WB gateway's `listBlockingReviews` returns an empty list, the WB bulk delete runs per item). The fragments `STEP_RUN_INFO_FIELDS` and `BLOCKING_REVIEW_FIELDS` are in `reviewFields.ts`.
- The kept editor gateways still use the `workflows` root: `listWorkflows`, `storeWorkflow`, `deleteWorkflow` and the stale `listWorkflowNotificationTypes` (9a moves it to `listNotificationTransports`).

## 6. Consumer contract

CMS and WB use: `ReviewUseCases` through their own tokens, `EditorReviewSession` and `EditorReviewBar`, the presenters' use-case-typed `init` arguments, `ReviewListView` and the widgets through the mounting components, `ReviewCacheSyncHandler` with their cache writer, `ReviewNotificationHandler` and `ReviewChangeMessageHandler` subclasses with their content adapter, an `IReviewContentReloader` passed to `TargetReviewPresenter.init` as `contentReloader`, `ActiveReviewGuard` (`run`, `runBulk`, `confirmBlocking`), and from the editor side `Components.Admin.WorkflowsEditor`, `Components.Permissions.HasWorkflowsEditorPermission`, `IWorkflowApplication` and `useCanUseWorkflows`. The `system.workflow` shape on content is `{ workflowId, reviewState, stepId, stepName, stepState }` (`SystemWorkflowValue`). Details in `integrations.md`.

## 7. Bugs (open, editor code kept until 9a-9c)

Verified against code on 2026-10-01; the review UI bugs of that snapshot (singleton widget and list presenters, dropped error codes in the review gateways, the approve success dialog, the unguarded `init`) went with the deleted code.

1. `useCanUseWorkflows()` returns `{ canUseWorkflows }` (`hooks/canUseWorkflows.ts:8-10`), but `WorkflowsEditorBase.tsx:28,37` tests `!obj`. Always false; the "no access" alert is dead.
2. The kept editor gateways (`ListWorkflowsGateway`, `StoreWorkflowGateway`, `DeleteWorkflowGateway`, `ListNotificationTypesGateway`) declare only `error: { message }` and throw `new Error(error?.message ...)`, dropping the `code` and `data` already requested by `ERROR_FIELDS`; `FormattedError` therefore always shows empty fields (`FormattedError.tsx:31`). The review gateways do not have this problem (`GraphQLOperationError`).
3. `RemoveStep.tsx:28` `onClick={close}`: `close` is undefined locally (`useToggler` gives `on, toggle, toggleOn`, `:14`), so it resolves to `window.close`. Low impact: dialog still closes via `DialogClose` (`admin-ui/src/Dialog/components/CancelAction.tsx:8`); would close a script-opened window.
4. Editor save fire-and-forget; only `.catch` sets `_error` (`WorkflowsEditorPresenter.ts:96-105`). Snackbar synchronous (`Step.tsx:104`). `WorkflowModel.snapshot` is `private readonly`, set in constructor only (`domain/WorkflowModel.ts:13, 24`), so `dirty` stays true. Nothing reads `vm.dirty`.
5. App search in `WorkflowsDataList` compares `name.toLowerCase().includes(filter)` without lowercasing `filter` (`WorkflowsDataList.tsx:18-22`). Uppercase queries never match.

## 8. Duplication and dead code (editor)

- Field lists hand-copied across `WorkflowStepModel`, `WORKFLOW_FIELDS` and the API types.
- The four editor use cases are passthroughs to their gateways.
- Dead: DI `WorkflowsPermissions` (registered, never consumed; the legacy `useSecurity().getPermission("workflows")` is what runs), `StepFormNotifications` (commented out in `Step.tsx`).

## 9. Open for 9a-9c

- The step editor is not type-aware; fields are fixed in `Step.tsx`. Needs a step-type registry or decoratable field slots for assignment config, the rule list, the manual-selection toggle, AI and check config.
- One workflow per app is hardcoded in the editor presenter (`_workflows[0]`).
- Editor saves are fire-and-forget; the workflow list cache of `ReviewUseCases` is not invalidated by a save (a workflow saved in the editor shows in the review UI after a reload; 9a adds invalidation).
- The reviewer picker is a small `ReviewerPicker` (8a); 9b generalises it into the shared `Picker`.
- The editor has no tests.
- The role form does not grant `reassign` yet (9c); the admin already reads it (D162).
