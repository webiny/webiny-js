---
name: webiny-admin-catalog
context: webiny-api
description: >
  admin — 18 abstractions.
---

# admin

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---
**Name:** `AdminConfig`
**Import:** `webiny/admin`
**Source:** `@webiny/app-admin/config/AdminConfig.tsx`

---
**Name:** `BaseError`
**Import:** `webiny/admin`
**Source:** `@webiny/feature/admin/index.ts`

---
**Name:** `BuildParam`
**Import:** `webiny/admin`
**Source:** `@webiny/app-admin/features/buildParams/index.ts`

---
**Name:** `BuildParams`
**Import:** `webiny/admin`
**Source:** `@webiny/app-admin/features/buildParams/index.ts`

---
**Name:** `createAbstraction`
**Import:** `webiny/admin`
**Source:** `@webiny/feature/admin/index.ts`

---
**Name:** `createFeature`
**Import:** `webiny/admin`
**Source:** `@webiny/feature/admin/index.ts`

---
**Name:** `createHasPermission`
**Import:** `webiny/admin`
**Source:** `@webiny/app-admin/permissions/index.ts`

---
**Name:** `createPermissionSchema`
**Import:** `webiny/admin`
**Source:** `@webiny/app-admin/permissions/index.ts`

---
**Name:** `createProvider`
**Import:** `webiny/admin`
**Source:** `@webiny/app/core/createProvider.tsx`
**Description:** Creates a Higher Order Component which wraps the entire app content.
This is mostly useful for adding React Context providers.

---
**Name:** `createProviderPlugin`
**Import:** `webiny/admin`
**Source:** `@webiny/app/core/createProviderPlugin.tsx`
**Description:** Creates a component, which, when mounted, will register an app provider.
This is particularly useful for wrapping the entire app with custom React Context providers.
For more information, visit https://www.webiny.com/docs/admin-area/basics/framework.

---
**Name:** `createUsePermissions`
**Import:** `webiny/admin`
**Source:** `@webiny/app-admin/permissions/index.ts`

---
**Name:** `DevToolsSection`
**Import:** `webiny/admin`
**Source:** `@webiny/app-admin/components/index.ts`
**Description:** Registers a named section in the Webiny DevTools extension.
Renders nothing — purely a data registration side-effect.

When the component unmounts (e.g., route change), the section
is automatically removed from DevTools.

---
**Name:** `NetworkErrorEventHandler`
**Import:** `webiny/admin`
**Source:** `@webiny/app/errors/index.ts`

---
**Name:** `Plugin`
**Import:** `webiny/admin`
**Source:** `@webiny/app/core/Plugin.tsx`

---
**Name:** `Provider`
**Import:** `webiny/admin`
**Source:** `@webiny/app/core/Provider.tsx`
**Description:** Register a new React context provider.

---
**Name:** `RegisterFeature`
**Import:** `webiny/admin`
**Source:** `@webiny/app-admin/components/RegisterFeature.tsx`

---
**Name:** `Routes`
**Import:** `webiny/admin`
**Source:** `@webiny/app-admin/routes.ts`

---
**Name:** `useFeature`
**Import:** `webiny/admin`
**Source:** `@webiny/app/shared/di/useFeature.ts`

---
