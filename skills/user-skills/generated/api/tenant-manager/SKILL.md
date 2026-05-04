---
name: webiny-api-tenant-manager-catalog
context: webiny-api
description: >
  API — Tenant Manager — 9 abstractions.
  Tenant management event handlers and use cases.
---

# API — Tenant Manager

Tenant management event handlers and use cases.

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---

**Name:** `CreateAndInstallTenantUseCase`
**Import:** `import { CreateAndInstallTenantUseCase } from "webiny/api/tenant-manager"`
**Source:** `@webiny/tenant-manager/api/features/CreateAndInstallTenant/abstractions.ts`

---

**Name:** `CreateTenantUseCase`
**Import:** `import { CreateTenantUseCase } from "webiny/api/tenant-manager"`
**Source:** `@webiny/tenant-manager/api/features/CreateTenant/abstractions.ts`

---

**Name:** `DisableTenantUseCase`
**Import:** `import { DisableTenantUseCase } from "webiny/api/tenant-manager"`
**Source:** `@webiny/tenant-manager/api/features/DisableTenant/abstractions.ts`

---

**Name:** `EnableTenantUseCase`
**Import:** `import { EnableTenantUseCase } from "webiny/api/tenant-manager"`
**Source:** `@webiny/tenant-manager/api/features/EnableTenant/abstractions.ts`

---

**Name:** `GetCurrentTenantUseCase`
**Import:** `import { GetCurrentTenantUseCase } from "webiny/api/tenant-manager"`
**Source:** `@webiny/tenant-manager/api/features/GetCurrentTenant/abstractions.ts`

---

**Name:** `GetTenantByIdUseCase`
**Import:** `import { GetTenantByIdUseCase } from "webiny/api/tenant-manager"`
**Source:** `@webiny/tenant-manager/api/features/GetTenantById/abstractions.ts`

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

**Name:** `UpdateTenantUseCase`
**Import:** `import { UpdateTenantUseCase } from "webiny/api/tenant-manager"`
**Source:** `@webiny/tenant-manager/api/features/UpdateTenant/abstractions.ts`

---
