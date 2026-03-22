---
name: webiny-api-key-value-store-catalog
context: webiny-api
description: >
  api/key-value-store — 2 abstractions.
---

# api/key-value-store

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Class:** `GlobalKeyValueStore`
**Import:** `webiny/api/key-value-store`
**Source:** `@webiny/api-core/features/keyValueStore/index.ts`
**Description:** Global (non-tenant-scoped) key-value store.

---
**Class:** `KeyValueStore`
**Import:** `webiny/api/key-value-store`
**Source:** `@webiny/api-core/features/keyValueStore/index.ts`
**Description:** Tenant-scoped key-value store.

---
