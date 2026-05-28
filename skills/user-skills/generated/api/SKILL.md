---
name: webiny-api-catalog
context: webiny-api
description: >
  api — 21 abstractions.
---

# api

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---

**Name:** `Ai`
**Import:** `import { Ai } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`
**Description:** Interact with AI language models using registered providers.

---

**Name:** `AiConnectionFactory`
**Import:** `import { AiConnectionFactory } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`
**Description:** Factory that asynchronously produces an AiConnection.

---

**Name:** `AiSdk`
**Import:** `import { AiSdk } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`
**Description:** A single AI SDK instance (e.g. OpenAI, Anthropic) that resolves model instances.

---

**Name:** `AiSdkFactory`
**Import:** `import { AiSdkFactory } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`
**Description:** Factory that asynchronously initialises an AI SDK. Register one per provider namespace.

---

**Name:** `BaseError`
**Import:** `import { BaseError } from "webiny/api"`
**Source:** `@webiny/feature/api/index.ts`

---

**Name:** `BuildParam`
**Import:** `import { BuildParam } from "webiny/api"`
**Source:** `@webiny/api-core/features/buildParams/index.ts`
**Description:** A single build-time configuration parameter.

---

**Name:** `BuildParams`
**Import:** `import { BuildParams } from "webiny/api"`
**Source:** `@webiny/api-core/features/buildParams/index.ts`
**Description:** Access build-time configuration parameters.

---

**Name:** `Compression`
**Import:** `import { Compression } from "webiny/api"`
**Source:** `@webiny/utils/features/compression/abstractions/Compression.ts`

---

**Name:** `CompressionHandler`
**Import:** `import { CompressionHandler } from "webiny/api"`
**Source:** `@webiny/utils/features/compression/abstractions/CompressionHandler.ts`

---

**Name:** `createAbstraction`
**Import:** `import { createAbstraction } from "webiny/api"`
**Source:** `@webiny/feature/api/index.ts`

---

**Name:** `createFeature`
**Import:** `import { createFeature } from "webiny/api"`
**Source:** `@webiny/feature/api/index.ts`

---

**Name:** `DomainEvent`
**Import:** `import { DomainEvent } from "webiny/api"`
**Source:** `@webiny/api-core/features/eventPublisher/index.ts`
**Description:** Base class for all domain events.

---

**Name:** `Encryption`
**Import:** `import { Encryption } from "webiny/api"`
**Source:** `@webiny/api-core/features/encryption/index.ts`
**Description:** Symmetric encryption and decryption using a configured secret key.

---

**Name:** `EventPublisher`
**Import:** `import { EventPublisher } from "webiny/api"`
**Source:** `@webiny/api-core/features/eventPublisher/index.ts`
**Description:** Publish domain events to registered handlers.

---

**Name:** `GlobalKeyValueStore`
**Import:** `import { GlobalKeyValueStore } from "webiny/api"`
**Source:** `@webiny/api-core/features/keyValueStore/index.ts`
**Description:** Global (non-tenant-scoped) key-value store.

---

**Name:** `IAiConnection`
**Kind:** type
**Import:** `import type { IAiConnection } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`

---

**Name:** `IAiConnectionInline`
**Kind:** type
**Import:** `import type { IAiConnectionInline } from "webiny/api"`
**Source:** `@webiny/api-core/features/ai/index.ts`

---

**Name:** `KeyValueStore`
**Import:** `import { KeyValueStore } from "webiny/api"`
**Source:** `@webiny/api-core/features/keyValueStore/index.ts`
**Description:** Tenant-scoped key-value store.

---

**Name:** `Logger`
**Import:** `import { Logger } from "webiny/api"`
**Source:** `@webiny/api-core/features/logger/index.ts`
**Description:** Structured logging with multiple log levels.

---

**Name:** `Result`
**Import:** `import { Result } from "webiny/api"`
**Source:** `@webiny/feature/api/index.ts`
**Description:** A container type that represents either a successful result (`ok`) or a failure (`fail`).
Inspired by functional programming constructs like `Either` or `Result` in other languages.

---

**Name:** `Route`
**Import:** `import { Route } from "webiny/api"`
**Source:** `@webiny/handler/abstractions/Route.ts`

---
