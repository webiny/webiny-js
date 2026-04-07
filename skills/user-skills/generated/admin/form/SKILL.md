---
name: webiny-admin-form-catalog
context: webiny-api
description: >
  admin/form — 13 abstractions.
---

# admin/form

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`

## Abstractions

---
**Name:** `Bind`
**Import:** `import { Bind } from "webiny/admin/form"`
**Source:** `@webiny/form/index.ts`

---
**Name:** `Form`
**Import:** `import { Form } from "webiny/admin/form"`
**Source:** `@webiny/form/index.ts`

---
**Name:** `FormAPI`
**Kind:** type
**Import:** `import type { FormAPI } from "webiny/admin/form"`
**Source:** `@webiny/form/index.ts`

---
**Name:** `FormOnSubmit`
**Kind:** type
**Import:** `import type { FormOnSubmit } from "webiny/admin/form"`
**Source:** `@webiny/form/index.ts`

---
**Name:** `GenericFormData`
**Kind:** type
**Import:** `import type { GenericFormData } from "webiny/admin/form"`
**Source:** `@webiny/form/index.ts`

---
**Name:** `UnsetOnUnmount`
**Import:** `import { UnsetOnUnmount } from "webiny/admin/form"`
**Source:** `@webiny/form/index.ts`

---
**Name:** `useBind`
**Import:** `import { useBind } from "webiny/admin/form"`
**Source:** `@webiny/form/index.ts`

---
**Name:** `useBindPrefix`
**Import:** `import { useBindPrefix } from "webiny/admin/form"`
**Source:** `@webiny/form/index.ts`

---
**Name:** `useForm`
**Import:** `import { useForm } from "webiny/admin/form"`
**Source:** `@webiny/form/index.ts`

---
**Name:** `useGenerateSlug`
**Import:** `import { useGenerateSlug } from "webiny/admin/form"`
**Source:** `@webiny/form/index.ts`
**Description:** This hook is designed to be used with the `useForm` hook.
When `generateSlug` is called, it will generate a slug using the `from` form field, and set it into the `to` form field.

---
**Name:** `validation`
**Import:** `import { validation } from "webiny/admin/form"`
**Source:** `@webiny/validation/index.ts`

---
**Name:** `Validation`
**Import:** `import { Validation } from "webiny/admin/form"`
**Source:** `@webiny/validation/index.ts`

---
**Name:** `ValidationError`
**Import:** `import { ValidationError } from "webiny/admin/form"`
**Source:** `@webiny/validation/index.ts`

---
