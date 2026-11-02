### Task 7: GraphQL `triggerTask` refuses private definitions (SEC-68)

Spec 7.4; D7, D27, D57; R142, R147, R148; Review Focus 1. SEC-68 is a platform bug, fixed in `packages/background-tasks` and nowhere else (user answer Q4):

- The GraphQL mutation `WebinyBackgroundTaskMutation.triggerTask` runs any registered definition by id, including private ones (`isPrivate: true`), for any caller holding the `task.entry` write permission. Phase 5 registers a private definition (`workflowsStepRun`, Task 11) whose input is a review id and step id, so the mutation would let a caller start a step run for any review. The fix is in the resolver, which is the only place that is a trust boundary.
- The resolver depends on `GetRunnableTaskDefinitionUseCase` (`execute(id)` is synchronous and returns a `Result`). Inside the existing `resolve(async () => ...)` block, before `TriggerTaskUseCase`, a failed lookup or a definition with `isPrivate === true` throws `new TaskDefinitionNotFoundError(args.definition)` (`~/api/domain/errors.js`): code `BackgroundTasks/TaskDefinition/NotFoundError`, message `Task definition not found.`, data `{ id }`. A private definition and an unknown one therefore produce the identical error, so a caller cannot tell them apart. (Before the fix `TaskService.trigger` threw a `WebinyError` with code `TASK_DEFINITION_ERROR` and message `Task definition was not found!` for an unknown id; the resolver now checks unknown and private ids itself, so both return `TaskDefinitionNotFoundError`.) The throw sits inside `resolve` so it becomes the usual `error` payload (`ErrorResponse`), not a GraphQL transport error.
- `TriggerTaskUseCase` and `TaskService.trigger` are unchanged: internal triggers of private definitions keep working (the workflows engine triggers `workflowsStepRun` through `TaskService.trigger`, R149). The permission check order is unchanged (`checkPermissions` first).
- Out of scope: `abortTask`, `deleteTask`, `getTask` and `listTasks` stay open for private tasks to holders of `task.entry`; the `workflowsStepRun` stale guard (R144) makes abort and delete safe. Not changed here.
- The runner defences (stale guard, `createdBy` equals the requester, input never trusted) stay regardless (R144, R148); this task is the platform half.
- This task is its own commit with the `fix(background-tasks):` prefix. It touches no workflows package.

**Files:**
- Modify: `packages/background-tasks/src/api/graphql/BackgroundTasksGraphQLSchema.ts`
- Modify: `packages/background-tasks/__tests__/helpers/createTaskDefinition.ts`
- Create: `packages/background-tasks/__tests__/graphql/triggerTaskPrivate.test.ts`

**Interfaces:**
- Consumes (existing code):
  - `GetRunnableTaskDefinitionUseCase` (`~/api/features/GetRunnableTaskDefinition/abstractions.js`): `execute(id: string): Result<TaskDefinition.Runnable, TaskDefinitionNotFoundError>`, synchronous; `Runnable.isPrivate: boolean` (defaulted to `false` by `TaskDefinitionDefaultsDecorator`).
  - `TaskDefinitionNotFoundError(id: string)` (`~/api/domain/errors.js`), `code = "BackgroundTasks/TaskDefinition/NotFoundError"`, message `Task definition not found.`, data `{ id }`.
  - `TriggerTaskUseCase`, `resolve` (`./utils.js`), `checkPermissions` (`./checkPermissions.js`).
  - Test helpers: `useGraphQLHandler({ plugins })` with `triggerTask(variables)`, `listTasks()`, `listDefinitions()`; `useRawHandler({ plugins })` with `handle()` returning the context (`context.container`); `createTaskDefinition(params)` (`~tests/helpers/createTaskDefinition`); `createMockTaskDefinitions()`.
- Produces: nothing for other tasks. Platform guarantee: only the engine (through `TaskService.trigger`) can start `workflowsStepRun`.

- [ ] **Step 1: Write the failing tests**

First let the test helper build a private definition. In `packages/background-tasks/__tests__/helpers/createTaskDefinition.ts`, add `isPrivate` to `TaskParams`:

```ts
interface TaskParams<T> {
    id: string;
    title: string;
    description?: string;
    isPrivate?: boolean;
    selfCleanup?: ISelfCleanup;
    databaseLogs?: boolean;
    run: (params: TaskHandler.RunParams) => T;
    createInputValidation?: TaskHandler.Interface["createInputValidation"];
    onDone?: TaskHandler.Interface["onDone"];
    onError?: TaskHandler.Interface["onError"];
    onAbort?: TaskHandler.Interface["onAbort"];
}
```

and in the `TestingRunTask` class, after `description = params.description;`:

```ts
        isPrivate = params.isPrivate;
```

Create `packages/background-tasks/__tests__/graphql/triggerTaskPrivate.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition";
import { createMockTaskDefinitions } from "~tests/mocks/definition";
import { TaskDataStatus } from "~/api/types";

const PRIVATE_ID = "privateTestingTask";
const UNKNOWN_ID = "doesNotExistTask";

const createPrivateTaskDefinition = () => {
    return createTaskDefinition({
        id: PRIVATE_ID,
        title: "A private task",
        isPrivate: true,
        run({ controller }) {
            return controller.response.done("ran the private task");
        }
    });
};

describe("graphql - triggerTask refuses private definitions (SEC-68)", () => {
    const plugins = [...createMockTaskDefinitions(), createPrivateTaskDefinition()];
    const handler = useGraphQLHandler({ plugins });
    const rawHandler = useRawHandler({ plugins });

    it("refuses a private definition as unknown", async () => {
        const privateResult = await handler.triggerTask({
            definition: PRIVATE_ID,
            name: "Forged private run",
            input: { reviewId: "review-1", stepId: "step-1" }
        });

        expect(privateResult).toEqual({
            data: {
                backgroundTasks: {
                    triggerTask: {
                        data: null,
                        error: {
                            message: "Task definition not found.",
                            code: "BackgroundTasks/TaskDefinition/NotFoundError",
                            data: { id: PRIVATE_ID }
                        }
                    }
                }
            }
        });
    });

    it("answers a private definition exactly like an unknown one", async () => {
        const privateResult = await handler.triggerTask({ definition: PRIVATE_ID });
        const unknownResult = await handler.triggerTask({ definition: UNKNOWN_ID });

        const privateError = privateResult.data.backgroundTasks.triggerTask.error;
        const unknownError = unknownResult.data.backgroundTasks.triggerTask.error;

        expect(privateError).not.toBeNull();
        expect(unknownError).toEqual({
            message: "Task definition not found.",
            code: "BackgroundTasks/TaskDefinition/NotFoundError",
            data: { id: UNKNOWN_ID }
        });
        expect({ ...privateError, data: undefined }).toEqual({ ...unknownError, data: undefined });
        expect(privateError!.data).toEqual({ id: PRIVATE_ID });
    });

    it("creates no task when a private definition is refused", async () => {
        await handler.triggerTask({ definition: PRIVATE_ID, name: "Forged private run" });

        const listResult = await handler.listTasks();

        expect(listResult.data.backgroundTasks.listTasks.data).toEqual([]);
    });

    it("still triggers a public definition", async () => {
        const result = await handler.triggerTask({
            definition: "myCustomTaskNumber1",
            name: "A public run"
        });

        expect(result.data.backgroundTasks.triggerTask.error).toBeNull();
        expect(result.data.backgroundTasks.triggerTask.data).toMatchObject({
            definitionId: "myCustomTaskNumber1",
            name: "A public run",
            taskStatus: TaskDataStatus.PENDING
        });
    });

    it("does not list the private definition", async () => {
        const result = await handler.listDefinitions();

        const ids = result.data.backgroundTasks.listDefinitions.data!.map(
            (item: { id: string }) => item.id
        );

        expect(ids).not.toContain(PRIVATE_ID);
    });

    it("keeps internal triggers of a private definition working", async () => {
        const context = await rawHandler.handle();

        const result = await context.container.resolve(TaskService).trigger({
            definition: PRIVATE_ID,
            name: "Internal private run",
            input: { reviewId: "review-1", stepId: "step-1" }
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toMatchObject({
            definitionId: PRIVATE_ID,
            name: "Internal private run",
            taskStatus: TaskDataStatus.PENDING
        });
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/background-tasks/__tests__/graphql/triggerTaskPrivate.test.ts 2>&1 | tail -50`
Expected: FAIL. "refuses a private definition as unknown", "answers a private definition exactly like an unknown one" and "creates no task when a private definition is refused" fail (the mutation returns the created task, `error` is `null`). The other three pass.

(The `background-tasks` tests are not storage-specific: `yarn test` by path only, no `test:os` run.)

- [ ] **Step 3: Refuse private definitions in the resolver**

In `packages/background-tasks/src/api/graphql/BackgroundTasksGraphQLSchema.ts`, add the imports after the `TriggerTaskUseCase` import:

```ts
import { TriggerTaskUseCase } from "~/api/features/TriggerTask/abstractions.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/abstractions.js";
import { TaskDefinitionNotFoundError } from "~/api/domain/errors.js";
```

Replace the `triggerTask` resolver:

```ts
    builder.addResolver({
        path: "WebinyBackgroundTaskMutation.triggerTask",
        dependencies: [TriggerTaskUseCase, GetRunnableTaskDefinitionUseCase],
        resolver: (
            triggerTask: TriggerTaskUseCase.Interface,
            getRunnableTaskDefinition: GetRunnableTaskDefinitionUseCase.Interface
        ) => {
            return async ({ args, context }: IResolverParams<ITriggerTaskMutationParams>) => {
                await checkPermissions(context, { rwd: "w" });
                return resolve<ITask>(async () => {
                    // SEC-68: a private definition is an internal contract between the code that
                    // registers it and the code that triggers it through `TaskService.trigger`.
                    // GraphQL refuses it exactly like an unknown definition, so a caller cannot
                    // tell the two apart and cannot start it with input of their choice.
                    const definition = getRunnableTaskDefinition.execute(args.definition);
                    if (definition.isFail() || definition.value.isPrivate) {
                        throw new TaskDefinitionNotFoundError(args.definition);
                    }

                    const result = await triggerTask.execute(args);
                    if (result.isOk()) {
                        return result.value;
                    }

                    throw result.error;
                });
            };
        }
    });
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/background-tasks/__tests__/graphql/triggerTaskPrivate.test.ts 2>&1 | tail -50`
Expected: PASS (6 tests).

- [ ] **Step 5: Run the existing tests covering the changed code**

Run: `yarn test packages/background-tasks/__tests__/graphql/tasks.test.ts packages/background-tasks/__tests__/graphql/definitions.test.ts packages/background-tasks/__tests__/features/GetRunnableTaskDefinitionUseCase.test.ts packages/background-tasks/__tests__/crud/trigger.test.ts 2>&1 | tail -50`
Expected: PASS (the public trigger-get-list-abort flow still passes, internal `TaskService.trigger` is unchanged).

Run: `yarn check:test:types 2>&1 | grep -iE "background-tasks" | head`
Expected: no output.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/background-tasks` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
fix(background-tasks): refuse private task definitions in the graphql triggerTask mutation

The mutation now answers a private definition exactly like an unknown one
(TaskDefinitionNotFoundError). The SDK's triggerTask goes through this mutation, so it
now refuses private ids too. abortTask, deleteTask, getTask and listTasks are unchanged.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
