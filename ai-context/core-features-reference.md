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

### ConnectionRegistry

- **Import:** `import { ConnectionRegistry } from "@webiny/api-websockets/exports/api.js"`
- **Interface Type:** See `packages/api-websockets/src/features/ConnectionRegistry/abstractions.ts`
- **Usage:** DI abstraction for websocket connection storage. Namespace types: `ConnectionRegistry.Interface`, `.Identity`, `.Data`, `.RegisterParams`, `.UnregisterParams`. DDB implementation in `@webiny/api-websockets-ddb`, SQL in `@webiny/api-websockets-sql`.

### WebsocketsListConnectionsUseCase

- **Import:** `import { WebsocketsListConnectionsUseCase } from "@webiny/api-websockets/exports/api.js"`
- **Interface Type:** See `packages/api-websockets/src/features/ListConnections/abstractions.ts`
- **Usage:** List active WebSocket connections. Namespace types: `.Interface`, `.Params`, `.ParamsWhere`, `.RegistryData`. Call `.execute({ where: { identityId } })` to filter. Returns `Result<ConnectionRegistry.Data[], WebsocketsError>`. Filters out stale connections (>3 hours).

### WebsocketsSendToIdentityUseCase

- **Import:** `import { WebsocketsSendToIdentityUseCase } from "@webiny/api-websockets/exports/api.js"`
- **Interface Type:** See `packages/api-websockets/src/features/SendToIdentity/abstractions.ts`
- **Usage:** Send a message to all connections for a given identity. Namespace types: `.Interface`, `.Identity`, `.Data<T>`. Call `.execute({ id: userId }, { action, data })`. Make optional with `[WebsocketsSendToIdentityUseCase, { optional: true }]`.

### WebsocketsSendToConnectionsUseCase

- **Import:** `import { WebsocketsSendToConnectionsUseCase } from "@webiny/api-websockets/exports/api.js"`
- **Interface Type:** See `packages/api-websockets/src/features/SendToConnections/abstractions.ts`
- **Usage:** Send a message to specific connections. Namespace types: `.Interface`, `.Connection`, `.Data<T>`. Call `.execute(connections, { action, data })`.

### WebsocketsDisconnectUseCase

- **Import:** `import { WebsocketsDisconnectUseCase } from "@webiny/api-websockets/exports/api.js"`
- **Interface Type:** See `packages/api-websockets/src/features/Disconnect/abstractions.ts`
- **Usage:** Disconnect WebSocket connections. Namespace types: `.Interface`, `.Params`. Call `.execute({ where: { identityId } }, notify?)` to disconnect by filter.

### WebsocketsTransport

- **Import:** `import { WebsocketsTransport } from "@webiny/api-websockets/exports/api.js"`
- **Interface Type:** See `packages/api-websockets/src/transport/abstractions/WebsocketsTransport.ts`
- **Usage:** DI abstraction for the WebSocket transport layer. Namespace types: `.Interface`, `.SendConnection`, `.DisconnectConnection`, `.SendData<T>`. NullWebsocketsTransport registered by default; AWS and server packages override.

### WebsocketsResponse

- **Import:** `import { WebsocketsResponse } from "@webiny/api-websockets/exports/api.js"`
- **Interface Type:** See `packages/api-websockets/src/response/abstractions/WebsocketsResponse.ts`
- **Usage:** DI abstraction for websocket response formatting. Namespace types: `.Interface`, `.OkParams`, `.OkResult`, `.ErrorParams`, `.ErrorResult`, `.ErrorResultError`. Default implementation auto-registered.

### WebsocketsEventValidator

- **Import:** `import { WebsocketsEventValidator } from "@webiny/api-websockets/exports/api.js"`
- **Interface Type:** See `packages/api-websockets/src/validator/abstractions/WebsocketsEventValidator.ts`
- **Usage:** DI abstraction for event validation. Namespace types: `.Interface`. AWS and server packages provide implementations.

### WebsocketsRunner

- **Import:** `import { WebsocketsRunner } from "@webiny/api-websockets/exports/api.js"`
- **Interface Type:** See `packages/api-websockets/src/runner/WebsocketsRunner.ts`
- **Usage:** Processes websocket events through route plugins. Namespace types: `.Event<T>`, `.EventData`, `.EventContext`, `.EventType`, `.Route`, `.Response`.

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

### FileUrlGenerator (File Manager)

- **Import:** `import { FileUrlGenerator } from "@webiny/api-file-manager/features/file/FileUrlGenerator/abstractions.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/file/FileUrlGenerator/abstractions.ts`
- **Usage:** Generates full URLs for files by prepending `srcPrefix` from settings. Sync `generateUrl(file)` method; optional `init()` loads settings once. Registered as singleton.

### GetFileByUrlUseCase (File Manager)

- **Import:** `import { GetFileByUrlUseCase } from "@webiny/api-file-manager/features/file/GetFileByUrl/abstractions.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/file/GetFileByUrl/abstractions.ts`
- **Usage:** Retrieve a file by its public URL. Parses URL pathname, queries files by key. Returns `Result<File | undefined, Error>`. Rejects anonymous users via `IdentityContext`.

### FmGraphQLSchema (File Manager)

- **Import:** `import { FmGraphQLSchema } from "@webiny/api-file-manager/graphql/FmGraphQLSchema.js"`
- **Interface Type:** `GraphQLSchemaFactory.Interface` from `@webiny/handler-graphql/graphql/abstractions.js`
- **Usage:** Single `GraphQLSchemaFactory` implementation for the entire FM GraphQL API (base types, settings, file CRUD, getFileByUrl). Registered in `FileManagerFeature`. Uses `builder.addTypeDefs()` and `builder.addResolver({ path, dependencies, resolver })` — no `context.container.resolve()` in resolvers.

### GetUploadPayloadUseCase (File Manager)

- **Import:** `import { GetUploadPayloadUseCase } from "@webiny/api-file-manager/features/upload/GetUploadPayload/index.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/upload/GetUploadPayload/abstractions.ts`
- **Usage:** DI abstraction for generating upload payloads (presigned URLs or HMAC tokens). `execute(file, settings)` returns `{ data, file }`. S3 implementation uses S3 presigned POST; server implementation uses HMAC tokens + upload URL. Registered by provider packages (`api-file-manager-s3` or `api-file-manager-server`).

### CreateMultiPartUploadUseCase (File Manager)

- **Import:** `import { CreateMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CreateMultiPartUpload/index.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/upload/CreateMultiPartUpload/abstractions.ts`
- **Usage:** DI abstraction for initiating multipart uploads. `execute({ file, numberOfParts })` returns `{ file, uploadId, parts }`. S3 implementation uses S3 multipart API; server implementation creates local part directories with HMAC-signed URLs.

### CompleteMultiPartUploadUseCase (File Manager)

- **Import:** `import { CompleteMultiPartUploadUseCase } from "@webiny/api-file-manager/features/upload/CompleteMultiPartUpload/index.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/upload/CompleteMultiPartUpload/abstractions.ts`
- **Usage:** DI abstraction for completing multipart uploads. `execute({ fileKey, uploadId })` returns `void`. S3 implementation uses S3 `CompleteMultipartUploadCommand`; server implementation reassembles parts from local disk.

### FmUploadGraphQLSchema (File Manager)

- **Import:** `import { FmUploadGraphQLSchema } from "@webiny/api-file-manager/graphql/FmUploadGraphQLSchema.js"`
- **Interface Type:** `GraphQLSchemaFactory.Interface` from `@webiny/handler-graphql/graphql/abstractions.js`
- **Usage:** Shared `GraphQLSchemaFactory` for FM upload operations (presigned payloads, multipart upload). Resolves `GetUploadPayloadUseCase`, `CreateMultiPartUploadUseCase`, `CompleteMultiPartUploadUseCase` from DI. Registered automatically by `FileManagerFeature`. Provider packages only need to register their implementations of the three abstractions.

### ExtractMetadataHandler (File Manager)

- **Import:** `import { ExtractMetadataHandler } from "@webiny/api-file-manager/features/extractMetadata/ExtractMetadataHandler.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/extractMetadata/ExtractMetadataHandler.ts`
- **Usage:** Shared event handler that triggers the `fileManagerExtractMetadata` background task after a file is created. Uses `FileAfterCreateEventHandler.createImplementation` with `TaskService` as a dependency. Registered by provider packages (`api-file-manager-s3` or `api-file-manager-server`) alongside their storage-specific `ExtractMetadataTaskDefinition`.

### ExtractMetadataInput (File Manager)

- **Import:** `import type { ExtractMetadataInput } from "@webiny/api-file-manager/features/extractMetadata/ExtractMetadataInput.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/extractMetadata/ExtractMetadataInput.ts`
- **Usage:** Input interface for the metadata extraction task (`{ fileId: string }`). Used by both `ExtractMetadataHandler` and provider-specific `ExtractMetadataTask` implementations.

### AssetFactory (File Manager — Asset Delivery)

- **Import:** `import { AssetFactory } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/assetDelivery/Asset/abstractions.ts`
- **Usage:** DI factory for creating `Asset` instances. `AssetFactory.Interface` has a `create(data: AssetData): Asset` method. Registered by `AssetDeliveryFeature`. Used by provider-specific resolvers (`S3AssetResolver`, `LocalAssetResolver`) instead of direct `new Asset()` calls. The `Asset.withProps()` copy pattern remains internal.

### AssetRequestFactory (File Manager — Asset Delivery)

- **Import:** `import { AssetRequestFactory } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/assetDelivery/AssetRequest/abstractions.ts`
- **Usage:** DI factory for creating `AssetRequest` instances. `AssetRequestFactory.Interface` has a `create(data: AssetRequestData): AssetRequest` method. Registered by `AssetDeliveryFeature`. Used by `FilesAssetRequestResolver` and `PrivateFileAssetRequestResolver` instead of direct `new AssetRequest()` calls.

### StreamAssetReply (File Manager — Asset Delivery)

- **Import:** `import { StreamAssetReply } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/assetDelivery/StreamAssetReply/abstractions.ts`
- **Usage:** DI factory abstraction for creating streaming asset replies (HTTP 200, cache-control, content-type). Default implementation registered by `AssetDeliveryFeature`. `StreamAssetReply.Interface` has a `create(asset): AssetReply` method. Decoratable by provider packages if they need custom reply behavior.

### ObjectKey (File Manager — Asset Delivery)

- **Import:** `import { ObjectKey } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/assetDelivery/ObjectKey/abstractions.ts`
- **Usage:** DI factory for parsing bucket keys (`tenants/<tenant>/files/<id>/...`). `ObjectKey.Interface` has `from(key): ObjectKey.Instance` where the instance exposes `id()` and `relativeKey()`. Registered by `AssetDeliveryFeature`. Used by asset resolvers and threat detection in both provider packages.

### MetadataWriter (File Manager — Upload)

- **Import:** `import { MetadataWriter } from "@webiny/api-file-manager/features/upload/WriteFileMetadata/abstractions.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/upload/WriteFileMetadata/abstractions.ts`
- **Usage:** DI abstraction for writing file metadata to the key-value store. `MetadataWriter.Interface` has a `write(files: File[]): Promise<void>` method. Registered by `WriteFileMetadataFeature`. Used by `WriteMetadataAfterCreateHandler` and `WriteMetadataAfterBatchCreateHandler` event handlers.

### MetadataReader (File Manager — Upload)

- **Import:** `import { MetadataReader } from "@webiny/api-file-manager/features/upload/ReadFileMetadata/abstractions.js"`
- **Interface Type:** See `packages/api-file-manager/src/features/upload/ReadFileMetadata/abstractions.ts`
- **Usage:** DI abstraction for reading file metadata from the key-value store. `MetadataReader.Interface` has a `read(fileId: string): Promise<AssetMetadata | undefined>` method. Registered by `ReadFileMetadataFeature`. Used by `ExtractMetadataTask` and `GetFileContentsByIdUseCase` in both provider packages.

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

## Database Features

### DbRegistry

- **Import:** `import { DbRegistry } from "@webiny/db/exports/api/db.js"`
- **Interface Type:** See `packages/db/src/features/DbRegistry/abstractions.ts`
- **Usage:** Registry for DynamoDB entities/tables. Registered as singleton via `DbRegistryFeature`. Provides `register()`, `getOneItem()`, `getItem()`, `getItems()` methods for looking up registered entities by app and tags. Namespace exports `DbRegistry.Interface`, `DbRegistry.RegisterParams`, `DbRegistry.RegistryItem`.

### OpenSearchClient

- **Import:** `import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js"`
- **Interface Type:** See `packages/api-opensearch/src/features/OpenSearchClient/abstraction.ts`
- **Usage:** DI wrapper around the OpenSearch `Client`. Call `use()` to get the raw client. Registered as an instance by `registerOpenSearchCore()` — receives the client directly, no intermediate context layer.

### OpenSearchClientFactory

- **Import:** `import { OpenSearchClientFactory } from "@webiny/api-opensearch/exports/api/opensearch.js"`
- **Interface Type:** See `packages/api-opensearch/src/features/OpenSearchClientFactory/abstraction.ts`
- **Usage:** Factory for creating new OpenSearch client instances. Registered by `registerOpenSearchCore()`.

### OpenSearchQueryBuilderOperator

- **Import:** `import { OpenSearchQueryBuilderOperator } from "@webiny/api-opensearch/exports/api/opensearch.js"`
- **Interface Type:** See `packages/api-opensearch/src/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperator.ts`
- **Usage:** DI abstraction for query builder operators (eq, not, contains, gt, etc.). Each operator is registered as a singleton via `createImplementation`. 15 built-in operators provided by `OpenSearchQueryBuilderOperatorFeature`.

### OpenSearchQueryBuilderOperatorRegistry

- **Import:** `import { OpenSearchQueryBuilderOperatorRegistry } from "@webiny/api-opensearch/exports/api/opensearch.js"`
- **Interface Type:** See `packages/api-opensearch/src/features/OpenSearchQueryBuilderOperator/abstractions/OpenSearchQueryBuilderOperatorRegistry.ts`
- **Usage:** Registry that collects all `OpenSearchQueryBuilderOperator` implementations via `{ multiple: true }` DI. Provides `get(operatorName)` and `getAll()`. Registered as singleton by `OpenSearchQueryBuilderOperatorFeature`.

### OpenSearchField

- **Import:** `import { OpenSearchField } from "@webiny/api-opensearch/exports/api/opensearch.js"`
- **Interface Type:** See `packages/api-opensearch/src/features/OpenSearchField/abstractions/OpenSearchField.ts`
- **Usage:** DI abstraction for OpenSearch field descriptors. Carries field metadata (`field`, `path`, `keyword`, `unmappedType`, `sortable`, `searchable`) and provides `getPath()`, `getBasePath()`, `getSortOptions()`, `toSearchValue()`. Instances are created via `OpenSearchFieldFactory`.

### OpenSearchFieldFactory

- **Import:** `import { OpenSearchFieldFactory } from "@webiny/api-opensearch/exports/api/opensearch.js"`
- **Interface Type:** See `packages/api-opensearch/src/features/OpenSearchField/abstractions/OpenSearchFieldFactory.ts`
- **Usage:** Factory for creating `OpenSearchField.Interface` instances from params. Registered as singleton by `OpenSearchFieldFeature`. Use `factory.create({ field, path, keyword, ... })` instead of direct class instantiation.

### OpenSearchFieldAll

- **Import:** `import { OpenSearchFieldAll } from "@webiny/api-opensearch/exports/api/opensearch.js"`
- **Usage:** The wildcard sentinel value (`"*"`) used to match any field path. Exported as a standalone const (not a namespace member) due to a Rspack/swc bundler limitation with namespace runtime values.

### OpenSearchIndex

- **Import:** `import { OpenSearchIndex } from "@webiny/api-opensearch/exports/api/opensearch.js"`
- **Interface Type:** See `packages/api-opensearch/src/features/OpenSearchIndex/abstractions/OpenSearchIndex.ts`
- **Usage:** DI abstraction for OpenSearch index configuration. Provides `readonly body: OpenSearchIndexRequestBody` and `canUse(): boolean`. Register implementations to provide index settings.

### OpenSearchIndexRegistry

- **Import:** `import { OpenSearchIndexRegistry } from "@webiny/api-opensearch/exports/api/opensearch.js"`
- **Interface Type:** See `packages/api-opensearch/src/features/OpenSearchIndex/abstractions/OpenSearchIndexRegistry.ts`
- **Usage:** Registry that collects all `OpenSearchIndex` implementations via `{ multiple: true }` DI. Provides `getLastAdded()` (returns the last registered usable index) and `getAll()`. Registered as singleton by `OpenSearchIndexFeature`.

---

## Notes

- Always import abstractions from the feature path (not from package root)
- Use `Feature.Interface` type for constructor parameters
- Read the actual TypeScript interface file to see all available methods
- Interface files follow the pattern: `abstractions.ts` in the feature folder
