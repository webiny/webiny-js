---
name: webiny-api-tenancy-catalog
context: webiny-api
description: >
  API — Tenancy — 17 abstractions.
  Tenant lifecycle and installation event handlers and use cases.
---

# API — Tenancy

Tenant lifecycle and installation event handlers and use cases.

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Name:** `AppInstaller`
**Import:** `import { AppInstaller } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/InstallTenant/index.ts`
**Description:** Install an application on a tenant with rollback support.

---
**Name:** `CreateTenantRepository`
**Import:** `import { CreateTenantRepository } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/CreateTenant/index.ts`
**Description:** Persist a newly created tenant.

---
**Name:** `CreateTenantUseCase`
**Import:** `import { CreateTenantUseCase } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/CreateTenant/index.ts`
**Description:** Create a new tenant.

---
**Name:** `DeleteTenantRepository`
**Import:** `import { DeleteTenantRepository } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/DeleteTenant/index.ts`
**Description:** Persist tenant deletion.

---
**Name:** `DeleteTenantUseCase`
**Import:** `import { DeleteTenantUseCase } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/DeleteTenant/index.ts`
**Description:** Delete a tenant.

---
**Name:** `GetTenantByIdUseCase`
**Import:** `import { GetTenantByIdUseCase } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/GetTenantById/index.ts`
**Description:** Retrieve a tenant by its ID.

---
**Name:** `InstallTenantUseCase`
**Import:** `import { InstallTenantUseCase } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/InstallTenant/index.ts`
**Description:** Run all app installers for a tenant.

---
**Name:** `TenantAfterCreateEventHandler`
**Import:** `import { TenantAfterCreateEventHandler } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/CreateTenant/index.ts`
**Description:** Hook into tenant lifecycle after a tenant is created.

---
**Name:** `TenantAfterDeleteEventHandler`
**Import:** `import { TenantAfterDeleteEventHandler } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/DeleteTenant/index.ts`
**Description:** Hook into tenant lifecycle after a tenant is deleted.

---
**Name:** `TenantAfterUpdateEventHandler`
**Import:** `import { TenantAfterUpdateEventHandler } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/UpdateTenant/index.ts`
**Description:** Hook into tenant lifecycle after a tenant is updated.

---
**Name:** `TenantBeforeCreateEventHandler`
**Import:** `import { TenantBeforeCreateEventHandler } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/CreateTenant/index.ts`
**Description:** Hook into tenant lifecycle before a tenant is created.

---
**Name:** `TenantBeforeDeleteEventHandler`
**Import:** `import { TenantBeforeDeleteEventHandler } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/DeleteTenant/index.ts`
**Description:** Hook into tenant lifecycle before a tenant is deleted.

---
**Name:** `TenantBeforeUpdateEventHandler`
**Import:** `import { TenantBeforeUpdateEventHandler } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/UpdateTenant/index.ts`
**Description:** Hook into tenant lifecycle before a tenant is updated.

---
**Name:** `TenantContext`
**Import:** `import { TenantContext } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/TenantContext/index.ts`
**Description:** Provides access to the current tenant and tenant-scoped execution.

---
**Name:** `TenantInstalledEventHandler`
**Import:** `import { TenantInstalledEventHandler } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/InstallTenant/index.ts`
**Description:** Hook into tenant lifecycle after a tenant is installed.

---
**Name:** `UpdateTenantRepository`
**Import:** `import { UpdateTenantRepository } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/UpdateTenant/index.ts`
**Description:** Persist tenant updates.

---
**Name:** `UpdateTenantUseCase`
**Import:** `import { UpdateTenantUseCase } from "webiny/api/tenancy"`
**Source:** `@webiny/api-core/features/tenancy/UpdateTenant/index.ts`
**Description:** Update an existing tenant.

---
