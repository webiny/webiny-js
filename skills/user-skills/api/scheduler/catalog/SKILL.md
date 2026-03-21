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

1. Find the abstraction you need in the table below
2. Read the source file to get the exact interface and types
3. Import: `import { ClassName } from "<importPath>";`
4. See `webiny-use-case-pattern` or `webiny-event-handler-pattern` skills for implementation patterns

## Abstractions

| Class | Import | Source |
|-------|--------|--------|
| `CancelScheduledActionUseCase` | `webiny/api/scheduler` | `@webiny/api-scheduler/features/CancelScheduledAction/index.ts` |
| `ExecuteScheduledActionUseCase` | `webiny/api/scheduler` | `@webiny/api-scheduler/features/ExecuteScheduledAction/index.ts` |
| `GetScheduledActionUseCase` | `webiny/api/scheduler` | `@webiny/api-scheduler/features/GetScheduledAction/index.ts` |
| `ListScheduledActionsUseCase` | `webiny/api/scheduler` | `@webiny/api-scheduler/features/ListScheduledActions/index.ts` |
| `NamespaceHandler` | `webiny/api/scheduler` | `@webiny/api-scheduler/features/NamespaceHandler/index.ts` |
| `ScheduleActionUseCase` | `webiny/api/scheduler` | `@webiny/api-scheduler/features/ScheduleAction/index.ts` |
| `SCHEDULED_ACTION_PUBLISH` | `webiny/api/scheduler` | `@webiny/api-scheduler/constants.ts` |
| `SCHEDULED_ACTION_UNPUBLISH` | `webiny/api/scheduler` | `@webiny/api-scheduler/constants.ts` |
| `ScheduledActionHandler` | `webiny/api/scheduler` | `@webiny/api-scheduler/shared/abstractions.ts` |
| `ScheduledActionModel` | `webiny/api/scheduler` | `@webiny/api-scheduler/shared/abstractions.ts` |
| `SchedulerService` | `webiny/api/scheduler` | `@webiny/api-scheduler/shared/abstractions.ts` |
