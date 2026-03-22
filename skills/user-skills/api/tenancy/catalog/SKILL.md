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
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Class:** `AppInstaller`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/InstallTenant/index.ts`
**Description:** Install an application on a tenant with rollback support.

---
**Class:** `CreateTenantRepository`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/CreateTenant/index.ts`
**Description:** Persist a newly created tenant.

---
**Class:** `CreateTenantUseCase`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/CreateTenant/index.ts`
**Description:** Create a new tenant.

---
**Class:** `DeleteTenantRepository`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/DeleteTenant/index.ts`
**Description:** Persist tenant deletion.

---
**Class:** `DeleteTenantUseCase`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/DeleteTenant/index.ts`
**Description:** Delete a tenant.

---
**Class:** `GetTenantByIdUseCase`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/GetTenantById/index.ts`
**Description:** Retrieve a tenant by its ID.

---
**Class:** `InstallTenantUseCase`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/InstallTenant/index.ts`
**Description:** Run all app installers for a tenant.

---
**Class:** `TenantAfterCreateEventHandler`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/CreateTenant/index.ts`
**Description:** Hook into tenant lifecycle after a tenant is created.

---
**Class:** `TenantAfterDeleteEventHandler`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/DeleteTenant/index.ts`
**Description:** Hook into tenant lifecycle after a tenant is deleted.

---
**Class:** `TenantAfterUpdateEventHandler`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/UpdateTenant/index.ts`
**Description:** Hook into tenant lifecycle after a tenant is updated.

---
**Class:** `TenantBeforeCreateEventHandler`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/CreateTenant/index.ts`
**Description:** Hook into tenant lifecycle before a tenant is created.

---
**Class:** `TenantBeforeDeleteEventHandler`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/DeleteTenant/index.ts`
**Description:** Hook into tenant lifecycle before a tenant is deleted.

---
**Class:** `TenantBeforeUpdateEventHandler`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/UpdateTenant/index.ts`
**Description:** Hook into tenant lifecycle before a tenant is updated.

---
**Class:** `TenantContext`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/TenantContext/index.ts`
**Description:** Provides access to the current tenant and tenant-scoped execution.

---
**Class:** `TenantInstalledEventHandler`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/InstallTenant/index.ts`
**Description:** Hook into tenant lifecycle after a tenant is installed.

---
**Class:** `UpdateTenantRepository`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/UpdateTenant/index.ts`
**Description:** Persist tenant updates.

---
**Class:** `UpdateTenantUseCase`
**Import:** `webiny/api/tenancy`
**Source:** `@webiny/api-core/features/tenancy/UpdateTenant/index.ts`
**Description:** Update an existing tenant.

---
