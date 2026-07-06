# Background Tasks Refactor: Extract AWS, Add Server Support

**Date:** 2026-07-06
**Branch:** `bruno/refactor/background-tasks-split`

## Goal

Split `@webiny/background-tasks/src/api` into three packages:

1. **`@webiny/background-tasks`** — platform-agnostic core (abstractions, features, CRUD, GraphQL, runner, response)
2. **`@webiny/background-tasks-aws`** — AWS-specific transport (Step Functions, EventBridge, Lambda handler, Lambda timer)
3. **`@webiny/background-tasks-server`** — Node server transport (worker thread orchestrator, process timer)

After refactor, core has zero AWS dependencies. Server package has zero AWS dependencies.

## Package Responsibilities

### `@webiny/background-tasks` (core)

Everything platform-agnostic:

- **features/** — AbortTask, TriggerTask, GetTask, ListTasks, GetTaskDefinition, ListTaskDefinitions, TaskExecutionContext, TaskController, BackgroundTaskPermissions, GetBackgroundTaskSettings, UpdateBackgroundTaskSettings, CleanupTaskSubtree
- **crud/** — TaskPrivateModel, TaskLogPrivateModel, crud.tasks, definition.tasks, service.tasks, cleanupTaskSubtree
- **runner/** — TaskRunner, TaskControl, TaskManager, TaskManagerStore, TaskEventValidation + their abstractions
- **response/** — Response, TaskResponse, all result types + abstractions
- **graphql/** — BackgroundTaskSettingsSchema, checkPermissions, utils
- **service/createService.ts** — resolves transport from DI (platform-agnostic)
- **plugins/** — TaskServicePlugin (abstract class), TaskServiceTransport (DI abstraction)
- **domain/** — BackgroundTaskSettings, constants, errors
- **events/** — TaskBefore/AfterCreate/Update/Delete events
- **decorators/** — RunnableTaskDecorator, SelfCleaningTaskDecorator
- **models/** — BackgroundTaskSettingsModel
- **utils/** — ObjectUpdater, getErrorProperties, getObjectProperties, normalizeSelfCleanup
- **abstractions/ITimer.ts** — NEW: `ITimer` interface extracted from `@webiny/handler-aws`
- **admin/** — stays (platform-agnostic frontend)

Removed from core:
- `BackgroundTaskLambdaHandler.ts` → `background-tasks-aws`
- `service/EventBridgeEventTransportPlugin.ts` → `background-tasks-aws`
- `service/StepFunctionServicePlugin.ts` → `background-tasks-aws`

### `@webiny/background-tasks-aws`

AWS Lambda + Step Functions + EventBridge implementation.

```
packages/background-tasks-aws/src/
  BackgroundTasksAwsFeature.ts
  BackgroundTaskLambdaHandler.ts
  service/
    EventBridgeEventTransportPlugin.ts
    StepFunctionServicePlugin.ts
  timer/
    LambdaTimer.ts
```

- **BackgroundTasksAwsFeature** — registers SFN transport (default) + EventBridge transport via `TaskServiceTransport` DI abstraction.
- **BackgroundTaskLambdaHandler** — moved from core. Implements `BackgroundTaskEventHandler`. Imports `TaskRunner` from core, `LambdaTimer` locally.
- **LambdaTimer** — `ITimer` implementation wrapping Lambda context's `getRemainingTimeInMillis()`.

Dependencies: `@webiny/background-tasks`, `@webiny/aws-sdk`, `@webiny/handler-aws`, `@webiny/event-handler-aws`.

### `@webiny/background-tasks-server`

Node server implementation using worker threads for task orchestration.

```
packages/background-tasks-server/src/
  BackgroundTasksServerFeature.ts
  worker/
    TaskOrchestrator.ts
    TaskOrchestratorMessage.ts
    workerEntry.ts
  service/
    WorkerTransportPlugin.ts
  timer/
    ProcessTimer.ts
```

- **BackgroundTasksServerFeature** — registers worker-based transport via `TaskServiceTransport`.
- **WorkerTransportPlugin** — `TaskServicePlugin` impl. `send()` spawns a `worker_threads.Worker`, passes typed message.
- **TaskOrchestrator** — class in worker thread: HTTP POST loop to running server's background-task endpoint. Handles continue/done/error responses. Mimics SFN retry loop.
- **TaskOrchestratorMessage** — typed interfaces for parent↔worker communication.
- **workerEntry.ts** — worker entry point: receives message, creates `TaskOrchestrator`, runs.
- **ProcessTimer** — `ITimer` impl using `process.hrtime()` with 24-hour default timeout.

Dependencies: `@webiny/background-tasks` only. No AWS deps.

## ITimer Abstraction

Extracted from `@webiny/handler-aws` into core:

```ts
/* background-tasks/src/api/abstractions/ITimer.ts */
export interface ITimer {
    getRemainingMilliseconds(): number;
    getRemainingSeconds(): number;
}
```

- `TaskRunner` and `TaskExecutionContext` abstractions update imports to local `ITimer` (drop `@webiny/handler-aws` import).
- AWS: `LambdaTimer` wraps Lambda context's `getRemainingTimeInMillis()`. Replaces current `timerFactory()` from `handler-aws`.
- Server: `ProcessTimer` uses `process.hrtime()` with configurable max duration (default 24h = 86400000ms).

## AWS Type Leak Fix

`service.tasks.ts` and `types.ts` reference `IStepFunctionServiceFetchResult` (SFN-specific type from `StepFunctionServicePlugin.ts`). This leaks AWS types into core.

Fix: replace with `IServiceInfo` (generic `GenericRecord`, already defined in `@webiny/api-core/features/task/TaskService/abstractions.ts`). The `fetchServiceInfo` return type becomes `Result<IServiceInfo, BaseError>` — transport-agnostic. Each transport's `fetch()` already returns `unknown | null`, so callers that need SFN-specific fields cast at the consumer level (app template), not in core.

## Worker Thread Design

The worker does NOT bootstrap Webiny. No container, no native modules. Pure TypeScript, compiled with the package.

### Trigger Flow

1. `WorkerTransportPlugin.send(task, delay)` called.
2. Spawns `new Worker(new URL("./worker/workerEntry.js", import.meta.url))` — absolute URL resolution, works from `node_modules`.
3. Posts typed `StartMessage` with `{ taskEvent, serverUrl }`.
4. Worker's `TaskOrchestrator`:
   - If `delay > 0`, waits via `setTimeout`.
   - HTTP POST to `{serverUrl}/background-task` with task event payload.
   - Reads response status:
     - `"continue"` → POST again with updated input.
     - `"done"` → posts `DoneMessage` to parent, exits.
     - `"error"` → posts `ErrorMessage` to parent, exits.
5. `ProcessTimer` (24h) acts as safety net — on timeout, orchestrator posts `ErrorMessage` with timeout error to parent and terminates the worker. Task status updated to `FAILED` by the main server.

### fetch()

`WorkerTransportPlugin` maintains a `Map<string, WorkerHandle>` keyed by task ID. Each `WorkerHandle` tracks: worker reference, start time, current status (running/done/error/timeout). `fetch(task)` looks up the handle and returns `{ status, startedAt, exitCode }` as `IServiceInfo` (generic record). If worker already exited, returns last known state.

### Server URL

Constructed as `http://localhost:${port}/background-task`. Port resolved from:
1. `WEBINY_SERVER_PORT` env var (preferred)
2. `BuildParams.get<number>("Server.Port")` fallback
3. Default `3000` if neither set

Host is always `localhost` — worker runs on the same machine as the server.

## Dependency Graph

```
@webiny/background-tasks (core)
  ├── no AWS deps
  └── exports: abstractions, features, CRUD, graphql, runner, response, types

@webiny/background-tasks-aws
  ├── depends on: @webiny/background-tasks, @webiny/aws-sdk, @webiny/handler-aws, @webiny/event-handler-aws
  └── exports: BackgroundTasksAwsFeature, BackgroundTaskLambdaHandler

@webiny/background-tasks-server
  ├── depends on: @webiny/background-tasks
  └── exports: BackgroundTasksServerFeature

@webiny/api-background-tasks-ddb
  ├── depends on: @webiny/background-tasks (core only)
  └── storage wiring — transport is orthogonal

@webiny/api-background-tasks-os
  ├── depends on: @webiny/background-tasks (core only)
  └── storage + ES task wiring — transport is orthogonal
```

App templates compose all three independently:
1. Core (`@webiny/background-tasks`)
2. Transport (`background-tasks-aws` OR `background-tasks-server`)
3. Storage (`api-background-tasks-ddb` OR `api-background-tasks-os`)

## Consumer Changes

### AWS app template (existing)

Before:
```ts
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";
import { BackgroundTaskLambdaHandler } from "@webiny/background-tasks/api";
```

After:
```ts
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";
import { BackgroundTasksAwsFeature } from "@webiny/background-tasks-aws";
import { BackgroundTaskLambdaHandler } from "@webiny/background-tasks-aws";
```

### Server app template (new)

```ts
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";
import { BackgroundTasksServerFeature } from "@webiny/background-tasks-server";
```

### `api-background-tasks-ddb` / `api-background-tasks-os`

No changes needed. They depend on core only. Transport choice is made at the app template level.

## BackgroundTasksFeature Split

### Core `BackgroundTasksFeature` (rewritten)

Registers models, CRUD, GraphQL, permissions. No transports. Current `BackgroundTasksFeature` minus the two `container.registerInstance(TaskServiceTransport, ...)` lines for SFN and EventBridge.

### `BackgroundTasksAwsFeature`

Registers SFN transport (default) + EventBridge transport. Does NOT call `BackgroundTasksFeature.register()` — app template registers core separately.

### `BackgroundTasksServerFeature`

Registers worker-thread transport. Does NOT call `BackgroundTasksFeature.register()` — app template registers core separately.
