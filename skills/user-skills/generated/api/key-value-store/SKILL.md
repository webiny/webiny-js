---
name: webiny-api-key-value-store-catalog
context: webiny-api
description: >
  api/key-value-store — 2 abstractions.
---

# api/key-value-store

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Name:** `GlobalKeyValueStore`
**Import:** `import { GlobalKeyValueStore } from "webiny/api/key-value-store"`
**Source:** `@webiny/api-core/features/keyValueStore/index.ts`
**Description:** Global (non-tenant-scoped) key-value store.

---
**Name:** `KeyValueStore`
**Import:** `import { KeyValueStore } from "webiny/api/key-value-store"`
**Source:** `@webiny/api-core/features/keyValueStore/index.ts`
**Description:** Tenant-scoped key-value store.

---
