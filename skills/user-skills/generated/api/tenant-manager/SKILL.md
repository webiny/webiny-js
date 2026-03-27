---
name: webiny-api-tenant-manager-catalog
context: webiny-api
description: >
  API — Tenant Manager — 2 abstractions.
  Tenant management event handlers and use cases.
---

# API — Tenant Manager

Tenant management event handlers and use cases.

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---

**Name:** `TenantExtensions`
**Kind:** type
**Import:** `import type { TenantExtensions } from "webiny/api/tenant-manager"`
**Source:** `@webiny/tenant-manager/shared/Tenant.ts`

---

**Name:** `TenantModelExtension`
**Import:** `import { TenantModelExtension } from "webiny/api/tenant-manager"`
**Source:** `@webiny/tenant-manager/api/domain/TenantModelExtension.ts`
**Description:** Extend the tenant content model with custom fields.

---
