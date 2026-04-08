---
name: webiny-admin-local-storage-catalog
context: webiny-api
description: >
  admin/local-storage — 4 abstractions.
---

# admin/local-storage

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---
**Name:** `LocalStorage`
**Import:** `import { LocalStorage } from "webiny/admin/local-storage"`
**Source:** `@webiny/app/features/localStorage/abstractions.ts`

---
**Name:** `useLocalStorage`
**Import:** `import { useLocalStorage } from "webiny/admin/local-storage"`
**Source:** `@webiny/app/presentation/localStorage/index.ts`
**Description:** Returns the LocalStorage instance from DI.
Useful when you want to call service methods imperatively inside components.

---
**Name:** `useLocalStorageValue`
**Import:** `import { useLocalStorageValue } from "webiny/admin/local-storage"`
**Source:** `@webiny/app/presentation/localStorage/index.ts`

---
**Name:** `useLocalStorageValues`
**Import:** `import { useLocalStorageValues } from "webiny/admin/local-storage"`
**Source:** `@webiny/app/presentation/localStorage/index.ts`
**Description:** Observes multiple keys in LocalStorage and returns an object of { key: value }.
Re-renders when any of the observed keys change.

---
