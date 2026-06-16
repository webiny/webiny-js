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

### WebsocketsTransport

- **Import:** `import { WebsocketsTransport } from "@webiny/api-websockets"`
- **Interface Type:** See `packages/api-websockets/src/transport/abstractions/WebsocketsTransport.ts`
- **Usage:** DI abstraction for the WebSocket transport layer. Namespace types: `WebsocketsTransport.Interface`, `.SendConnection`, `.DisconnectConnection`, `.SendData<T>`. AWS implementation registered via `createAwsWebsockets()` from `@webiny/api-websockets-aws`. Server implementation registered via `createServerWebsockets()` from `@webiny/api-websockets-server`.

### WebsocketsServerAdapter

- **Import:** `import { WebsocketsServerAdapter } from "@webiny/api-websockets-server"`
- **Interface Type:** See `packages/api-websockets-server/src/abstractions.ts`
- **Usage:** DI abstraction wrapping the WebSocket library. Default implementation uses Node built-in `ws`. Namespace types: `WebsocketsServerAdapter.Interface<TSocket>`. Swap to use a different WS library (uWebSockets, etc.) via `WebsocketsServerAdapter.createImplementation(...)`.

### WebsocketsUpgradeHandler

- **Import:** `import { WebsocketsUpgradeHandler } from "@webiny/api-websockets-server"`
- **Interface Type:** See `packages/api-websockets-server/src/abstractions.ts`
- **Usage:** Pre-connection filtering during HTTP upgrade (CORS, rate limiting, IP allowlists). Default accepts all. Namespace types: `WebsocketsUpgradeHandler.Interface`, `.Decision`. Swap via `WebsocketsUpgradeHandler.createImplementation(...)`.

### WebsocketsConnectionManager

- **Import:** `import { WebsocketsConnectionManager } from "@webiny/api-websockets-server"`
- **Interface Type:** See `packages/api-websockets-server/src/abstractions.ts`
- **Usage:** Manages local socket map, syncs with SQL connection registry, handles heartbeat/TTL updates. Namespace types: `WebsocketsConnectionManager.Interface<TSocket>`, `.AddParams<TSocket>`, `.ConnectionMetadata`.

### Server Factory Functions

- **Import:** `import { createWebsocketsServer, attachWebsocketsServer } from "@webiny/api-websockets-server"`
- **Usage:** `createWebsocketsServer({ port, host, plugins, heartbeatInterval })` for standalone mode (creates HTTP+WS server). `attachWebsocketsServer({ server, plugins, heartbeatInterval })` for attach mode (uses existing HTTP server). Both return `IWebsocketsServer` with `start()`/`stop()`/`port()`.

### FileAfterCreateEventHandler (File Manager)

- **Import:** `import { FileAfterCreateEventHandler } from "@webiny/api-file-manager/features/file/CreateFile/events.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/file/CreateFile/events.ts`
- **Usage:** Hook into file creation. Implement `.handle(event)` where `event.payload.file` is the created file. Register via `FileAfterCreateEventHandler.createImplementation({ implementation, dependencies })`.

### Encryption

- **Import:** `import { Encryption } from "@webiny/api-core/features/encryption"`
- **Interface Type:** See `packages/api-core/src/features/encryption/abstractions.ts`
- **Usage:** Synchronous symmetric encrypt/decrypt backed by AES-GCM. Reads `EncryptionPassphrase`, `EncryptionSalt`, `EncryptionAlgorithm` from `BuildParams` (driven by `<Infra.Encryption>` in `webiny.config.tsx`). When no passphrase is configured, `encrypt`/`decrypt` are no-op passthroughs — callers receive and emit plaintext. Use this wherever a feature needs to protect secrets at rest.

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

#### Entry Data Factory Features

Injectable factories that transform raw input into domain `CmsEntry` objects. Live in `features/contentEntry/entryDataFactories/`. All are singletons. Token scope: `"Cms/Entry/<FactoryName>"`.

**`CreateEntryDataFactory`**

- **Import:** `import { CreateEntryDataFactory } from "@webiny/api-headless-cms/features/contentEntry/entryDataFactories/CreateEntryDataFactory"`
- **Usage:** `factory.create(model, rawInput, options?)` — new entry from raw input; handles defaults, validation, reference mapping, identity, status

**`UpdateEntryDataFactory`**

- **Import:** `import { UpdateEntryDataFactory } from "@webiny/api-headless-cms/features/contentEntry/entryDataFactories/UpdateEntryDataFactory"`
- **Usage:** `factory.create(model, rawInput, originalEntry, options?, metaInput?)` — update; merges values, validates, maps references

**`CreateEntryRevisionFromDataFactory`**

- **Import:** `import { CreateEntryRevisionFromDataFactory } from "@webiny/api-headless-cms/features/contentEntry/entryDataFactories/CreateEntryRevisionFromDataFactory"`
- **Usage:** `factory.create(sourceId, model, rawInput, originalEntry, latestStorageEntry, options?)` — new revision; increments version, copies entry-level publishing meta

**`CreatePublishEntryDataFactory`**

- **Import:** `import { CreatePublishEntryDataFactory } from "@webiny/api-headless-cms/features/contentEntry/entryDataFactories/CreatePublishEntryDataFactory"`
- **Usage:** `factory.create(model, originalEntry, latestEntry)` — transition to published; validates, sets status + locked + publishing timestamps

**`CreateUnpublishEntryDataFactory`**

- **Import:** `import { CreateUnpublishEntryDataFactory } from "@webiny/api-headless-cms/features/contentEntry/entryDataFactories/CreateUnpublishEntryDataFactory"`
- **Usage:** `factory.create(originalEntry)` — transition to unpublished; clears live pointer, updates timestamps

**`CreateRepublishEntryDataFactory`**

- **Import:** `import { CreateRepublishEntryDataFactory } from "@webiny/api-headless-cms/features/contentEntry/entryDataFactories/CreateRepublishEntryDataFactory"`
- **Usage:** `factory.create(model, originalEntry)` — re-publish; remaps references, restores published state

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

## Mailer Features

### MailerService

- **Import:** `import { MailerService } from "@webiny/api-mailer"`
- **Interface Type:** See `packages/api-mailer/src/domain/MailerService/abstractions.ts`
- **Usage:** Send email via the currently-active transport. Resolves settings through `GetSettingsRepository` (code source first, KV second) and delegates to a `MailTransportFactory`. Returns `Result<TransportSendResponse, NoTransportAvailable | NoSettingsConfigured | TransportSend>`.

### SendMailUseCase

- **Import:** `import { SendMailUseCase } from "@webiny/api-mailer/features/SendMail"`
- **Interface Type:** See `packages/api-mailer/src/features/SendMail/abstractions.ts`
- **Usage:** Validated wrapper around `MailerService.sendMail`. Accepts `TransportSendData` (`to`, `from`, `subject`, `text|html`, …), validates with zod, publishes `MailBeforeSend`/`MailAfterSend`/`MailSendError` domain events.

### GetSettingsUseCase (Mailer)

- **Import:** `import { GetSettingsUseCase } from "@webiny/api-mailer/features/GetSettings"`
- **Interface Type:** See `packages/api-mailer/src/features/GetSettings/abstractions.ts`
- **Usage:** Read mailer transport settings. Takes a `transportName` argument; returns `{ settings: TransportSettings | null, source: "code" | "storage" | null }`. `source: "code"` means `<Infra.Mailer.*>` is driving the config; `"storage"` means settings were saved via the admin UI.

### SaveSettingsUseCase (Mailer)

- **Import:** `import { SaveSettingsUseCase } from "@webiny/api-mailer/features/SaveSettings"`
- **Interface Type:** See `packages/api-mailer/src/features/SaveSettings/abstractions.ts`
- **Usage:** Persist mailer settings to the KV store. Requires `mailer.settings` permission. Fails with `SettingsLockedByCode` when code-driven settings exist for the active transport. Password is always stripped from event payloads (`MailerSettingsBeforeSaveEvent`, `MailerSettingsAfterSaveEvent`).

### CodeMailerSettings

- **Import:** `import { CodeMailerSettings } from "@webiny/api-mailer/domain/CodeMailerSettings/abstractions"`
- **Interface Type:** See `packages/api-mailer/src/domain/CodeMailerSettings/abstractions.ts`
- **Usage:** Read code-driven mailer settings from `BuildParams`. `get(transportName)` returns the SMTP settings if `<Infra.Mailer.Smtp>` registered a `Mailer.SmtpSettings` build param; returns `null` otherwise. When non-null, code settings win over the KV store in `GetSettingsRepository`.

### ActiveTransport (Mailer)

- **Import:** `import { ActiveTransport } from "@webiny/api-mailer/domain/MailTransport/abstractions"`
- **Interface Type:** See `packages/api-mailer/src/domain/MailTransport/abstractions.ts`
- **Usage:** Centralized resolver for the currently-active transport. `name()` returns the last-registered `MailTransportFactory`'s `name` (`"Mailer/SmtpTransport"` or `"Mailer/DummyTransport"` for built-ins), or `null` when none are registered. Used by `MailerService` and `SaveSettingsUseCase` to know which transport they're dealing with.

### MailTransportFactory

- **Import:** `import { MailTransportFactory } from "@webiny/api-mailer/domain/MailTransport/abstractions"`
- **Interface Type:** See `packages/api-mailer/src/domain/MailTransport/abstractions.ts`
- **Usage:** Register a custom mail transport. Implementations expose a stable `name: string` (used to route code-driven settings from `<Infra.Mailer.*>` BuildParams) and a `createTransport(settings)` factory method. Multiple factories can be registered; `ActiveTransport.name()` returns the last-registered one.

---

## Notes

- Always import abstractions from the feature path (not from package root)
- Use `Feature.Interface` type for constructor parameters
- Read the actual TypeScript interface file to see all available methods
- Interface files follow the pattern: `abstractions.ts` in the feature folder
