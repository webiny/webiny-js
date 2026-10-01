# Workflows: supporting infrastructure

Discovery notes on infrastructure that routing, automated steps and AI steps can build on. Paths are relative to `packages/`. Snapshot of 2026-10-01.

## 1. AI providers (api-core) and ai-powerups

### Core abstraction: `api-core/src/features/ai/`

- `abstractions.ts`
  - `IAiSdkFactory` (28-33): `{id, name, models, execute(apiKey?) -> IAiSdk}`. `IAiSdk.languageModel(modelId)` (15-17) returns a Vercel AI SDK `LanguageModel`.
  - `IAi` (87-93): `generateText`, `streamText`, `listModels`, `listModelsByConnection(s)`. Params are the Vercel `ai` package's own params, with `model: "<provider>/<model>"` as a string plus `connection?: string | {sdkName, apiKey}` (68-78). This gives:
    - structured output via `output: Output.object({schema})` (example: `ai-powerups/src/api/features/AiImageEnrichment/buildEnrichmentAiRequest.ts:1,20`)
    - tools
    - `stopWhen` multi-step agent loops
  - Tool registry: `AiSdkToolDefinition` (137-147) holds `name`, `description`, `inputSchema`, MCP-style `annotations`, and a `handler` class. `AiSdkTools.getToolSet()` (190-195) builds the ToolSet; handlers resolve lazily (`AiSdkTools.ts:14-34`).
  - `AiConnectionFactory` (55-64) registers named connections. Nothing registers one yet; only exported.
- Providers: `OpenAiSdkFactory.ts`, `AnthropicSdkFactory.ts`, `GoogleSdkFactory.ts`, registered in `feature.ts:15-23`. Env fallbacks `WEBINY_API_OPENAI_API_KEY` (`OpenAiSdkFactory.ts:32`), `WEBINY_API_ANTHROPIC_API_KEY` (`AnthropicSdkFactory.ts:25`), `WEBINY_API_GOOGLE_API_KEY` (`GoogleSdkFactory.ts:25`) apply only when an inline `connection` object without `apiKey` is passed. With no `connection`, `Ai.resolveConnection` (`Ai.ts:161-167`) looks up registered connections; none exist, so it throws "No AI connection found". AI steps must pass the inline connection from `ResolveAiCapabilityUseCase`.
- `Ai.ts`
  - `generateText` (41-72) publishes `AiBeforeGenerateTextEvent`, `AiAfterGenerateTextEvent`, `AiGenerateTextErrorEvent` (`events.ts`), consumed by `api-audit-logs/src/subscriptions/ai/handlers/*`.
  - Model resolution (112-129), connection resolution (140-168), SDK instances cached per connection (171-192).
- Also: `toolPipeline/` (`AiOutputTool` registry and runner) and `TextExtractor/` (docx parser).

### Per-tenant keys and models: ai-powerups

- Settings live in the tenant-scoped `KeyValueStore` under `"AiPowerUps/Settings"` (`ai-powerups/src/api/constants.ts`, `features/GetSettings/GetSettingsRepository.ts:24-25`, cache in `features/shared/SettingsCache.ts`).
- Settings hold connections (presets with `apiKeyEncrypted`), model roles `fast | standard | vision` (`features/ModelRoles/roles.ts:14`), and per-capability overrides.
- Pattern for an AI step:
  1. Register an `AiCapability` `{id, label, description, defaultRole, guidance?}` (`features/Capabilities/abstractions.ts:11-34`). Example: `features/AdminAssistant/capability.ts`.
  2. Call `ResolveAiCapabilityUseCase.execute(id)` (abstractions 63-92; implementation `ResolveAiCapabilityUseCase.ts:29-100+`). Returns `{model, connection:{sdkName, apiKey}, guidance, additionalInstructions}`, checks the capability is enabled, decrypts the key. No env fallback by design (comment at 26-27). Fails if the connection has no `apiKeyEncrypted` (90-96).
  3. Pass the result to `Ai.generateText`.
- Entire ai-powerups extension is gated on flag/licence `aiPowerups` (`ai-powerups/src/api/Extension.ts:44`). Outside consumers inject `[ResolveAiCapabilityUseCase, {optional: true}]` (comment at 39-42). Consequence: AI steps depend on two licences (`advancedPublishingWorkflow` and `aiPowerups`).
- ai-powerups features (`Extension.ts:48-80`): settings, connections, model roles, capabilities, personas, projects, AiPromptContext, ExtractFrontmatter, CmsResolveImageTool, CMS generate-entry and compare-revisions, WB generate/translate page, file-manager image enrichment, AdminAssistant.

### Agent infrastructure

- `ai-powerups/src/api/features/AdminAssistant/AdminAssistantUseCase.ts`: `aiSdkTools.getToolSet()` (199), `ai.streamText` (111), capability resolution (223), `stopWhen: stepCountIs(maxSteps)` (237-247), tool approvals (`approvals.ts`, 56-62). Exposed through HTTP stream route `AdminAssistantStreamRoute.ts`.
- Existing tools: `api-aco/src/features/ai/*Tool.ts` (ListFolders, CreateFolder, ListTeams, CreateTeam, ListRoles, Grant/RevokeFolderAccess), `api-headless-cms/src/features/ai/*` (ListContentModels, DescribeContentModel, QueryEntries), `api-file-manager/.../ListImagesByTagTool`.
- Live UI updates: `CreateFolderTool.ts:89-91` sends a websocket message via `WebsocketsSendToIdentityUseCase`; admin picks it up in `app-aco/src/features/folders/folderEvents/*`.

### Template for "AI review as a background job"

`ai-powerups/src/api/features/AiImageEnrichment/AiImageEnrichmentTask.ts`:

- Task handler injects `Ai`, calls `generateText` with structured output (68-70).
- Notifies the user over websocket on failure (97-120).
- `TaskDefinition` (136-150): `maxIterations: 1`, `isPrivate`, `selfCleanup`.
- Triggered from a domain-event handler (`AiImageEnrichmentAfterCreateHandler.ts:16-21`, `taskService.trigger`).

## 2. Background and async execution

- Abstractions in `api-core/src/features/task/`:
  - `TaskService` (`TaskService/abstractions.ts:6,39-53`): `trigger({definition, input, name?, parent?, delay?})`, `abort`, `fetchServiceInfo`.
  - In `TaskDefinition/abstractions.ts`:
    - `ITaskMetadata` (133-142): `maxIterations`, `databaseLogs`, `isPrivate`, `selfCleanup`.
    - `ITaskHandler` (151-177): `run({input, controller})` plus hooks `onBeforeTrigger`, `onDone`, `onError`, `onAbort` (168), `onMaxIterations`. Hooks live on the handler class, not the definition.
    - `ITaskDefinition` (186-191) = `ITaskMetadata` + `handler: Constructor<ITaskHandler>`.
  - `controller.runtime.isAborted()`, `controller.response.done/error/aborted/continue`.
  - `TaskService.trigger` accepts `delay` (`TaskService/abstractions.ts:72`).
- Implementations: `background-tasks/src/api/` (CRUD, runner, GraphQL, models), `background-tasks-aws` (Step Functions, `StepFunctionService.ts:19`, `BackgroundTaskLambdaHandler.ts`), `background-tasks-standalone` (`WorkerTaskService.ts`, `worker/TaskOrchestrator.ts`).
- Multi-iteration example with timeout handling: `api-aco/src/features/flp/UpdateFlp/UpdateFlpUseCase.ts:122-126` (`isCloseToTimeout`, `handleTimeout`). Inline fallback when `TaskService` is optional: `UpdateFlpOnFolderUpdatedHandler.ts:18-25,34`.
- `EventPublisher` (`api-core/src/features/eventPublisher`) is in-process synchronous domain events, not a queue.
- Deferred execution: background tasks, plus `api-scheduler` (`api-scheduler/src/features/ScheduleAction`, with `-aws` and `-standalone` variants). Scheduler is relevant to timeouts and escalation.
- api-workflows uses no tasks today. Its domain events are hook points:
  - `WorkflowStateStartStepEvent` (`features/workflowState/StartWorkflowStateStep/events.ts:6`)
  - `WorkflowStateApproveStepEvent`, `WorkflowStateRejectEvent`, `WorkflowStateCancelEvent`, `WorkflowStateTakeOverStepEvent`
  - `WorkflowStateAfterCreate`, `AfterUpdate`, `AfterDelete`
  - `Workflow{Before,After}{Create,Update,Delete}Event`

## 3. ACO folders

- Model: `api-aco/src/domain/folder/folder.model.ts:5-63`. Private CMS model `wbyAcoFolder`: `title`, `slug`, `type`, `parentId`, `path`, `permissions[{target, level}]`, `extensions`.
- Path format `root/<slug>/<slug>` (`api-aco/src/utils/Path.ts:3-11`). Computed on create (`CreateFolderRepository.ts:37-52,131`) and update (`UpdateFolderRepository.ts:55-71,148`).
  - Descendant paths are rewritten by `UPDATE_FLP_TASK_ID` (walks children by `parentId`, `UpdateFlpUseCase.ts:120-130,199`, writes paths 152-163). Async background task when `TaskService` is registered, otherwise inline (`UpdateFlpOnFolderUpdatedHandler.ts:18-25`). Errors swallowed either way (26-28).
  - Descendant paths can be briefly stale after a folder move or rename.
- Descendant lookup: `ListFoldersWhere.path_startsWith` (`api-aco/src/folder/folder.types.ts:37-44`), direct children via `parentId`, `ListFlps` also has `path_startsWith`. Ancestors: `GetAncestors` (`path_in`, `GetAncestorsRepository.ts:47`), plus `GetFolderHierarchy`.
  - For routing, ancestor lookup is the cheap direction: load the content's folder, take its ancestors, match rule folder ids against `[folder, ...ancestors]`. No descendant scan needed.
  - Caveat: `GetAncestorsRepository.ts:36-50` builds `path_in` from the folder's stored `path`. Right after an ancestor move the stored path is stale and the lookup misses the moved ancestor (`findParents` chain breaks at 77-82). Result includes the folder itself (`findParents([], folder)`, 89).
- Folder delete: no cascade. Blocking depends on folder type.
  - Child folders: `EnsureFolderIsEmptyOnDelete/GenericFolderBeforeDeleteHandler.ts:12-18` with `EnsureFolderIsEmpty.ts:15-70` (also without authorization, for FLP-hidden folders). Passes `() => false` for content. Fails with `FolderNotEmptyError` or `FolderNotAuthorizedError`.
  - CMS content: `EnsureHcmsFolderIsEmptyOnDelete/ModelFolderBeforeDeleteHandler.ts:20-28`, only for folder type `cms:<modelId>` when `getModel(modelId)` succeeds.
  - File Manager content: `api-file-manager-aco/src/features/EnsureFolderIsEmptyBeforeDelete/`.
  - WB page folders: type `wb:page` (`app-website-builder/src/constants.ts:29`) resolves modelId `"page"`, not a model (page model is `wbyWbPage`), so content is not checked. No guard in api-website-builder or api-website-builder-workflows. A WB folder holding pages but no subfolders can be deleted.
  - `DeleteFlpOnFolderDeletedHandler.ts` removes FLP records after delete.
  - Routing brief's open question: for CMS, a referenced folder can only be deleted once empty, so a dangling id simply never matches. For WB it can be deleted with pages inside; those pages keep a dangling `folderId`. The editor should flag dangling folders either way.
- Folder events: `FolderBefore/AfterCreateEvent`, `FolderBefore/AfterUpdateEvent`, `FolderBefore/AfterDeleteEvent` (in `CreateFolder/`, `UpdateFolder/`, `DeleteFolder/` `events.ts`). Handler abstractions like `FolderAfterDeleteEventHandler` exported from each feature's `abstractions.ts`. Consumers: FLP handlers, `api-audit-logs/src/subscriptions/aco/handlers/*`.

## 4. Security: teams, users, identity

- `AdminUser.teams?: string[]` (`api-core/src/types/users.ts:18`). Users are tenant-scoped (`AdminUsersRepository.list` adds `tenant`, `api-core/src/features/users/shared/AdminUsersRepository.ts:62-73`).
- User's teams: `ListUserTeamsUseCase.execute(userId)` (`api-core/src/features/users/ListUserTeams/abstractions.ts:15-26`), runs `ListTeams` with `id_in` under `withoutAuthorization` (`ListUserTeamsUseCase.ts:16-46`). api-workflows wraps it with a cache (`api-workflows/src/features/internal/GetUserTeams/GetUserTeamsUseCase.ts:6-38`).
- No "list team members" API.
  - `ListUsersUseCase.execute({where:{id_in}, sort})` (`ListUsers/abstractions.ts:17-22`; `ListUsersInput` in `users/shared/types.ts:38-43`) only filters by `id_in`.
  - Members need either all tenant users filtered in memory on `teams`, or a new `teams_in` storage filter. Round-robin and least-loaded both need this.
  - `ListUsers` returns `notAuthorized`, so system code must call it under `withoutAuthorization`.
- Teams: `api-core/src/features/security/teams/{Create,Delete,Get,List,Update}Team`; `GetTeam` by id or slug; `ListTeams` where `id_in` or `slug_in` (`teams/shared/types.ts:19-32`); `TeamProvider.ts` with caching decorator.
- `ListUsersUseCase.ts:20-23` returns `NotAuthorizedError` without the `adminUsers.user` permission.
- Users: `users/{Get,List,Create,Update,Delete}User`, `GetIdentityProfile`, `ExternalIdpUserSync`.
- `IdentityContext` (`api-core/src/features/security/IdentityContext`): `getIdentity()`, `withoutAuthorization(fn)`.

## 5. Notifications and mailer

- api-workflows has a transport abstraction, but nothing sends.
  - `NotificationTransport` `{id, title, send({users: NonEmptyArray<{id, email, displayName}>, message})}` (`api-workflows/src/features/notifications/NotificationTransport/abstractions.ts:8-32`).
  - Only implementation: `MailNotificationTransport` (`id: "e-mail"`), BCC via `MailerService.sendMail` (`MailNotificationTransport.ts:4-53`).
  - `ListNotificationTypes` lists registered transports (`ListNotificationTypesRepository.ts:8,26`).
  - Message abstractions `NotificationTypeMessageOn{RequestReview, RequestReviewCancel, ReviewStepStart, ReviewStepApprove, ReviewReject, ReviewApprove}` exist (`api-workflows/src/domain/notifications/abstractions.ts:3-60`) but are unused.
  - Step model field `notifications[{id}]` (`domain/workflow/workflowModel.ts:35-40`).
  - No `.send(` call anywhere in workflows packages. Must be wired to workflow-state events.
- Mailer: `MailerService.sendMail(data)` returns `Result` (`api-mailer/src/domain/MailerService/abstractions.ts:14-26`). SMTP and Dummy transports; settings in KeyValueStore key `MAILER_TRANSPORT_SETTINGS` (`api-mailer/src/features/GetSettings/GetSettingsRepository.ts:26`); `CodeMailerSettings`.
- In-app channel: `WebsocketsSendToIdentityUseCase` (`api-websockets/src/features/SendToIdentity/abstractions.ts:15`), used in `AiImageEnrichmentTask.ts:107` and `CreateFolderTool.ts:89`.

## 6. Tenant settings

- `KeyValueStore` (tenant-scoped, `api-core/src/features/keyValueStore/abstractions.ts:42-55`): `get`/`set`/`delete` returning `Result`; keys scoped by `tenantContext.getTenant().id` (`KeyValueStore.ts:13-24`). `GlobalKeyValueStore` (`keyValueStore/abstractions.ts:16-39`) is the non-tenant variant with `scope`/`expiresAt`.
- Examples: ai-powerups settings (`GetSettingsRepository.ts:24`, UpdateSettings, `AiPowerUpsSettingsGroupHandler`), mailer settings (`api-mailer/src/features/{Get,Save}Settings/*Repository.ts`), WB experiment pause (`api-website-builder/src/features/experiments/ExperimentPause/*`).
- Alternative: singleton CMS model, as webhook settings (`webhooks/src/api/features/GetWebhookSettings/GetWebhookSettingsRepository.ts:19-33`, `WEBHOOK_SETTINGS_MODEL_ID`).
- Exclusion list fits either. Entries have an end date and a reason and are a list, so a private CMS model (one record per excluded user) is also an option and avoids rewriting one blob.

## 7. Webhooks and external HTTP

- Core abstractions in `api-core/src/features/webhooks/`: `WebhookDispatcher.dispatch(eventName, data)` (routes a domain event to matching enabled webhooks via background tasks, `WebhookDispatcher/abstractions.ts:7-17`), `NullWebhookDispatcher`, `WebhookFactory`, `WebhookProvider`, `WebhookSignPayload`, `WebhookVerifyPayload`.
- Implementation in `webhooks` package (`webhooks/src/api/features/*`): CRUD, deliveries, Resend, Trigger, `SendWebhookTask`, Sign/VerifyPayload. HTTP call at `WebhookDeliver.ts:43-47` (`fetch` with `AbortSignal.timeout`). Delivery records via `CreateWebhookDelivery`, `UpdateWebhookDelivery`, `ListWebhookDeliveries`.
- `WebhookDeliver` (`webhooks/src/api/features/WebhookDeliver/abstractions.ts:3-31`) already POSTs with timeout and retry/backoff and returns `{status, body, responseTime, attempts}`. POST only.
- Gap: no inbound route in `webhooks/src/api`; `WebhookVerifyPayload` has no internal consumer. Missing piece for a check step is response evaluation (and optionally an inbound callback endpoint), not the HTTP call.
