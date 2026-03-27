---
name: webiny-api-scheduler-catalog
context: webiny-api
description: >
  API — Scheduler — 15 abstractions.
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
**Import:** `import { CancelScheduledActionUseCase } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/features/CancelScheduledAction/index.ts`
**Description:** Cancel a scheduled action.

---

**Name:** `ExecuteScheduledActionUseCase`
**Import:** `import { ExecuteScheduledActionUseCase } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/features/ExecuteScheduledAction/index.ts`
**Description:** Execute a scheduled action immediately.

---

**Name:** `GetScheduledActionUseCase`
**Import:** `import { GetScheduledActionUseCase } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/features/GetScheduledAction/index.ts`
**Description:** Retrieve a scheduled action.

---

**Name:** `IScheduledAction`
**Kind:** type
**Import:** `import type { IScheduledAction } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/shared/abstractions.ts`

---

**Name:** `IScheduledActionEntry`
**Kind:** type
**Import:** `import type { IScheduledActionEntry } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/shared/abstractions.ts`

---

**Name:** `ListScheduledActionsUseCase`
**Import:** `import { ListScheduledActionsUseCase } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/features/ListScheduledActions/index.ts`
**Description:** List scheduled actions.

---

**Name:** `NamespaceHandler`
**Import:** `import { NamespaceHandler } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/features/NamespaceHandler/index.ts`
**Description:** Handle namespace-specific scheduled action logic.

---

**Name:** `ScheduleActionError`
**Kind:** type
**Import:** `import type { ScheduleActionError } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/features/ScheduleAction/index.ts`

---

**Name:** `ScheduleActionUseCase`
**Import:** `import { ScheduleActionUseCase } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/features/ScheduleAction/index.ts`
**Description:** Schedule an action for future execution.

---

**Name:** `SCHEDULED_ACTION_PUBLISH`
**Import:** `import { SCHEDULED_ACTION_PUBLISH } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/constants.ts`
**Description:** Constant identifier for the publish scheduled action type.

---

**Name:** `SCHEDULED_ACTION_UNPUBLISH`
**Import:** `import { SCHEDULED_ACTION_UNPUBLISH } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/constants.ts`
**Description:** Constant identifier for the unpublish scheduled action type.

---

**Name:** `ScheduledActionHandler`
**Import:** `import { ScheduledActionHandler } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/shared/abstractions.ts`
**Description:** Handle execution of a scheduled action.

---

**Name:** `ScheduledActionModel`
**Import:** `import { ScheduledActionModel } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/shared/abstractions.ts`
**Description:** ScheduledActionModel - A CMS model used by the scheduler for persistence.

---

**Name:** `ScheduledActionType`
**Kind:** type
**Import:** `import type { ScheduledActionType } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/shared/abstractions.ts`

---

**Name:** `SchedulerService`
**Import:** `import { SchedulerService } from "webiny/api/scheduler"`
**Source:** `@webiny/api-scheduler/shared/abstractions.ts`
**Description:** Core service for managing scheduled actions.

---
