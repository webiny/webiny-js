---
name: webiny-admin-security-catalog
context: webiny-api
description: >
  admin/security — 15 abstractions.
---

# admin/security

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---
**Name:** `AuthenticationContext`
**Import:** `import { AuthenticationContext } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/features/security/AuthenticationContext/index.ts`

---
**Name:** `AuthenticationErrorEventHandler`
**Import:** `import { AuthenticationErrorEventHandler } from "webiny/admin/security"`
**Source:** `@webiny/app/errors/abstractions.ts`

---
**Name:** `createHasPermission`
**Import:** `import { createHasPermission } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/permissions/index.ts`

---
**Name:** `createPermissionsAbstraction`
**Import:** `import { createPermissionsAbstraction } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/permissions/index.ts`

---
**Name:** `createPermissionSchema`
**Import:** `import { createPermissionSchema } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/permissions/index.ts`

---
**Name:** `createPermissionsFeature`
**Import:** `import { createPermissionsFeature } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/permissions/index.ts`

---
**Name:** `createUsePermissions`
**Import:** `import { createUsePermissions } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/permissions/index.ts`

---
**Name:** `HasPermissionComponent`
**Import:** `import { HasPermissionComponent } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/presentation/security/components/HasPermission.tsx`

---
**Name:** `IdentityContext`
**Import:** `import { IdentityContext } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/features/security/IdentityContext/index.ts`

---
**Name:** `LoginScreenComponent`
**Import:** `import { LoginScreenComponent } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/base/ui/LoginScreen.tsx`

---
**Name:** `LogInUseCase`
**Import:** `import { LogInUseCase } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/features/security/LogIn/index.ts`

---
**Name:** `LogOutUseCase`
**Import:** `import { LogOutUseCase } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/features/security/LogOut/index.ts`

---
**Name:** `Permissions`
**Kind:** type
**Import:** `import type { Permissions } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/permissions/types.ts`
**Description:** Canonical type for DI-resolved permissions.
Same underlying type as `UsePermissionsResult<S>`.

---
**Name:** `useAuthentication`
**Import:** `import { useAuthentication } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/presentation/security/hooks/useAuthentication.ts`

---
**Name:** `useIdentity`
**Import:** `import { useIdentity } from "webiny/admin/security"`
**Source:** `@webiny/app-admin/presentation/security/hooks/useIdentity.ts`

---
