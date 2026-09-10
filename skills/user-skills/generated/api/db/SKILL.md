---
name: webiny-api-db-catalog
description: >
  api/db — 6 abstractions.
---

# api/db

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---

**Name:** `DbRegistry`
**Import:** `import { DbRegistry } from "webiny/api/db"`
**Source:** `@webiny/db/features/DbRegistry/index.ts`

---

**Name:** `DbRegistryFeature`
**Import:** `import { DbRegistryFeature } from "webiny/api/db"`
**Source:** `@webiny/db/features/DbRegistry/index.ts`

---

**Name:** `DynamoDBClient`
**Import:** `import { DynamoDBClient } from "webiny/api/db"`
**Source:** `@webiny/db-dynamodb/feature/DynamoDBClient/index.ts`

---

**Name:** `FilterUtil`
**Import:** `import { FilterUtil } from "webiny/api/db"`
**Source:** `@webiny/db-dynamodb/feature/FilterUtil/index.ts`

---

**Name:** `ValueFilter`
**Import:** `import { ValueFilter } from "webiny/api/db"`
**Source:** `@webiny/db-dynamodb/feature/ValueFilter/index.ts`

---

**Name:** `ValueFilterRegistry`
**Import:** `import { ValueFilterRegistry } from "webiny/api/db"`
**Source:** `@webiny/db-dynamodb/feature/ValueFilter/index.ts`

---
