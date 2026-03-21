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

1. Find the abstraction you need in the table below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

| Class | Import | Source |
|-------|--------|--------|
| `AppInstaller` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/InstallTenant/index.ts` |
| `CreateTenantRepository` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/CreateTenant/index.ts` |
| `CreateTenantUseCase` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/CreateTenant/index.ts` |
| `DeleteTenantRepository` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/DeleteTenant/index.ts` |
| `DeleteTenantUseCase` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/DeleteTenant/index.ts` |
| `GetTenantByIdUseCase` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/GetTenantById/index.ts` |
| `InstallTenantUseCase` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/InstallTenant/index.ts` |
| `TenantAfterCreateEventHandler` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/CreateTenant/index.ts` |
| `TenantAfterDeleteEventHandler` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/DeleteTenant/index.ts` |
| `TenantAfterUpdateEventHandler` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/UpdateTenant/index.ts` |
| `TenantBeforeCreateEventHandler` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/CreateTenant/index.ts` |
| `TenantBeforeDeleteEventHandler` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/DeleteTenant/index.ts` |
| `TenantBeforeUpdateEventHandler` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/UpdateTenant/index.ts` |
| `TenantContext` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/TenantContext/index.ts` |
| `TenantInstalledEventHandler` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/InstallTenant/index.ts` |
| `UpdateTenantRepository` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/UpdateTenant/index.ts` |
| `UpdateTenantUseCase` | `webiny/api/tenancy` | `@webiny/api-core/features/tenancy/UpdateTenant/index.ts` |
