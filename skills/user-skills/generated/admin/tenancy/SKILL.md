---
name: webiny-admin-tenancy-catalog
context: webiny-api
description: >
  admin/tenancy — 9 abstractions.
---

# admin/tenancy

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---

**Name:** `IsNotRootTenant`
**Import:** `import { IsNotRootTenant } from "webiny/admin/tenancy"`
**Source:** `@webiny/tenant-manager/admin/IsRootTenant.tsx`

---

**Name:** `IsRootTenant`
**Import:** `import { IsRootTenant } from "webiny/admin/tenancy"`
**Source:** `@webiny/tenant-manager/admin/IsRootTenant.tsx`

---

**Name:** `IsTenant`
**Import:** `import { IsTenant } from "webiny/admin/tenancy"`
**Source:** `@webiny/tenant-manager/admin/IsRootTenant.tsx`

---

**Name:** `TenantContext`
**Import:** `import { TenantContext } from "webiny/admin/tenancy"`
**Source:** `@webiny/app-admin/features/tenancy/abstractions.ts`

---

**Name:** `TenantEntry`
**Kind:** type
**Import:** `import type { TenantEntry } from "webiny/admin/tenancy"`
**Source:** `@webiny/tenant-manager/admin/types.ts`

---

**Name:** `useCurrentTenant`
**Import:** `import { useCurrentTenant } from "webiny/admin/tenancy"`
**Source:** `@webiny/tenant-manager/admin/CurrentTenant/useCurrentTenant.ts`

---

**Name:** `useDisableTenant`
**Import:** `import { useDisableTenant } from "webiny/admin/tenancy"`
**Source:** `@webiny/tenant-manager/admin/DisableTenant/index.ts`

---

**Name:** `useEnableTenant`
**Import:** `import { useEnableTenant } from "webiny/admin/tenancy"`
**Source:** `@webiny/tenant-manager/admin/EnableTenant/index.ts`

---

**Name:** `useTenantContext`
**Import:** `import { useTenantContext } from "webiny/admin/tenancy"`
**Source:** `@webiny/app-admin/presentation/tenancy/useTenantContext.ts`

---
