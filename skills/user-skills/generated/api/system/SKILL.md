---
name: webiny-api-system-catalog
context: webiny-api
description: >
  API — System — 2 abstractions.
  System installation event handlers and use cases.
---

# API — System

System installation event handlers and use cases.

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---

**Name:** `InstallSystemUseCase`
**Import:** `import { InstallSystemUseCase } from "webiny/api/system"`
**Source:** `@webiny/api-core/features/system/InstallSystem/index.ts`
**Description:** Run system-wide installation.

---

**Name:** `SystemInstalledEventHandler`
**Import:** `import { SystemInstalledEventHandler } from "webiny/api/system"`
**Source:** `@webiny/api-core/features/system/InstallSystem/index.ts`
**Description:** Hook into system lifecycle after the system is installed.

---
