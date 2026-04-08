---
name: webiny-api-tasks-catalog
context: webiny-api
description: >
  api/tasks — 2 abstractions.
---

# api/tasks

## How to Use

1. Find the abstraction you need below
2. You MUST read the source file to get the exact interface and types!
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Name:** `TaskDefinition`
**Import:** `import { TaskDefinition } from "webiny/api/tasks"`
**Source:** `@webiny/api-core/features/task/TaskDefinition/index.ts`
**Description:** Define a long-running background task with lifecycle hooks.

---
**Name:** `TaskService`
**Import:** `import { TaskService } from "webiny/api/tasks"`
**Source:** `@webiny/api-core/features/task/TaskService/index.ts`
**Description:** Trigger and manage long-running background tasks.

---
