---
name: webiny-api-scheduler-catalog
context: webiny-api
description: >
  API — Scheduler — 11 abstractions.
  Scheduled action use cases.
---

# API — Scheduler

Scheduled action use cases.

## How to Use

1. Find the abstraction you need below
2. Read the source file to get the exact interface and types
3. Import: `import { Name } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

---
**Name:** `CancelScheduledActionUseCase`
**Import:** `webiny/api/scheduler`
**Source:** `@webiny/api-scheduler/features/CancelScheduledAction/index.ts`
**Description:** Cancel a scheduled action.

---
**Name:** `ExecuteScheduledActionUseCase`
**Import:** `webiny/api/scheduler`
**Source:** `@webiny/api-scheduler/features/ExecuteScheduledAction/index.ts`
**Description:** Execute a scheduled action immediately.

---
**Name:** `GetScheduledActionUseCase`
**Import:** `webiny/api/scheduler`
**Source:** `@webiny/api-scheduler/features/GetScheduledAction/index.ts`
**Description:** Retrieve a scheduled action.

---
**Name:** `ListScheduledActionsUseCase`
**Import:** `webiny/api/scheduler`
**Source:** `@webiny/api-scheduler/features/ListScheduledActions/index.ts`
**Description:** List scheduled actions.

---
**Name:** `NamespaceHandler`
**Import:** `webiny/api/scheduler`
**Source:** `@webiny/api-scheduler/features/NamespaceHandler/index.ts`
**Description:** Handle namespace-specific scheduled action logic.

---
**Name:** `ScheduleActionUseCase`
**Import:** `webiny/api/scheduler`
**Source:** `@webiny/api-scheduler/features/ScheduleAction/index.ts`
**Description:** Schedule an action for future execution.

---
**Name:** `SCHEDULED_ACTION_PUBLISH`
**Import:** `webiny/api/scheduler`
**Source:** `@webiny/api-scheduler/constants.ts`
**Description:** Constant identifier for the publish scheduled action type.

---
**Name:** `SCHEDULED_ACTION_UNPUBLISH`
**Import:** `webiny/api/scheduler`
**Source:** `@webiny/api-scheduler/constants.ts`
**Description:** Constant identifier for the unpublish scheduled action type.

---
**Name:** `ScheduledActionHandler`
**Import:** `webiny/api/scheduler`
**Source:** `@webiny/api-scheduler/shared/abstractions.ts`
**Description:** Handle execution of a scheduled action.

---
**Name:** `ScheduledActionModel`
**Import:** `webiny/api/scheduler`
**Source:** `@webiny/api-scheduler/shared/abstractions.ts`
**Description:** ScheduledActionModel - A CMS model used by the scheduler for persistence.

---
**Name:** `SchedulerService`
**Import:** `webiny/api/scheduler`
**Source:** `@webiny/api-scheduler/shared/abstractions.ts`
**Description:** Core service for managing scheduled actions.

---
