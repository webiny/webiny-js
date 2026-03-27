---
name: webiny-admin-env-config-catalog
context: webiny-api
description: >
  admin/env-config — 2 abstractions.
---

# admin/env-config

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---

**Name:** `EnvConfig`
**Import:** `import { EnvConfig } from "webiny/admin/env-config"`
**Source:** `@webiny/app/features/envConfig/index.ts`

---

**Name:** `useEnvConfig`
**Import:** `import { useEnvConfig } from "webiny/admin/env-config"`
**Source:** `@webiny/app/presentation/envConfig/useEnvConfig.ts`
**Description:** Returns the EnvConfig instance from DI.
Useful when you want to access EnvConfig inside components and hooks.

---
