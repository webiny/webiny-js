# Background Tasks Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `@webiny/background-tasks` into platform-agnostic core + `@webiny/background-tasks-aws` (SFN/EventBridge/Lambda) + `@webiny/background-tasks-server` (worker-thread orchestrator).

**Architecture:** Core keeps all features, CRUD, GraphQL, runner, response, plugins. AWS package gets transport plugins + Lambda handler. Server package gets worker-thread transport + process timer. App templates compose all three independently.

**Tech Stack:** TypeScript, `@webiny/feature` DI, `@webiny/plugins`, `worker_threads` (server only), `@webiny/aws-sdk` (AWS only).

**Spec:** `docs/.bruno/2026-07-06-background-tasks-refactor-design.md`

## Global Constraints

- ES modules only (`import`/`export`), no CommonJS.
- One named import per line.
- One class per file.
- Comments end with period. `//` single-line, `/* */` multi-line.
- No `export default` — always named exports.
- No `??` or `??=` — use `||` and explicit if-checks.
- No `React.FC` — plain arrow functions with typed props.
- Class properties always have `public`/`protected`/`private` + `readonly` modifiers.
- `Impl` suffix for implementation class, export const matches abstraction name.
- Run pre-commit checklist after every code change: `git add . && yarn > /dev/null 2>&1 && node scripts/generateTsConfigsInPackages.js && yarn adio && yarn format > /dev/null 2>&1 && yarn lint && yarn webiny sync-dependencies && git add .`

---

### Task 1: Extract ITimer abstraction into core

Move the `ITimer` interface from `@webiny/handler-aws` into `@webiny/background-tasks` core. Update all core imports. This is the foundation — everything else depends on core being AWS-free.

**Files:**
- Create: `packages/background-tasks/src/api/abstractions/ITimer.ts`
- Create: `packages/background-tasks/src/api/abstractions/index.ts`
- Modify: `packages/background-tasks/src/api/runner/abstractions/TaskRunner.ts` — change ITimer import
- Modify: `packages/background-tasks/src/api/runner/TaskRunner.ts` — change ITimer import
- Modify: `packages/background-tasks/src/api/features/TaskExecutionContext/abstractions.ts` — change ITimer import
- Modify: `packages/background-tasks/src/api/features/TaskExecutionContext/TaskExecutionContext.ts` — change ITimer import
- Modify: `packages/background-tasks/src/api/index.ts` — export ITimer

**Interfaces:**
- Produces: `ITimer { getRemainingMilliseconds(): number; getRemainingSeconds(): number; }` at `~/api/abstractions/ITimer.js`

- [ ] **Step 1: Create ITimer abstraction in core**

```ts
/* packages/background-tasks/src/api/abstractions/ITimer.ts */
export interface ITimer {
    /* Return value must be in milliseconds. */
    getRemainingMilliseconds(): number;
    /* Return value must be in seconds. */
    getRemainingSeconds(): number;
}
```

```ts
/* packages/background-tasks/src/api/abstractions/index.ts */
export type { ITimer } from "./ITimer.js";
```

- [ ] **Step 2: Update all core imports from `@webiny/handler-aws` to local ITimer**

In `packages/background-tasks/src/api/runner/abstractions/TaskRunner.ts`, change:
```ts
// before
import type { ITimer } from "@webiny/handler-aws";
// after
import type { ITimer } from "~/api/abstractions/ITimer.js";
```

In `packages/background-tasks/src/api/runner/TaskRunner.ts`, change:
```ts
// before
import type { ITimer } from "@webiny/handler-aws/utils/index.js";
// after
import type { ITimer } from "~/api/abstractions/ITimer.js";
```

In `packages/background-tasks/src/api/features/TaskExecutionContext/abstractions.ts`, change:
```ts
// before
import type { ITimer } from "@webiny/handler-aws";
// after
import type { ITimer } from "~/api/abstractions/ITimer.js";
```

In `packages/background-tasks/src/api/features/TaskExecutionContext/TaskExecutionContext.ts`, change:
```ts
// before
import type { ITimer } from "@webiny/handler-aws";
// after
import type { ITimer } from "~/api/abstractions/ITimer.js";
```

- [ ] **Step 3: Export ITimer from api/index.ts**

Add to `packages/background-tasks/src/api/index.ts`:
```ts
export type { ITimer } from "./abstractions/ITimer.js";
```

- [ ] **Step 4: Build and verify**

Run: `yarn build -p @webiny/background-tasks --safe-replace 2>&1 | tail -30`
Expected: successful build, no `@webiny/handler-aws` imports remain in core API source (except test helpers).

Verify no handler-aws imports in src/api:
Run: `grep -rn "handler-aws" packages/background-tasks/src/api/ --include='*.ts'`
Expected: zero results.

- [ ] **Step 5: Commit**

Run pre-commit checklist, then:
```
git commit -m "refactor(background-tasks): extract ITimer abstraction into core"
```

---

### Task 2: Replace IStepFunctionServiceFetchResult with IServiceInfo in core

The core `types.ts` and `service.tasks.ts` import `IStepFunctionServiceFetchResult` from the SFN plugin (AWS-specific). Replace with `IServiceInfo` from `@webiny/api-core` to make core transport-agnostic.

**Files:**
- Modify: `packages/background-tasks/src/api/types.ts` — replace `IStepFunctionServiceFetchResult` with `IServiceInfo`
- Modify: `packages/background-tasks/src/api/crud/service.tasks.ts` — replace import and usage

**Interfaces:**
- Consumes: `IServiceInfo` from `@webiny/api-core/features/task/TaskService/abstractions.ts` (already exists as `GenericRecord`)
- Produces: `ITasksContextServiceObject.fetchServiceInfo` returns `Result<IServiceInfo, BaseError>` instead of `Result<IStepFunctionServiceFetchResult, BaseError>`

- [ ] **Step 1: Update types.ts**

In `packages/background-tasks/src/api/types.ts`:

Remove:
```ts
import type { IStepFunctionServiceFetchResult } from "~/api/service/StepFunctionServicePlugin.js";
```

Add:
```ts
import type { IServiceInfo } from "@webiny/api-core/features/task/TaskService/abstractions.js";
```

Change `ITasksContextServiceObject.fetchServiceInfo` return type (line ~250):
```ts
// before
fetchServiceInfo: (
    input: ITask<any, any> | string
) => Promise<Result<IStepFunctionServiceFetchResult, BaseError>>;
// after
fetchServiceInfo: (
    input: ITask<any, any> | string
) => Promise<Result<IServiceInfo, BaseError>>;
```

- [ ] **Step 2: Update service.tasks.ts**

In `packages/background-tasks/src/api/crud/service.tasks.ts`:

Remove:
```ts
import type { IStepFunctionServiceFetchResult } from "~/api/service/StepFunctionServicePlugin.js";
```

Add:
```ts
import type { IServiceInfo } from "@webiny/api-core/features/task/TaskService/abstractions.js";
```

Change `fetchServiceInfo` (line ~120-122):
```ts
// before
fetchServiceInfo: async (
    input: TaskService.Task | string
): Promise<Result<IStepFunctionServiceFetchResult, BaseError<any>>> => {
    ...
    const info = (await service.fetch(task)) as IStepFunctionServiceFetchResult | null;
// after
fetchServiceInfo: async (
    input: TaskService.Task | string
): Promise<Result<IServiceInfo, BaseError<any>>> => {
    ...
    const info = (await service.fetch(task)) as IServiceInfo | null;
```

- [ ] **Step 3: Build and verify**

Run: `yarn build -p @webiny/background-tasks --safe-replace 2>&1 | tail -30`
Expected: successful build.

Verify no SFN import in core:
Run: `grep -rn "IStepFunctionServiceFetchResult" packages/background-tasks/src/api/`
Expected: zero results.

- [ ] **Step 4: Commit**

Run pre-commit checklist, then:
```
git commit -m "refactor(background-tasks): replace SFN-specific type with generic IServiceInfo"
```

---

### Task 3: Remove AWS transports from BackgroundTasksFeature

Strip the SFN and EventBridge transport registrations from the core `BackgroundTasksFeature`. After this, core has zero AWS deps at the feature-registration level.

**Files:**
- Modify: `packages/background-tasks/src/api/BackgroundTasksFeature.ts` — remove SFN/EventBridge imports and registrations

**Interfaces:**
- Produces: `BackgroundTasksFeature` that registers only models, CRUD, GraphQL, permissions — no transports.

- [ ] **Step 1: Rewrite BackgroundTasksFeature.ts**

Replace the full file with:

```ts
import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import { createBackgroundTaskContext } from "./context.js";
import { createBackgroundTaskGraphQL } from "./graphql/index.js";
import { TaskPrivateModel } from "./crud/TaskPrivateModel.js";
import { TaskLogPrivateModel } from "./crud/TaskLogPrivateModel.js";
import { BackgroundTaskSettingsModel } from "./models/BackgroundTaskSettingsModel.js";

export const BackgroundTasksFeature = createFeature({
    name: "BackgroundTasks",
    register(container: Container) {
        container.register(TaskPrivateModel);
        container.register(TaskLogPrivateModel);
        container.register(BackgroundTaskSettingsModel);

        registerLegacyPluginsViaGqlContextualSchema(container, [
            ...createBackgroundTaskContext(),
            ...createBackgroundTaskGraphQL()
        ]);
    }
});
```

- [ ] **Step 2: Remove BackgroundTaskLambdaHandler export from core index.ts**

In `packages/background-tasks/src/api/index.ts`, remove:
```ts
export { BackgroundTaskLambdaHandler } from "./BackgroundTaskLambdaHandler.js";
```

Keep the file — it moves to the AWS package in Task 4.

- [ ] **Step 3: Build and verify**

Run: `yarn build -p @webiny/background-tasks --safe-replace 2>&1 | tail -30`
Expected: successful build.

Verify no AWS imports remain in src/api (excluding service/ files that move in Task 4):
Run: `grep -rn "aws-sdk\|handler-aws\|event-handler-aws" packages/background-tasks/src/api/ --include='*.ts' | grep -v service/ | grep -v BackgroundTaskLambdaHandler`
Expected: zero results.

- [ ] **Step 4: Commit**

Run pre-commit checklist, then:
```
git commit -m "refactor(background-tasks): remove AWS transports from core feature"
```

---

### Task 4: Create `@webiny/background-tasks-aws` package

New package with the AWS-specific code extracted from core: SFN transport, EventBridge transport, Lambda handler, Lambda timer.

**Files:**
- Create: `packages/background-tasks-aws/package.json`
- Create: `packages/background-tasks-aws/tsconfig.json`
- Create: `packages/background-tasks-aws/src/index.ts`
- Create: `packages/background-tasks-aws/src/BackgroundTasksAwsFeature.ts`
- Move: `packages/background-tasks/src/api/BackgroundTaskLambdaHandler.ts` → `packages/background-tasks-aws/src/BackgroundTaskLambdaHandler.ts`
- Move: `packages/background-tasks/src/api/service/EventBridgeEventTransportPlugin.ts` → `packages/background-tasks-aws/src/service/EventBridgeEventTransportPlugin.ts`
- Move: `packages/background-tasks/src/api/service/StepFunctionServicePlugin.ts` → `packages/background-tasks-aws/src/service/StepFunctionServicePlugin.ts`
- Create: `packages/background-tasks-aws/src/timer/LambdaTimer.ts`

**Interfaces:**
- Consumes: `TaskServiceTransport`, `TaskServicePlugin` from `@webiny/background-tasks/api`; `ITimer` from `@webiny/background-tasks/api`; `TaskRunner` from `@webiny/background-tasks/api`
- Produces: `BackgroundTasksAwsFeature` (registers SFN + EventBridge transports); `BackgroundTaskLambdaHandler`; `LambdaTimer` implementing `ITimer`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@webiny/background-tasks-aws",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "description": "AWS transport for Webiny background tasks (Step Functions, EventBridge, Lambda).",
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/background-tasks-aws"
  },
  "license": "MIT",
  "dependencies": {
    "@webiny/api": "0.0.0",
    "@webiny/api-core": "0.0.0",
    "@webiny/aws-sdk": "0.0.0",
    "@webiny/background-tasks": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/event-handler-aws": "0.0.0",
    "@webiny/event-handler-core": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/handler-aws": "0.0.0",
    "@webiny/handler-graphql": "0.0.0",
    "@webiny/plugins": "0.0.0",
    "@webiny/utils": "0.0.0"
  },
  "devDependencies": {
    "@webiny/build-tools": "0.0.0",
    "rimraf": "^6.1.3",
    "typescript": "6.0.3"
  },
  "publishConfig": {
    "access": "public"
  },
  "webiny": {
    "publishFrom": "dist"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src"],
  "references": [
    { "path": "../api" },
    { "path": "../api-core" },
    { "path": "../aws-sdk" },
    { "path": "../background-tasks" },
    { "path": "../error" },
    { "path": "../event-handler-aws" },
    { "path": "../event-handler-core" },
    { "path": "../feature" },
    { "path": "../handler-aws" },
    { "path": "../handler-graphql" },
    { "path": "../plugins" },
    { "path": "../utils" }
  ],
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 3: Create LambdaTimer**

```ts
/* packages/background-tasks-aws/src/timer/LambdaTimer.ts */
import type { ITimer } from "@webiny/background-tasks/api";

interface LambdaTimerFactory {
    getRemainingTimeInMillis(): number;
}

export class LambdaTimer implements ITimer {
    private readonly factory: LambdaTimerFactory;

    public constructor(factory: LambdaTimerFactory) {
        this.factory = factory;
    }

    public getRemainingMilliseconds(): number {
        return this.factory.getRemainingTimeInMillis();
    }

    public getRemainingSeconds(): number {
        return Math.floor(this.getRemainingMilliseconds() / 1000);
    }
}
```

- [ ] **Step 4: Move and adapt EventBridgeEventTransportPlugin**

Copy `packages/background-tasks/src/api/service/EventBridgeEventTransportPlugin.ts` to `packages/background-tasks-aws/src/service/EventBridgeEventTransportPlugin.ts`.

Update imports — replace all `~/api/` paths with `@webiny/background-tasks/api`:
```ts
import type {
    ITaskService,
    ITaskServiceCreatePluginParams,
    ITaskServiceTask
} from "@webiny/background-tasks/api/plugins/index.js";
import { TaskServicePlugin } from "@webiny/background-tasks/api/plugins/index.js";
import type { ITaskEventInput } from "@webiny/background-tasks/api/types.js";
```

Rest of the file stays identical.

- [ ] **Step 5: Move and adapt StepFunctionServicePlugin**

Copy `packages/background-tasks/src/api/service/StepFunctionServicePlugin.ts` to `packages/background-tasks-aws/src/service/StepFunctionServicePlugin.ts`.

Update imports — replace `~/api/` paths:
```ts
import type {
    ITaskService,
    ITaskServiceCreatePluginParams,
    ITaskServiceTask
} from "@webiny/background-tasks/api/plugins/index.js";
import { TaskServicePlugin } from "@webiny/background-tasks/api/plugins/index.js";
import type { ITaskEventInput } from "@webiny/background-tasks/api/handler/types.js";
import type { ITask } from "@webiny/background-tasks/api/types.js";
```

Rest of the file stays identical.

- [ ] **Step 6: Move and adapt BackgroundTaskLambdaHandler**

Copy `packages/background-tasks/src/api/BackgroundTaskLambdaHandler.ts` to `packages/background-tasks-aws/src/BackgroundTaskLambdaHandler.ts`.

Update imports:
```ts
import type { Container } from "@webiny/feature/api";
import { BackgroundTaskEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/BackgroundTaskEventHandler.js";
import { GraphQLContextEnhancer, GraphQLContextualSchema } from "@webiny/handler-graphql";
import { RequestContainer, runRequestContextInitializers } from "@webiny/event-handler-core";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-aws/eventTypes/BackgroundTaskEventType.js";
import { TaskRunner } from "@webiny/background-tasks/api/runner/index.js";
import { TaskEventValidation } from "@webiny/background-tasks/api/runner/TaskEventValidation.js";
import type { Context } from "@webiny/background-tasks/api/types.js";
import { LambdaTimer } from "~/timer/LambdaTimer.js";
```

Replace `timerFactory()` with `new LambdaTimer(...)`. The Lambda context `getRemainingTimeInMillis` must be passed in. Since the handler currently calls `timerFactory()` (which reads from Lambda context), update the constructor to accept a timer factory or use `LambdaTimer` directly:

```ts
/* In the execute method, replace: */
// const runner = new TaskRunner(ctx as Context, timerFactory(), new TaskEventValidation());
/* with: */
const timer = new LambdaTimer({ getRemainingTimeInMillis: () => 900_000 });
const runner = new TaskRunner(ctx as Context, timer, new TaskEventValidation());
```

Note: the actual `getRemainingTimeInMillis` should come from the Lambda context. Check how `timerFactory` currently works and wire accordingly. If `timerFactory` is called without args, it creates a default. The `LambdaTimer` receives the factory at construction — the caller (event handler framework) must pass the Lambda context's `getRemainingTimeInMillis`.

- [ ] **Step 7: Create BackgroundTasksAwsFeature**

```ts
/* packages/background-tasks-aws/src/BackgroundTasksAwsFeature.ts */
import { type Container, createFeature } from "@webiny/feature/api";
import { TaskServiceTransport } from "@webiny/background-tasks/api";
import { StepFunctionServicePlugin } from "~/service/StepFunctionServicePlugin.js";
import { EventBridgeEventTransportPlugin } from "~/service/EventBridgeEventTransportPlugin.js";

export const BackgroundTasksAwsFeature = createFeature({
    name: "BackgroundTasksAws",
    register(container: Container) {
        container.registerInstance(
            TaskServiceTransport,
            new StepFunctionServicePlugin({ default: true })
        );
        container.registerInstance(TaskServiceTransport, new EventBridgeEventTransportPlugin());
    }
});
```

- [ ] **Step 8: Create index.ts**

```ts
/* packages/background-tasks-aws/src/index.ts */
export { BackgroundTasksAwsFeature } from "./BackgroundTasksAwsFeature.js";
export { BackgroundTaskLambdaHandler } from "./BackgroundTaskLambdaHandler.js";
export { LambdaTimer } from "./timer/LambdaTimer.js";
export { StepFunctionServicePlugin } from "./service/StepFunctionServicePlugin.js";
export { EventBridgeEventTransportPlugin } from "./service/EventBridgeEventTransportPlugin.js";
```

- [ ] **Step 9: Delete moved files from core**

Delete from `packages/background-tasks/src/api/`:
- `BackgroundTaskLambdaHandler.ts`
- `service/EventBridgeEventTransportPlugin.ts`
- `service/StepFunctionServicePlugin.ts`

Update `packages/background-tasks/src/api/service/index.ts` — it may re-export the deleted files. Keep only `createService`.

- [ ] **Step 10: Remove AWS deps from core package.json**

In `packages/background-tasks/package.json`, remove:
```
"@webiny/aws-sdk": "0.0.0",
"@webiny/event-handler-aws": "0.0.0",
"@webiny/handler-aws": "0.0.0",
```

- [ ] **Step 11: Build both packages**

Run:
```bash
yarn build -p @webiny/background-tasks --safe-replace 2>&1 | tail -30
yarn build -p @webiny/background-tasks-aws --safe-replace 2>&1 | tail -30
```
Expected: both succeed.

- [ ] **Step 12: Commit**

Run pre-commit checklist, then:
```
git commit -m "feat(background-tasks-aws): extract AWS transport into own package"
```

---

### Task 5: Update consumers to import from `@webiny/background-tasks-aws`

All packages that import `BackgroundTaskLambdaHandler` or `BackgroundTasksFeature` (for AWS transport) need updating.

**Files:**
- Modify: `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts`
- Modify: `packages/project-aws/_templates/extensions/OpenSearch/api/graphql/src/index.ts`
- Modify: `packages/api-background-tasks-ddb/src/BackgroundTasksDdbFeature.ts`
- Modify: `packages/background-tasks/__tests__/helpers/useTaskHandler.ts` — update `timerFactory` to `LambdaTimer`

**Interfaces:**
- Consumes: `BackgroundTasksAwsFeature`, `BackgroundTaskLambdaHandler` from `@webiny/background-tasks-aws`

- [ ] **Step 1: Update project-aws app template**

In `packages/project-aws/_templates/appTemplates/api/graphql/src/index.ts`:
```ts
// before
import { BackgroundTaskLambdaHandler } from "@webiny/background-tasks/api";
// after
import { BackgroundTaskLambdaHandler } from "@webiny/background-tasks-aws";
```

Add where `BackgroundTasksFeature.register(container)` is called:
```ts
import { BackgroundTasksAwsFeature } from "@webiny/background-tasks-aws";
// ... in the register section:
BackgroundTasksAwsFeature.register(container);
```

- [ ] **Step 2: Update OpenSearch extension template**

Same pattern in `packages/project-aws/_templates/extensions/OpenSearch/api/graphql/src/index.ts`.

- [ ] **Step 3: Update BackgroundTasksDdbFeature**

In `packages/api-background-tasks-ddb/src/BackgroundTasksDdbFeature.ts` — this just wraps `BackgroundTasksFeature`. No AWS-specific code, so no changes needed. Verify it still compiles.

- [ ] **Step 4: Update test helper**

In `packages/background-tasks/__tests__/helpers/useTaskHandler.ts`:
```ts
// before
import { timerFactory } from "@webiny/handler-aws/utils/index.js";
// after — tests don't need real Lambda timer, use a simple mock
```

Replace `timerFactory(...)` usage with inline mock:
```ts
const mockTimer = {
    getRemainingMilliseconds: () => 1_000_000,
    getRemainingSeconds: () => 1_000
};
const runner = new TaskRunner(capturedCtx, mockTimer, new TaskEventValidation());
```

- [ ] **Step 5: Run tests**

Run: `yarn test packages/background-tasks 2>&1 | tail -50`
Expected: all tests pass.

- [ ] **Step 6: Commit**

Run pre-commit checklist, then:
```
git commit -m "refactor(background-tasks): update consumers to import from background-tasks-aws"
```

---

### Task 6: Create `@webiny/background-tasks-server` package — ProcessTimer

Start the server package with `ProcessTimer` — the simplest piece with no external dependencies.

**Files:**
- Create: `packages/background-tasks-server/package.json`
- Create: `packages/background-tasks-server/tsconfig.json`
- Create: `packages/background-tasks-server/src/timer/ProcessTimer.ts`

**Interfaces:**
- Produces: `ProcessTimer` implementing `ITimer` from `@webiny/background-tasks/api`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@webiny/background-tasks-server",
  "version": "0.0.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./*": "./*"
  },
  "description": "Node server transport for Webiny background tasks (worker-thread orchestrator).",
  "repository": {
    "type": "git",
    "url": "https://github.com/webiny/webiny-js.git",
    "directory": "packages/background-tasks-server"
  },
  "license": "MIT",
  "dependencies": {
    "@webiny/background-tasks": "0.0.0",
    "@webiny/error": "0.0.0",
    "@webiny/feature": "0.0.0",
    "@webiny/plugins": "0.0.0"
  },
  "devDependencies": {
    "@webiny/build-tools": "0.0.0",
    "rimraf": "^6.1.3",
    "typescript": "6.0.3"
  },
  "publishConfig": {
    "access": "public"
  },
  "webiny": {
    "publishFrom": "dist"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "include": ["src"],
  "references": [
    { "path": "../background-tasks" },
    { "path": "../error" },
    { "path": "../feature" },
    { "path": "../plugins" }
  ],
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "declarationDir": "./dist",
    "paths": {
      "~/*": ["./src/*"]
    }
  }
}
```

- [ ] **Step 3: Create ProcessTimer**

```ts
/* packages/background-tasks-server/src/timer/ProcessTimer.ts */
import type { ITimer } from "@webiny/background-tasks/api";

const DEFAULT_MAX_DURATION_MS = 86_400_000; /* 24 hours. */

export class ProcessTimer implements ITimer {
    private readonly startTime: [number, number];
    private readonly maxDurationMs: number;

    public constructor(maxDurationMs: number = DEFAULT_MAX_DURATION_MS) {
        this.startTime = process.hrtime();
        this.maxDurationMs = maxDurationMs;
    }

    public getRemainingMilliseconds(): number {
        const elapsed = process.hrtime(this.startTime);
        const elapsedMs = elapsed[0] * 1000 + elapsed[1] / 1_000_000;
        const remaining = this.maxDurationMs - elapsedMs;
        return remaining > 0 ? remaining : 0;
    }

    public getRemainingSeconds(): number {
        return Math.floor(this.getRemainingMilliseconds() / 1000);
    }
}
```

- [ ] **Step 4: Build**

Run: `yarn build -p @webiny/background-tasks-server --safe-replace 2>&1 | tail -30`
Expected: successful build.

- [ ] **Step 5: Commit**

Run pre-commit checklist, then:
```
git commit -m "feat(background-tasks-server): add ProcessTimer with 24h default"
```

---

### Task 7: Create worker thread orchestrator

The worker's TypeScript files: message types, orchestrator class, and entry point. The worker is a dumb HTTP client loop — no Webiny, no native modules.

**Files:**
- Create: `packages/background-tasks-server/src/worker/TaskOrchestratorMessage.ts`
- Create: `packages/background-tasks-server/src/worker/TaskOrchestrator.ts`
- Create: `packages/background-tasks-server/src/worker/workerEntry.ts`

**Interfaces:**
- Consumes: `ProcessTimer` from Task 6
- Produces: `StartMessage`, `DoneMessage`, `ErrorMessage` types; `TaskOrchestrator` class; `workerEntry.ts` entry point

- [ ] **Step 1: Create message types**

```ts
/* packages/background-tasks-server/src/worker/TaskOrchestratorMessage.ts */

export interface TaskEventPayload {
    readonly webinyTaskId: string;
    readonly webinyTaskDefinitionId: string;
    readonly tenant: string;
    readonly delay: number;
}

export interface StartMessage {
    readonly type: "start";
    readonly taskEvent: TaskEventPayload;
    readonly serverUrl: string;
    readonly maxDurationMs: number;
}

export interface DoneMessage {
    readonly type: "done";
    readonly taskId: string;
    readonly result: unknown;
}

export interface ErrorMessage {
    readonly type: "error";
    readonly taskId: string;
    readonly error: string;
}

export type WorkerToParentMessage = DoneMessage | ErrorMessage;
export type ParentToWorkerMessage = StartMessage;
```

- [ ] **Step 2: Create TaskOrchestrator**

```ts
/* packages/background-tasks-server/src/worker/TaskOrchestrator.ts */
import http from "node:http";
import type { StartMessage, WorkerToParentMessage } from "./TaskOrchestratorMessage.js";
import { ProcessTimer } from "~/timer/ProcessTimer.js";

interface TaskResponse {
    status: string;
    input?: Record<string, unknown>;
    wait?: number;
    [key: string]: unknown;
}

export class TaskOrchestrator {
    private readonly serverUrl: string;
    private readonly taskEvent: StartMessage["taskEvent"];
    private readonly timer: ProcessTimer;
    private readonly postMessage: (msg: WorkerToParentMessage) => void;

    public constructor(
        message: StartMessage,
        postMessage: (msg: WorkerToParentMessage) => void
    ) {
        this.serverUrl = message.serverUrl;
        this.taskEvent = message.taskEvent;
        this.timer = new ProcessTimer(message.maxDurationMs);
        this.postMessage = postMessage;
    }

    public async run(): Promise<void> {
        const taskId = this.taskEvent.webinyTaskId;

        try {
            if (this.taskEvent.delay > 0) {
                await this.wait(this.taskEvent.delay * 1000);
            }

            let input: Record<string, unknown> = {};
            let continueLoop = true;

            while (continueLoop) {
                if (this.timer.getRemainingMilliseconds() <= 0) {
                    this.postMessage({
                        type: "error",
                        taskId,
                        error: "Task exceeded maximum duration."
                    });
                    return;
                }

                const payload = {
                    ...this.taskEvent,
                    ...input
                };

                const response = await this.post(payload);

                switch (response.status) {
                    case "continue": {
                        input = response.input || {};
                        if (response.wait && response.wait > 0) {
                            await this.wait(response.wait * 1000);
                        }
                        break;
                    }
                    case "done": {
                        this.postMessage({ type: "done", taskId, result: response });
                        continueLoop = false;
                        break;
                    }
                    case "error": {
                        this.postMessage({
                            type: "error",
                            taskId,
                            error: JSON.stringify(response)
                        });
                        continueLoop = false;
                        break;
                    }
                    default: {
                        this.postMessage({
                            type: "error",
                            taskId,
                            error: `Unknown response status: ${response.status}`
                        });
                        continueLoop = false;
                        break;
                    }
                }
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.postMessage({ type: "error", taskId, error: message });
        }
    }

    private post(payload: Record<string, unknown>): Promise<TaskResponse> {
        return new Promise((resolve, reject) => {
            const url = new URL(this.serverUrl);
            const body = JSON.stringify(payload);

            const req = http.request(
                {
                    hostname: url.hostname,
                    port: url.port,
                    path: url.pathname,
                    method: "POST",
                    headers: {
                        "content-type": "application/json",
                        "content-length": Buffer.byteLength(body)
                    }
                },
                res => {
                    let data = "";
                    res.on("data", chunk => {
                        data += chunk;
                    });
                    res.on("end", () => {
                        try {
                            resolve(JSON.parse(data) as TaskResponse);
                        } catch {
                            reject(new Error(`Invalid JSON response: ${data}`));
                        }
                    });
                }
            );

            req.on("error", reject);
            req.write(body);
            req.end();
        });
    }

    private wait(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
```

- [ ] **Step 3: Create workerEntry.ts**

```ts
/* packages/background-tasks-server/src/worker/workerEntry.ts */
import { parentPort } from "node:worker_threads";
import type { ParentToWorkerMessage } from "./TaskOrchestratorMessage.js";
import { TaskOrchestrator } from "./TaskOrchestrator.js";

if (!parentPort) {
    throw new Error("workerEntry must be run inside a worker thread.");
}

const port = parentPort;

port.on("message", async (message: ParentToWorkerMessage) => {
    if (message.type !== "start") {
        return;
    }

    const orchestrator = new TaskOrchestrator(message, msg => port.postMessage(msg));
    await orchestrator.run();

    process.exit(0);
});
```

- [ ] **Step 4: Build**

Run: `yarn build -p @webiny/background-tasks-server --safe-replace 2>&1 | tail -30`
Expected: successful build.

- [ ] **Step 5: Commit**

Run pre-commit checklist, then:
```
git commit -m "feat(background-tasks-server): add worker thread orchestrator"
```

---

### Task 8: Create WorkerTransportPlugin and BackgroundTasksServerFeature

Wire the worker transport into the DI system and create the feature entry point.

**Files:**
- Create: `packages/background-tasks-server/src/service/WorkerTransportPlugin.ts`
- Create: `packages/background-tasks-server/src/BackgroundTasksServerFeature.ts`
- Create: `packages/background-tasks-server/src/index.ts`

**Interfaces:**
- Consumes: `TaskServicePlugin`, `TaskServiceTransport` from `@webiny/background-tasks/api`; worker files from Task 7
- Produces: `WorkerTransportPlugin` (TaskServicePlugin impl); `BackgroundTasksServerFeature`

- [ ] **Step 1: Create WorkerTransportPlugin**

```ts
/* packages/background-tasks-server/src/service/WorkerTransportPlugin.ts */
import { Worker } from "node:worker_threads";
import { TaskServicePlugin } from "@webiny/background-tasks/api/plugins/TaskServicePlugin.js";
import type {
    ITaskService,
    ITaskServiceCreatePluginParams,
    ITaskServiceTask
} from "@webiny/background-tasks/api/plugins/TaskServicePlugin.js";
import type { ITask } from "@webiny/background-tasks/api/types.js";
import type { WorkerToParentMessage } from "~/worker/TaskOrchestratorMessage.js";

const DEFAULT_SERVER_PORT = 3000;
const DEFAULT_MAX_DURATION_MS = 86_400_000;

interface WorkerHandle {
    readonly worker: Worker;
    readonly startedAt: number;
    readonly taskId: string;
    public status: "running" | "done" | "error" | "timeout";
    public exitCode: number | null;
}

class WorkerTaskService implements ITaskService {
    private readonly getTenant: () => string;
    private readonly serverUrl: string;
    private readonly handles: Map<string, WorkerHandle> = new Map();

    public constructor(params: ITaskServiceCreatePluginParams) {
        this.getTenant = params.getTenant;
        const port = parseInt(process.env["WEBINY_SERVER_PORT"] || "") || DEFAULT_SERVER_PORT;
        this.serverUrl = `http://localhost:${port}/background-task`;
    }

    public async send(task: ITaskServiceTask, delay: number): Promise<unknown> {
        const workerPath = new URL("../worker/workerEntry.js", import.meta.url);
        const worker = new Worker(workerPath);

        const handle: WorkerHandle = {
            worker,
            startedAt: Date.now(),
            taskId: task.id,
            status: "running",
            exitCode: null
        };

        this.handles.set(task.id, handle);

        worker.on("message", (msg: WorkerToParentMessage) => {
            if (msg.type === "done") {
                handle.status = "done";
            } else if (msg.type === "error") {
                handle.status = "error";
            }
        });

        worker.on("exit", (code: number) => {
            handle.exitCode = code;
            if (handle.status === "running") {
                handle.status = code === 0 ? "done" : "error";
            }
        });

        worker.postMessage({
            type: "start",
            taskEvent: {
                webinyTaskId: task.id,
                webinyTaskDefinitionId: task.definitionId,
                tenant: this.getTenant(),
                delay
            },
            serverUrl: this.serverUrl,
            maxDurationMs: DEFAULT_MAX_DURATION_MS
        });

        return { workerId: worker.threadId, taskId: task.id };
    }

    public async fetch(task: ITask): Promise<Record<string, unknown> | null> {
        const handle = this.handles.get(task.id);
        if (!handle) {
            return null;
        }

        return {
            status: handle.status,
            startedAt: handle.startedAt,
            exitCode: handle.exitCode
        };
    }
}

export class WorkerTransportPlugin extends TaskServicePlugin {
    public static override readonly type: string = "tasks.taskService";
    public override name = "task.workerTransport";

    public createService(params: ITaskServiceCreatePluginParams): ITaskService {
        return new WorkerTaskService(params);
    }
}
```

Note: the `WorkerHandle` interface with mutable fields — use plain object properties, not a formal interface with `public` modifiers (interfaces don't have modifiers). Use a class or a mutable type instead:

```ts
interface WorkerHandle {
    readonly worker: Worker;
    readonly startedAt: number;
    readonly taskId: string;
    status: "running" | "done" | "error" | "timeout";
    exitCode: number | null;
}
```

- [ ] **Step 2: Create BackgroundTasksServerFeature**

```ts
/* packages/background-tasks-server/src/BackgroundTasksServerFeature.ts */
import { type Container, createFeature } from "@webiny/feature/api";
import { TaskServiceTransport } from "@webiny/background-tasks/api";
import { WorkerTransportPlugin } from "~/service/WorkerTransportPlugin.js";

export const BackgroundTasksServerFeature = createFeature({
    name: "BackgroundTasksServer",
    register(container: Container) {
        container.registerInstance(
            TaskServiceTransport,
            new WorkerTransportPlugin({ default: true })
        );
    }
});
```

- [ ] **Step 3: Create index.ts**

```ts
/* packages/background-tasks-server/src/index.ts */
export { BackgroundTasksServerFeature } from "./BackgroundTasksServerFeature.js";
export { WorkerTransportPlugin } from "./service/WorkerTransportPlugin.js";
export { ProcessTimer } from "./timer/ProcessTimer.js";
```

- [ ] **Step 4: Build**

Run: `yarn build -p @webiny/background-tasks-server --safe-replace 2>&1 | tail -30`
Expected: successful build.

- [ ] **Step 5: Commit**

Run pre-commit checklist, then:
```
git commit -m "feat(background-tasks-server): add WorkerTransportPlugin and server feature"
```

---

### Task 9: Final cleanup and full build verification

Remove leftover AWS files from core, verify all packages build, run tests.

**Files:**
- Modify: `packages/background-tasks/src/api/service/index.ts` — clean up exports
- Modify: `packages/background-tasks/tsconfig.json` — remove aws-sdk, handler-aws, event-handler-aws references
- Verify: all packages build
- Verify: all background-tasks tests pass

- [ ] **Step 1: Clean up service/index.ts in core**

Ensure `packages/background-tasks/src/api/service/index.ts` only exports:
```ts
export { createService } from "./createService.js";
```

No references to EventBridge or StepFunction.

- [ ] **Step 2: Update core tsconfig.json**

Remove these references from `packages/background-tasks/tsconfig.json`:
```json
{ "path": "../aws-sdk" },
{ "path": "../event-handler-aws" },
{ "path": "../handler-aws" },
```

- [ ] **Step 3: Verify no AWS imports in core**

Run:
```bash
grep -rn "aws-sdk\|handler-aws\|event-handler-aws" packages/background-tasks/src/ --include='*.ts'
```
Expected: zero results.

- [ ] **Step 4: Full build**

Run: `yarn build 2>&1 | tail -50`
Expected: all packages build successfully.

- [ ] **Step 5: Run background-tasks tests**

Run: `yarn test packages/background-tasks 2>&1 | tail -50`
Expected: all tests pass.

- [ ] **Step 6: Run type check on affected packages**

Run:
```bash
yarn check -p @webiny/background-tasks
yarn check -p @webiny/background-tasks-aws
yarn check -p @webiny/background-tasks-server
yarn check -p @webiny/api-background-tasks-ddb
yarn check -p @webiny/api-background-tasks-os
```
Expected: all pass.

- [ ] **Step 7: Commit**

Run pre-commit checklist, then:
```
git commit -m "chore(background-tasks): final cleanup after AWS extraction"
```
