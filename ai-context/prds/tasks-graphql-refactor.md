# Refactor tasks GraphQL to CoreGraphQLSchemaFactory

## Context

`packages/tasks/src/graphql/index.ts` uses the legacy `ContextPlugin` + `GraphQLSchemaPlugin` pattern to build the tasks GraphQL schema. This should be refactored to the modern `CoreGraphQLSchemaFactory` pattern used throughout the codebase (e.g., `ai-powerups`, `languages`, `api-scheduler`).

The current code wraps everything in a `ContextPlugin` because it needs to:

1. Fetch CMS models (`getTaskModel`, `getLogModel`) for dynamic field/filter/sort rendering
2. Resolve `ListModelsUseCase` and `CmsModelFieldToGraphQLRegistry` from the container
3. Get task definitions for the enum
4. Access `context.tasks` for CRUD operations in resolvers

All of this can be done within `CoreGraphQLSchemaFactory.execute()` (which is async) and `builder.addResolver()` (which receives `context` at runtime and supports `dependencies`).

## Approach

Replace the `ContextPlugin` + `GraphQLSchemaPlugin` combo with a single `CoreGraphQLSchemaFactory` implementation class.

### Step 1: Create the CoreGraphQLSchemaFactory implementation

Create class `TasksGraphQLSchemaImpl implements CoreGraphQLSchemaFactory.Interface` with an async `execute(builder)` method.

**Inside `execute()`** (schema build time — async, has access to injected dependencies):

- Resolve `GetModelUseCase` and `CmsModelFieldToGraphQLRegistry` from constructor dependencies
- Resolve `ListModelsUseCase` from constructor dependencies
- Resolve `ListTaskDefinitionsUseCase` from constructor dependencies
- Resolve `IdentityContext` from constructor dependencies (for `withoutAuthorization`)
- Fetch task and log models via `GetModelUseCase` (wrapped in `withoutAuthorization`)
- Fetch all models via `ListModelsUseCase` (for `renderFields`)
- Call `renderFields`, `renderListFilterFields`, `renderSortEnum` to build dynamic typeDefs
- Call `builder.addTypeDefs(...)` with the composed schema string
- Call `builder.addResolver(...)` for each resolver

**Resolvers** — use `dependencies` array for DI abstractions where available:

| Resolver path                               | Dependencies                                                       |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `Query.backgroundTasks`                     | none (empty resolver)                                              |
| `Mutation.backgroundTasks`                  | none (empty resolver)                                              |
| `WebinyBackgroundTaskQuery.getTask`         | `GetTaskUseCase`                                                   |
| `WebinyBackgroundTaskQuery.listTasks`       | `ListTasksUseCase`                                                 |
| `WebinyBackgroundTaskQuery.listDefinitions` | `ListTaskDefinitionsUseCase`                                       |
| `WebinyBackgroundTaskQuery.listLogs`        | none — use `context.tasks.listLogs()` (no DI abstraction exists)   |
| `WebinyBackgroundTaskMutation.triggerTask`  | `TriggerTaskUseCase`                                               |
| `WebinyBackgroundTaskMutation.abortTask`    | `AbortTaskUseCase`                                                 |
| `WebinyBackgroundTaskMutation.deleteTask`   | none — use `context.tasks.deleteTask()` (no DI abstraction exists) |
| `WebinyBackgroundTask.logs`                 | none — use `context.tasks.listLogs()`                              |
| `WebinyBackgroundTaskLog.task`              | `GetTaskUseCase`                                                   |

**Permission checks**: Keep `checkPermissions(context, { rwd })` calls inside each resolver — `context` is available in the resolver params.

### Step 2: Export the implementation

```typescript
export const TasksGraphQLSchema = CoreGraphQLSchemaFactory.createImplementation({
  implementation: TasksGraphQLSchemaImpl,
  dependencies: [
    GetModelUseCase,
    ListModelsUseCase,
    CmsModelFieldToGraphQLRegistry,
    ListTaskDefinitionsUseCase,
    IdentityContext
  ]
});
```

### Step 3: Move registration into `createBackgroundTaskContext`

In `packages/tasks/src/context.ts`, add `container.register(TasksGraphQLSchema)` inside the existing context plugin (alongside the other container registrations at line ~52).

### Step 4: Remove `createBackgroundTaskGraphQL`

Delete `createBackgroundTaskGraphQL` from `packages/tasks/src/graphql/index.ts` (the function will no longer exist — the schema factory is registered via the container in step 3).

### Step 5: Update external consumers

`createBackgroundTaskGraphQL()` is consumed in 5 places:

**Production code** (remove the call, it's now handled inside `createBackgroundTaskContext`):

- `packages/api-background-tasks-ddb/src/index.ts` — remove `...createBackgroundTaskGraphQL()` from the array
- `packages/api-background-tasks-os/src/index.ts` — remove `...createBackgroundTaskGraphQL()` from the array

**Test helpers** (same removal):

- `packages/tasks/__tests__/helpers/useGraphQLHandler.ts`
- `packages/tasks/__tests__/helpers/useRawHandler.ts`
- `packages/api-headless-cms-bulk-actions/__tests__/context/useGraphQLHandler.ts`

### Step 6: Update package index exports

In `packages/tasks/src/index.ts`:

- Remove `export { createBackgroundTaskGraphQL }`
- Add `export { TasksGraphQLSchema }` (for anyone who needs the implementation directly)

## Key imports

```typescript
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.core.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields.js";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum.js";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields.js";

// Feature use cases from packages/tasks/src/features/
import { GetTaskUseCase } from "~/features/GetTask/index.js";
import { ListTasksUseCase } from "~/features/ListTasks/index.js";
import { TriggerTaskUseCase } from "~/features/TriggerTask/index.js";
import { AbortTaskUseCase } from "~/features/AbortTask/index.js";
import { ListTaskDefinitionsUseCase } from "~/features/ListTaskDefinitions/index.js";
```

## Reference implementations

- `packages/ai-powerups/src/api/graphql/BaseGraphQLSchema.ts` — simple example with DI resolver dependencies
- `packages/languages/src/api/graphql/LanguagesGraphQLSchema.ts` — Response/ErrorResponse wrappers
- `packages/api-scheduler/src/graphql/SchedulerGraphQLFactory.ts` — complex example with multiple resolvers and Result handling

## Files to modify

- `packages/tasks/src/graphql/index.ts` — rewrite: replace ContextPlugin+GraphQLSchemaPlugin with CoreGraphQLSchemaFactory class
- `packages/tasks/src/context.ts` — add `container.register(TasksGraphQLSchema)`
- `packages/tasks/src/index.ts` — remove `createBackgroundTaskGraphQL` export, add `TasksGraphQLSchema`
- `packages/tasks/src/graphql/utils.ts` — can be deleted (`emptyResolver` no longer needed; `resolve`/`resolveList` replaced by inline Result handling or `Response`/`ErrorResponse` directly)
- `packages/api-background-tasks-ddb/src/index.ts` — remove `createBackgroundTaskGraphQL` usage
- `packages/api-background-tasks-os/src/index.ts` — remove `createBackgroundTaskGraphQL` usage
- `packages/tasks/__tests__/helpers/useGraphQLHandler.ts` — remove `createBackgroundTaskGraphQL` usage
- `packages/tasks/__tests__/helpers/useRawHandler.ts` — remove `createBackgroundTaskGraphQL` usage
- `packages/api-headless-cms-bulk-actions/__tests__/context/useGraphQLHandler.ts` — remove `createBackgroundTaskGraphQL` usage

**Keep unchanged:**

- `packages/tasks/src/graphql/checkPermissions.ts` — still used inside resolvers via `context`

## Verification

1. `yarn build -p @webiny/tasks` — must compile
2. `yarn build -p @webiny/api-background-tasks-ddb` — must compile
3. `yarn build -p @webiny/api-background-tasks-os` — must compile
4. `yarn test packages/tasks` — existing tests must pass
