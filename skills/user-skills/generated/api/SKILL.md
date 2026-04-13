---
name: webiny-api-catalog
context: webiny-api
description: >
  api — 11 abstractions.
---

# api

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`

## Abstractions

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
