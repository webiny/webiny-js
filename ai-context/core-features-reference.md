# Core Features Reference

This document provides the correct import paths and type definitions for commonly used features in the Webiny backend codebase (packages named with `api-*`).

**How to use this document:**

1. Find the feature you need to use
2. Copy the exact import path
3. Read the linked TypeScript file to see the complete interface and available methods

---

## Core Features

### TenantContext

- **Import:** `import { TenantContext } from "@webiny/api-core/features/TenantContext"`
- **Interface Type:** See `packages/api-core/src/features/TenantContext/abstractions.ts`
- **Usage:** Access current tenant information

### IdentityContext

- **Import:** `import { IdentityContext } from "@webiny/api-core/features/IdentityContext"`
- **Interface Type:** See `packages/api-core/src/features/IdentityContext/abstractions.ts`
- **Usage:** Access current user identity and permissions

### EventPublisher

- **Import:** `import { EventPublisher } from "@webiny/api-core/features/EventPublisher"`
- **Interface Type:** See `packages/api-core/src/event-publisher/abstractions.ts`
- **Usage:** Publish domain events

### WcpContext

- **Import:** `import { WcpContext } from "@webiny/api-core/features/WcpContext"`
- **Interface Type:** See `packages/api-core/src/features/WcpContext/abstractions.ts`
- **Usage:** WCP (Webiny Control Panel) integration for seats/tenants management

### GetSettings

- **Import:** `import { GetSettings } from "@webiny/api-core/features/settings/GetSettings"`
- **Interface Type:** See `packages/api-core/src/features/settings/GetSettings/abstractions.ts`
- **Usage:** Retrieve settings records by name

### UpdateSettings

- **Import:** `import { UpdateSettings } from "@webiny/api-core/features/settings/UpdateSettings"`
- **Interface Type:** See `packages/api-core/src/features/settings/UpdateSettings/abstractions.ts`
- **Usage:** Create or update settings records

### Ai

- **Import:** `import { Ai } from "@webiny/api-core/features/ai/index.js"`
- **Interface Type:** See `packages/api-core/src/features/ai/abstractions.ts`
- **Usage:** Generate text and stream text using registered AI providers. Model format: `"provider/modelId"` (e.g. `"anthropic/claude-3-5-sonnet-20241022"`, `"openai/gpt-4o"`). Providers: `anthropic` (env: `WEBINY_API_ANTHROPIC_API_KEY`), `openai` (env: `WEBINY_API_OPENAI_API_KEY`). Must register `AiFeature` from `@webiny/api-core/features/ai/index.js`.

### AiGateway

- **Import:** `import { AiGateway } from "@webiny/api-core/features/ai/index.js"`
- **Interface Type:** See `packages/api-core/src/features/ai/abstractions.ts`
- **Usage:** Routes `"provider/modelId"` strings to registered providers. Used internally by `Ai`.

### TaskDefinition

- **Import:** `import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js"`
- **Interface Type:** See `packages/api-core/src/features/task/TaskDefinition/abstractions.ts`
- **Usage:** Define background tasks. Use `TaskDefinition.createImplementation({ implementation, dependencies })`. Register with `context.container.register(MyTask)`. The `run` method receives `{ input, controller }` where controller provides `response.done/error/aborted/continue` and `runtime.isAborted/isCloseToTimeout`.

### TaskService

- **Import:** `import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js"`
- **Interface Type:** See `packages/api-core/src/features/task/TaskService/abstractions.ts`
- **Usage:** Trigger and abort background tasks. Call `taskService.trigger({ definition: "taskId", input: {...} })`. Inject as DI dependency via `TaskService`.

### WebsocketService

- **Import:** `import { WebsocketService } from "@webiny/api-websockets/features/WebsocketService/index.js"`
- **Interface Type:** See `packages/api-websockets/src/features/WebsocketService/abstractions.ts`
- **Usage:** Send real-time messages to connected clients. Use `send({ id: userId }, { action, data })` for a specific user or `sendToConnections(connections, { action, data })` for multiple. List connections with `listConnections({ where: { identityId } })`. Make optional with `[WebsocketService, { optional: true }]`.

### FileAfterCreateEventHandler (File Manager)

- **Import:** `import { FileAfterCreateEventHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/file/CreateFile/events.ts`
- **Usage:** Hook into file creation. Implement `.handle(event)` where `event.payload.file` is the created file. Register via `FileAfterCreateEventHandler.createImplementation({ implementation, dependencies })`.

---

## Headless CMS Features

### Content Entry Features

#### GetEntryById

- **Import:** `import { GetEntryByIdUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntryById"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentEntry/GetEntryById/abstractions.ts`
- **Usage:** Fetch single entry by exact revision ID

#### GetEntry

- **Import:** `import { GetEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetEntry"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentEntry/GetEntry/abstractions.ts`
- **Usage:** Get single entry by query parameters (where + sort)

#### ListLatestEntries

- **Import:** `import { ListLatestEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentEntry/ListEntries/abstractions.ts`
- **Usage:** List latest entries (manage API)

#### ListPublishedEntries

- **Import:** `import { ListPublishedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentEntry/ListEntries/abstractions.ts`
- **Usage:** List published entries (read API)

#### ListDeletedEntries

- **Import:** `import { ListDeletedEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentEntry/ListEntries/abstractions.ts`
- **Usage:** List deleted entries (manage API)

#### CreateEntry

- **Import:** `import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentEntry/CreateEntry/abstractions.ts`
- **Usage:** Create new content entry

#### UpdateEntry

- **Import:** `import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentEntry/UpdateEntry/abstractions.ts`
- **Usage:** Update existing content entry

#### DeleteEntry

- **Import:** `import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentEntry/DeleteEntry/abstractions.ts`
- **Usage:** Delete content entry

#### ListEntriesRepository

- **Import:** `import { ListEntriesRepository } from "@webiny/api-headless-cms/features/contentEntry/ListEntries"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentEntry/ListEntries/abstractions.ts`
- **Usage:** Repository for fetching entries from storage

### Content Model Features

#### GetModel

- **Import:** `import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentModel/GetModel/abstractions.ts`
- **Usage:** Retrieve single model by ID with access control

#### ListModels

- **Import:** `import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentModel/ListModels/abstractions.ts`
- **Usage:** List all accessible content models

#### GetModelRepository

- **Import:** `import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentModel/GetModel/abstractions.ts`
- **Usage:** Fetch model from cache (plugin + DB models)

#### ListModelsRepository

- **Import:** `import { ListModelsRepository } from "@webiny/api-headless-cms/features/contentModel/ListModels"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentModel/ListModels/abstractions.ts`
- **Usage:** Fetch all models from cache

#### ModelsFetcher

- **Import:** `import { ModelsFetcher } from "@webiny/api-headless-cms/features/contentModel/shared"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentModel/shared/abstractions.ts`
- **Usage:** Centralized model fetching with caching and access control

#### ModelCache

- **Import:** `import { ModelCache } from "@webiny/api-headless-cms/features/contentModel/shared"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentModel/shared/abstractions.ts`
- **Usage:** Cache for content models

#### PluginModelsProvider

- **Import:** `import { PluginModelsProvider } from "@webiny/api-headless-cms/features/contentModel/shared"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentModel/shared/abstractions.ts`
- **Usage:** Access to plugin-defined models

---

## Tenancy Features (Api-Core)

### GetTenantById

- **Import:** `import { GetTenantByIdUseCase } from "@webiny/api-core/features/tenancy/GetTenantById"`
- **Interface Type:** See `packages/api-core/src/features/tenancy/GetTenantById/abstractions.ts`
- **Usage:** Fetch a single tenant by ID from api-core tenant storage

### UpdateTenant (Api-Core)

- **Import:** `import { UpdateTenantUseCase } from "@webiny/api-core/features/tenancy/UpdateTenant"`
- **Interface Type:** See `packages/api-core/src/features/tenancy/UpdateTenant/abstractions.ts`
- **Usage:** Update api-core tenant fields (status, name, description, etc.)
- **Note:** Accepts `Partial<Tenant>` with fields like `status: "enabled" | "disabled"`

### CreateTenant (Api-Core)

- **Import:** `import { CreateTenantUseCase } from "@webiny/api-core/features/tenancy/CreateTenant"`
- **Interface Type:** See `packages/api-core/src/features/tenancy/CreateTenant/abstractions.ts`
- **Usage:** Create a new api-core tenant

### DeleteTenant (Api-Core)

- **Import:** `import { DeleteTenantUseCase } from "@webiny/api-core/features/tenancy/DeleteTenant"`
- **Interface Type:** See `packages/api-core/src/features/tenancy/DeleteTenant/abstractions.ts`
- **Usage:** Delete an api-core tenant

### InstallTenant (Api-Core)

- **Import:** `import { InstallTenantUseCase } from "@webiny/api-core/features/tenancy/InstallTenant"`
- **Interface Type:** See `packages/api-core/src/features/tenancy/InstallTenant/abstractions.ts`
- **Usage:** Install a tenant (sets `isInstalled: true`)

---

## Tenant Manager Features

### CreateTenantUseCase

- **Import:** `import { CreateTenantUseCase } from "packages/tenant-manager/src/api/features/CreateTenant/abstractions.js"`
- **Interface Type:** See `packages/tenant-manager/src/api/features/CreateTenant/abstractions.ts`
- **Usage:** Create a new tenant CMS entry with optional `id` and `values: JSON`
- **Note:** Creates tenant with `isInstalled: false`

### DisableTenantUseCase

- **Import:** `import { DisableTenantUseCase } from "packages/tenant-manager/src/api/features/DisableTenant/abstractions.js"`
- **Interface Type:** See `packages/tenant-manager/src/api/features/DisableTenant/abstractions.ts`
- **Usage:** Disable a tenant by setting status to "disabled" in both api-core and tenant-manager
- **Note:** Updates api-core tenant first, then tenant-manager CMS entry

### EnableTenantUseCase

- **Import:** `import { EnableTenantUseCase } from "packages/tenant-manager/src/api/features/EnableTenant/abstractions.js"`
- **Interface Type:** See `packages/tenant-manager/src/api/features/EnableTenant/abstractions.ts`
- **Usage:** Enable a tenant by setting status to "enabled" in both api-core and tenant-manager
- **Note:** Updates api-core tenant first, then tenant-manager CMS entry

### UpdateTenantUseCase (Tenant Manager)

- **Import:** `import { UpdateTenantUseCase } from "packages/tenant-manager/src/api/features/UpdateTenant/abstractions.js"`
- **Interface Type:** See `packages/tenant-manager/src/api/features/UpdateTenant/abstractions.ts`
- **Usage:** Update tenant-manager CMS entry with partial tenant values
- **Note:** Accepts `Partial<TenantValues>` including `status: "enabled" | "disabled"`

### GetTenantByIdUseCase (Tenant Manager)

- **Import:** `import { GetTenantByIdUseCase } from "packages/tenant-manager/src/api/features/GetTenantById/abstractions.js"`
- **Interface Type:** See `packages/tenant-manager/src/api/features/GetTenantById/abstractions.ts`
- **Usage:** Fetch tenant from tenant-manager CMS storage

### GetCurrentTenantUseCase

- **Import:** `import { GetCurrentTenantUseCase } from "packages/tenant-manager/src/api/features/GetCurrentTenant/abstractions.js"`
- **Interface Type:** See `packages/tenant-manager/src/api/features/GetCurrentTenant/abstractions.ts`
- **Usage:** Get the current tenant from context

### CreateAndInstallTenantUseCase

- **Import:** `import { CreateAndInstallTenantUseCase } from "packages/tenant-manager/src/api/features/CreateAndInstallTenant/abstractions.js"`
- **Interface Type:** See `packages/tenant-manager/src/api/features/CreateAndInstallTenant/abstractions.ts`
- **Usage:** Create and install a tenant in one operation

---

## Notes

- Always import abstractions from the feature path (not from package root)
- Use `Feature.Interface` type for constructor parameters
- Read the actual TypeScript interface file to see all available methods
- Interface files follow the pattern: `abstractions.ts` in the feature folder
