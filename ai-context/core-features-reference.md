# Core Features Reference

This document provides the correct import paths and type definitions for commonly used features in the Webiny backend codebase (packages named with `api-*`).

**How to use this document:**
1. Find the feature you need to use
2. Copy the exact import path
3. Read the linked TypeScript file to see the complete interface and available methods

---

## Features

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

#### ListEntries
- **Import:** `import { ListEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/ListEntries"`
- **Interface Type:** See `packages/api-headless-cms/src/features/contentEntry/ListEntries/abstractions.ts`
- **Usage:** Base abstraction for listing entries with filtering and pagination

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

## Notes

- Always import abstractions from the feature path (not from package root)
- Use `Feature.Interface` type for constructor parameters
- Read the actual TypeScript interface file to see all available methods
- Interface files follow the pattern: `abstractions.ts` in the feature folder
