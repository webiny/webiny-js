### Task 4b: Background-tasks GraphQL treats private tasks as not found (R180, SEC-69, extends SEC-68)

Spec 7.4; D7, D27; R142, R147, R148, R179, R180; Review Focus 1. A platform fix in `packages/background-tasks` and nowhere else, independent of Tasks 3 and 4 (it can be done before or after them). It touches no workflows package. Phase 5 Task 7 (SEC-68) made the `triggerTask` mutation refuse private definitions; R180 extends SEC-68 to the other five operations (`getTask`, `listTasks`, `listLogs`, `abortTask`, `deleteTask`), and this task supersedes the "Out of scope" bullet of Task 7. Do not describe the reason beyond "R180 (extends SEC-68)" in code comments, tests or the commit message.

- **Rule.** A task whose definition is registered and `isPrivate` is answered by the five GraphQL operations exactly as a task that does not exist is answered today (below). A task whose definition is no longer registered is not private (the definition list has no entry for it), so nothing changes for it. `TaskService`, `TasksCrud` and the use cases (`GetTaskUseCase`, `ListTasksUseCase`, `AbortTaskUseCase`, `TriggerTaskUseCase`) are unchanged: engine code keeps seeing and driving private tasks. Only the resolvers in `BackgroundTasksGraphQLSchema.ts` change.
- **Fail closed on abort and delete.** `abortTask` and `deleteTask` first read the task; a null read (the task is missing OR the read failed) answers `TaskNotFoundError` without calling the use case, identical to the missing-task answer above. A private task is refused the same way. The extra read per abort and delete is accepted.
- **What a missing task answers today (reused exactly):**
  - `getTask`: `tasksCrud.getTask` returns `null`, so the response is `{ data: null, error: null }`. A private task returns `null` the same way.
  - `abortTask`: `TaskService.abort` returns `Result.fail(new TaskNotFoundError())` (`~/api/domain/errors.js`: code `BackgroundTasks/Task/NotFoundError`, message `Task not found.`), which the resolver throws inside `resolve`. A private task throws `new TaskNotFoundError()` from the same place, so the `error` payload is identical.
  - `deleteTask`: `TasksCrud.deleteTask` throws `new TaskNotFoundError()`. A private task throws the same error.
  - `listLogs`: there is no existence check; a log query for an unknown task id answers an empty list, `meta` `{ cursor: null, hasMoreItems: false, totalCount: 0 }`. A private task's logs answer the same.
  - `listTasks`: a private task is left out of the list.
- **How a private task is recognised.** `ListTaskDefinitionsUseCase.execute()` (decorated definitions, so `isPrivate` is defaulted to `false`; the existing `listDefinitions` resolver already filters on it) gives the registered definitions, and a small pure function over that plain data, `getPrivateDefinitionIds(definitions): string[]`, returns the ids of the private ones (new file `getPrivateDefinitionIds.ts`, no dependency, no wrapper around any use case). `GetRunnableTaskDefinitionUseCase`, which SEC-68's `triggerTask` uses, is not used here: it builds the task's handler on every call (the expensive half) and these reads only need the `isPrivate` flag. A task is private when `privateIds.includes(task.definitionId)`; each resolver calls the use case inline.
- **`listTasks`: where-filter, not post-filter.** The task model's `definitionId` is a text field and the generated `WebinyBackgroundTaskListWhereInput` has `definitionId_not_in` (`IdInterfaceGenerator<"definitionId">`; the CMS storage filters `not_in` as a negated `in`). The resolver adds the private ids to the caller's `definitionId_not_in` (the caller's own entries are kept; top-level keys are ANDed, so `definitionId`, `definitionId_in` and an `OR` block from the caller cannot bring a private task back). When no private definition is registered the arguments are passed through untouched, so every existing list test is unchanged. A storage-side filter keeps `limit`, the `after` cursor, `hasMoreItems` and `meta.totalCount` correct, which a post-filter of a page cannot (short pages, a count that includes hidden tasks). Cost: one filter value per private definition (a handful).
- **`listLogs`: guard the explicit task, post-filter the rest.** A log carries only its task id, so no storage-side filter on the task's definition exists, and listing every private task id to build `task_not_in` is unbounded. So: (1) when the query names one task (`where.task`) the resolver reads that task first and, when it is private or the read answers null (missing, or the read failed: fail closed, same as a missing task), answers the empty list with zero meta without querying logs (exact, nothing leaks through `meta`); (2) otherwise it lists as before, reads the distinct tasks of the returned page once each (`tasksCrud.getTask`) and drops the logs of private tasks and of tasks whose read answers null (orphans; hiding them is harmless), subtracting the dropped count from `meta.totalCount`. The step run task leaves no log rows after R179 (Task 4: it writes none, and an abort log is removed by the cleanup, which now sweeps logs whatever `databaseLogs` says), so the post-filter normally does nothing. Accepted residual: SEC-69 in `docs/.reports/security.md`. When no private definition is registered the query is passed through untouched.
- **Fields that follow a parent are unchanged.** `WebinyBackgroundTask.logs` runs only for a task a resolver already returned (never a private one now) and `WebinyBackgroundTaskLog.task` only for a log `listLogs` returned (never a private task's now).
- **Permissions.** The order is unchanged: `checkPermissions` first, then the private check, so a caller without the permission still gets the permission error, never a not-found.
- **Dependencies and conventions.** `ListTaskDefinitionsUseCase` and `GetTaskUseCase` are injected through the existing `dependencies` arrays of the resolvers (DI, like `TriggerTaskUseCase`). Each resolver calls the use cases inline; there is no helper or private method around them. No inline object types: the helper's parameter is the named `IDefinitionPrivacy`.
- **Test commands.** `@webiny/background-tasks` is not an `-es` / `-os` package (no storage-specific scripts; it runs on the default storage), so `yarn test <path>` only, no `test:os` run (the same as Task 7). One commit, `fix(background-tasks):`.

**Files:**
- Create: `packages/background-tasks/src/api/graphql/getPrivateDefinitionIds.ts`
- Modify: `packages/background-tasks/src/api/graphql/BackgroundTasksGraphQLSchema.ts`
- Modify: `packages/background-tasks/__tests__/helpers/graphql/tasks.ts` (delete mutation)
- Modify: `packages/background-tasks/__tests__/helpers/useGraphQLHandler.ts` (`deleteTask`)
- Create: `packages/background-tasks/__tests__/graphql/getPrivateDefinitionIds.test.ts`
- Create: `packages/background-tasks/__tests__/graphql/privateTasks.test.ts`

**Interfaces:**
- Consumes (existing code):
  - `ListTaskDefinitionsUseCase` (`~/api/features/ListTaskDefinitions/abstractions.js`): `execute(): TaskDefinition.Interface[]`, synchronous; `isPrivate?: boolean` (defaulted to `false` by `TaskDefinitionDefaultsDecorator`).
  - `GetTaskUseCase` (`~/api/features/GetTask/abstractions.js`): `execute(id): Promise<TaskService.Task | null>` (answers `null` for a missing task or a failed read).
  - `TasksCrud` (`~/api/TasksCrud.js`): `getTask(id)`, `listTasks(params)`, `listLogs(params)`, `deleteTask(id)`.
  - `AbortTaskUseCase` (`~/api/features/AbortTask/abstractions.js`), `TaskNotFoundError` (`~/api/domain/errors.js`: code `BackgroundTasks/Task/NotFoundError`, message `Task not found.`), `resolve`, `resolveList` (`./utils.js`), `checkPermissions` (`./checkPermissions.js`).
  - `IListTaskParams`, `IListTaskLogParams` (`~/api/types.js`); `IdInterfaceGenerator<"definitionId">` gives `definitionId_not_in?: string[]`, `IdInterfaceGenerator<"task">` gives `task?: string`.
  - Test helpers: `useGraphQLHandler({ plugins })` (`triggerTask`, `getTask`, `abortTask`, `listTasks(variables)`, `listTaskLogsQuery(variables)`), `useRawHandler({ plugins })` with `handle()` returning the context (`context.tasks`, `context.container`), `createTaskDefinition(params)` with `isPrivate` and `databaseLogs` (`~tests/helpers/createTaskDefinition`; `isPrivate` was added by Task 7), `createMockTaskDefinitions()` (`myCustomTaskNumber1..3`).
- Produces: nothing for other tasks. Platform guarantee: the background-tasks GraphQL never returns, lists, aborts or deletes a private task; `getPrivateDefinitionIds` is internal to the GraphQL folder (not exported from any barrel).

- [ ] **Step 1: Write the failing tests**

Add the delete helper to `packages/background-tasks/__tests__/helpers/graphql/tasks.ts` (append after `createGetTaskQuery`):

```ts
export interface IDeleteTaskVariables {
    id: string;
}

export interface IDeleteTaskResponse {
    data: {
        backgroundTasks: {
            deleteTask: {
                data: boolean | null;
                error: ITaskError | null;
            };
        };
    };
}

export const createDeleteTaskMutation = () => {
    return /* GraphQL */ `
        mutation DeleteTask($id: ID!) {
            backgroundTasks {
                deleteTask(id: $id) {
                    data
                    error {
                        message
                        code
                        data
                    }
                }
            }
        }
    `;
};
```

In `packages/background-tasks/__tests__/helpers/useGraphQLHandler.ts`, extend the import from `~tests/helpers/graphql/tasks`:

```ts
import {
    createAbortTaskMutation,
    createDeleteTaskMutation,
    createGetTaskQuery,
    createListTasksQuery,
    createTriggerTaskMutation,
    type IAbortTaskResponse,
    type IAbortTaskVariables,
    type IDeleteTaskResponse,
    type IDeleteTaskVariables,
    type IGetTaskResponse,
    type IGetTaskVariables,
    type ITriggerTaskResponse,
    type ITriggerTaskVariables
} from "~tests/helpers/graphql/tasks";
```

and add the method after `abortTask`:

```ts
        deleteTask: async (variables: IDeleteTaskVariables) => {
            return invoke<IDeleteTaskResponse>({
                body: { query: createDeleteTaskMutation(), variables }
            });
        },
```

Create `packages/background-tasks/__tests__/graphql/getPrivateDefinitionIds.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getPrivateDefinitionIds } from "~/api/graphql/getPrivateDefinitionIds";

describe("getPrivateDefinitionIds (R180)", () => {
    it("returns the ids of the private definitions only", () => {
        const ids = getPrivateDefinitionIds([
            { id: "publicTask", isPrivate: false },
            { id: "privateTask", isPrivate: true },
            { id: "unsetTask" },
            { id: "anotherPrivateTask", isPrivate: true }
        ]);

        expect(ids).toEqual(["privateTask", "anotherPrivateTask"]);
    });

    it("returns an empty list when nothing is private", () => {
        expect(getPrivateDefinitionIds([{ id: "publicTask", isPrivate: false }])).toEqual([]);
        expect(getPrivateDefinitionIds([])).toEqual([]);
    });
});
```

Create `packages/background-tasks/__tests__/graphql/privateTasks.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition";
import { createMockTaskDefinitions } from "~tests/mocks/definition";
import { GetTaskUseCase } from "~/api/features/GetTask/index.js";
import { ListTasksUseCase } from "~/api/features/ListTasks/index.js";
import { TaskDataStatus } from "~/api/types";

const PRIVATE_ID = "privateTestingTask";
const RETIRED_ID = "retiredPrivateTestingTask";
const MISSING_ID = "aTaskThatDoesNotExist";
const PUBLIC_ID = "myCustomTaskNumber1";
const OTHER_PUBLIC_ID = "myCustomTaskNumber2";

const NOT_FOUND_CODE = "BackgroundTasks/Task/NotFoundError";

// The model stamps `createdOn` with the current millisecond, so tasks created back to back can
// share it. A real pause between creates gives the pagination test a stable sort order.
const pause = () => new Promise<void>(resolve => setTimeout(resolve, 10));

const createPrivateTaskDefinition = () => {
    return createTaskDefinition({
        id: PRIVATE_ID,
        title: "A private task",
        isPrivate: true,
        databaseLogs: true,
        run({ controller }) {
            return controller.response.done("ran the private task");
        }
    });
};

const createRetiredTaskDefinition = () => {
    return createTaskDefinition({
        id: RETIRED_ID,
        title: "A private task that is no longer registered",
        isPrivate: true,
        run({ controller }) {
            return controller.response.done("ran the retired task");
        }
    });
};

describe("graphql - private tasks are invisible (R180, extends SEC-68)", () => {
    const plugins = [...createMockTaskDefinitions(), createPrivateTaskDefinition()];
    const handler = useGraphQLHandler({ plugins });
    const rawHandler = useRawHandler({ plugins });
    // The same storage, with one more definition: it creates a task whose definition the
    // GraphQL handler above does not know, as after a definition is removed.
    const retiredRawHandler = useRawHandler({
        plugins: [...plugins, createRetiredTaskDefinition()]
    });

    describe("getTask", () => {
        it("answers a private task exactly like a missing one", async () => {
            const context = await rawHandler.handle();
            const privateTask = await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private run",
                input: {}
            });

            const privateResult = await handler.getTask({ id: privateTask.id });
            const missingResult = await handler.getTask({ id: MISSING_ID });

            expect(missingResult).toEqual({
                data: { backgroundTasks: { getTask: { data: null, error: null } } }
            });
            expect(privateResult).toEqual(missingResult);
        });

        it("still returns a public task", async () => {
            const context = await rawHandler.handle();
            const publicTask = await context.tasks.createTask({
                definitionId: PUBLIC_ID,
                name: "Public run",
                input: {}
            });

            const result = await handler.getTask({ id: publicTask.id });

            expect(result.data.backgroundTasks.getTask.error).toBeNull();
            expect(result.data.backgroundTasks.getTask.data).toMatchObject({
                id: publicTask.id,
                definitionId: PUBLIC_ID,
                name: "Public run"
            });
        });

        it("returns a task whose definition is no longer registered", async () => {
            const retiredContext = await retiredRawHandler.handle();
            const retiredTask = await retiredContext.tasks.createTask({
                definitionId: RETIRED_ID,
                name: "Retired run",
                input: {}
            });

            const result = await handler.getTask({ id: retiredTask.id });

            expect(result.data.backgroundTasks.getTask.error).toBeNull();
            expect(result.data.backgroundTasks.getTask.data).toMatchObject({
                id: retiredTask.id,
                definitionId: RETIRED_ID
            });
        });
    });

    describe("listTasks", () => {
        it("leaves private tasks out, with a correct total", async () => {
            const context = await rawHandler.handle();
            await context.tasks.createTask({
                definitionId: PUBLIC_ID,
                name: "Public 1",
                input: {}
            });
            await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private 1",
                input: {}
            });
            await context.tasks.createTask({
                definitionId: OTHER_PUBLIC_ID,
                name: "Public 2",
                input: {}
            });
            await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private 2",
                input: {}
            });

            const result = await handler.listTasks({});

            expect(result.data.backgroundTasks.listTasks.error).toBeNull();
            // The order is not asserted here (creation instants can tie): the set and the total are.
            expect(
                result.data.backgroundTasks.listTasks.data
                    .map((item: { name: string }) => {
                        return item.name;
                    })
                    .sort()
            ).toEqual(["Public 1", "Public 2"]);
            expect(result.data.backgroundTasks.listTasks.meta).toEqual({
                cursor: null,
                hasMoreItems: false,
                totalCount: 2
            });
        });

        it("paginates over public tasks only", async () => {
            const context = await rawHandler.handle();
            await context.tasks.createTask({
                definitionId: PUBLIC_ID,
                name: "Public 1",
                input: {}
            });
            await pause();
            await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private 1",
                input: {}
            });
            await pause();
            await context.tasks.createTask({
                definitionId: OTHER_PUBLIC_ID,
                name: "Public 2",
                input: {}
            });

            const first = await handler.listTasks({ sort: ["createdOn_ASC"], limit: 1 });
            const firstList = first.data.backgroundTasks.listTasks;

            expect(firstList.data.map((item: { name: string }) => item.name)).toEqual([
                "Public 1"
            ]);
            expect(firstList.meta).toEqual({
                cursor: expect.any(String),
                hasMoreItems: true,
                totalCount: 2
            });

            const second = await handler.listTasks({
                sort: ["createdOn_ASC"],
                limit: 1,
                after: firstList.meta.cursor
            });
            const secondList = second.data.backgroundTasks.listTasks;

            expect(secondList.data.map((item: { name: string }) => item.name)).toEqual([
                "Public 2"
            ]);
            expect(secondList.meta).toEqual({
                cursor: null,
                hasMoreItems: false,
                totalCount: 2
            });
        });

        it("keeps the caller's own definitionId_not_in and still leaves private tasks out", async () => {
            const context = await rawHandler.handle();
            await context.tasks.createTask({
                definitionId: PUBLIC_ID,
                name: "Public 1",
                input: {}
            });
            await context.tasks.createTask({
                definitionId: OTHER_PUBLIC_ID,
                name: "Public 2",
                input: {}
            });
            await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private 1",
                input: {}
            });

            const result = await handler.listTasks({
                where: { definitionId_not_in: [PUBLIC_ID] }
            });

            expect(
                result.data.backgroundTasks.listTasks.data.map((item: { name: string }) => {
                    return item.name;
                })
            ).toEqual(["Public 2"]);
            expect(result.data.backgroundTasks.listTasks.meta.totalCount).toBe(1);
        });

        it("answers an explicit filter on the private definition with an empty list", async () => {
            const context = await rawHandler.handle();
            await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private 1",
                input: {}
            });

            const privateResult = await handler.listTasks({
                where: { definitionId: PRIVATE_ID }
            });
            const missingResult = await handler.listTasks({
                where: { definitionId: MISSING_ID }
            });

            expect(missingResult.data.backgroundTasks.listTasks).toEqual({
                data: [],
                meta: { cursor: null, hasMoreItems: false, totalCount: 0 },
                error: null
            });
            expect(privateResult).toEqual(missingResult);
        });

        it("lists a task whose definition is no longer registered", async () => {
            const retiredContext = await retiredRawHandler.handle();
            await retiredContext.tasks.createTask({
                definitionId: RETIRED_ID,
                name: "Retired run",
                input: {}
            });

            const result = await handler.listTasks();

            expect(
                result.data.backgroundTasks.listTasks.data.map((item: { name: string }) => {
                    return item.name;
                })
            ).toEqual(["Retired run"]);
        });
    });

    describe("listLogs", () => {
        it("answers the logs of a private task exactly like those of a missing task", async () => {
            const context = await rawHandler.handle();
            const privateTask = await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private run",
                input: {}
            });
            await context.tasks.createLog(privateTask, {
                executionName: "privateExecution",
                iteration: 1
            });

            const privateResult = await handler.listTaskLogsQuery({
                where: { task: privateTask.id }
            });
            const missingResult = await handler.listTaskLogsQuery({
                where: { task: MISSING_ID }
            });

            expect(missingResult).toEqual({
                data: {
                    backgroundTasks: {
                        listLogs: {
                            data: [],
                            meta: { cursor: null, hasMoreItems: false, totalCount: 0 },
                            error: null
                        }
                    }
                }
            });
            expect(privateResult).toEqual(missingResult);
        });

        it("leaves the logs of a private task out of an unfiltered list", async () => {
            const context = await rawHandler.handle();
            const privateTask = await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private run",
                input: {}
            });
            const publicTask = await context.tasks.createTask({
                definitionId: PUBLIC_ID,
                name: "Public run",
                input: {}
            });
            await context.tasks.createLog(privateTask, {
                executionName: "privateExecution",
                iteration: 1
            });
            await context.tasks.createLog(publicTask, {
                executionName: "publicExecution",
                iteration: 1
            });

            const result = await handler.listTaskLogsQuery();
            const list = result.data.backgroundTasks.listLogs;

            expect(list.error).toBeNull();
            expect(list.data).toHaveLength(1);
            expect(list.data[0]).toMatchObject({
                executionName: "publicExecution",
                task: { id: publicTask.id }
            });
            expect(list.meta.totalCount).toBe(1);
        });

        it("leaves out the logs of a task that no longer exists", async () => {
            const context = await rawHandler.handle();
            const goneTask = await context.tasks.createTask({
                definitionId: PUBLIC_ID,
                name: "Gone run",
                input: {}
            });
            const publicTask = await context.tasks.createTask({
                definitionId: PUBLIC_ID,
                name: "Public run",
                input: {}
            });
            await context.tasks.createLog(goneTask, {
                executionName: "goneExecution",
                iteration: 1
            });
            await context.tasks.createLog(publicTask, {
                executionName: "publicExecution",
                iteration: 1
            });
            await context.tasks.deleteTask(goneTask.id);

            const result = await handler.listTaskLogsQuery();
            const list = result.data.backgroundTasks.listLogs;

            expect(list.error).toBeNull();
            expect(list.data).toHaveLength(1);
            expect(list.data[0]).toMatchObject({ executionName: "publicExecution" });
            expect(list.meta.totalCount).toBe(1);
        });

        it("leaves the logs of a private task out of a task_in list", async () => {
            const context = await rawHandler.handle();
            const privateTask = await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private run",
                input: {}
            });
            const publicTask = await context.tasks.createTask({
                definitionId: PUBLIC_ID,
                name: "Public run",
                input: {}
            });
            await context.tasks.createLog(privateTask, {
                executionName: "privateExecution",
                iteration: 1
            });
            await context.tasks.createLog(publicTask, {
                executionName: "publicExecution",
                iteration: 1
            });

            const result = await handler.listTaskLogsQuery({
                where: { task_in: [privateTask.id, publicTask.id] }
            });
            const list = result.data.backgroundTasks.listLogs;

            expect(list.data).toHaveLength(1);
            expect(list.data[0]).toMatchObject({ executionName: "publicExecution" });
            expect(list.meta.totalCount).toBe(1);
        });

        it("still lists the logs of a public task", async () => {
            const context = await rawHandler.handle();
            const publicTask = await context.tasks.createTask({
                definitionId: PUBLIC_ID,
                name: "Public run",
                input: {}
            });
            await context.tasks.createLog(publicTask, {
                executionName: "publicExecution",
                iteration: 1
            });

            const result = await handler.listTaskLogsQuery({ where: { task: publicTask.id } });
            const list = result.data.backgroundTasks.listLogs;

            expect(list.data).toHaveLength(1);
            expect(list.data[0]).toMatchObject({
                executionName: "publicExecution",
                task: { id: publicTask.id }
            });
            expect(list.meta).toEqual({ cursor: null, hasMoreItems: false, totalCount: 1 });
        });
    });

    describe("abortTask", () => {
        it("refuses a private task exactly like a missing one and leaves it pending", async () => {
            const context = await rawHandler.handle();
            const privateTask = await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private run",
                input: {}
            });

            const privateResult = await handler.abortTask({ id: privateTask.id });
            const missingResult = await handler.abortTask({ id: MISSING_ID });

            expect(missingResult.data.backgroundTasks.abortTask.data).toBeNull();
            expect(missingResult.data.backgroundTasks.abortTask.error).toMatchObject({
                code: NOT_FOUND_CODE,
                message: "Task not found."
            });
            expect(privateResult).toEqual(missingResult);

            const stored = await context.tasks.getTask(privateTask.id);
            expect(stored?.taskStatus).toBe(TaskDataStatus.PENDING);
        });

        it("still aborts a public task", async () => {
            const context = await rawHandler.handle();
            const publicTask = await context.tasks.createTask({
                definitionId: PUBLIC_ID,
                name: "Public run",
                input: {}
            });

            const result = await handler.abortTask({ id: publicTask.id });

            expect(result.data.backgroundTasks.abortTask.error).toBeNull();
            expect(result.data.backgroundTasks.abortTask.data).toMatchObject({
                id: publicTask.id,
                taskStatus: TaskDataStatus.ABORTED
            });
        });
    });

    describe("deleteTask", () => {
        it("refuses a private task exactly like a missing one and keeps it", async () => {
            const context = await rawHandler.handle();
            const privateTask = await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private run",
                input: {}
            });

            const privateResult = await handler.deleteTask({ id: privateTask.id });
            const missingResult = await handler.deleteTask({ id: MISSING_ID });

            expect(missingResult.data.backgroundTasks.deleteTask.data).toBeNull();
            expect(missingResult.data.backgroundTasks.deleteTask.error).toMatchObject({
                code: NOT_FOUND_CODE,
                message: "Task not found."
            });
            expect(privateResult).toEqual(missingResult);

            expect(await context.tasks.getTask(privateTask.id)).not.toBeNull();
        });

        it("still deletes a public task", async () => {
            const context = await rawHandler.handle();
            const publicTask = await context.tasks.createTask({
                definitionId: PUBLIC_ID,
                name: "Public run",
                input: {}
            });

            const result = await handler.deleteTask({ id: publicTask.id });

            expect(result).toEqual({
                data: { backgroundTasks: { deleteTask: { data: true, error: null } } }
            });
            expect(await context.tasks.getTask(publicTask.id)).toBeNull();
        });

        it("deletes a task whose definition is no longer registered", async () => {
            const retiredContext = await retiredRawHandler.handle();
            const retiredTask = await retiredContext.tasks.createTask({
                definitionId: RETIRED_ID,
                name: "Retired run",
                input: {}
            });

            const result = await handler.deleteTask({ id: retiredTask.id });

            expect(result).toEqual({
                data: { backgroundTasks: { deleteTask: { data: true, error: null } } }
            });
        });
    });

    describe("engine code", () => {
        it("still sees, lists, aborts and deletes a private task through the services", async () => {
            const context = await rawHandler.handle();
            const privateTask = await context.tasks.createTask({
                definitionId: PRIVATE_ID,
                name: "Private run",
                input: {}
            });

            const fetched = await context.container.resolve(GetTaskUseCase).execute(privateTask.id);
            expect(fetched).toMatchObject({ id: privateTask.id, definitionId: PRIVATE_ID });

            const listed = await context.container
                .resolve(ListTasksUseCase)
                .execute({ where: { definitionId: PRIVATE_ID } });
            expect(listed.items.map(item => item.id)).toEqual([privateTask.id]);

            const aborted = await context.container.resolve(TaskService).abort({
                id: privateTask.id,
                message: "Aborted by the engine."
            });
            expect(aborted.isOk()).toBe(true);
            expect(aborted.value).toMatchObject({
                id: privateTask.id,
                taskStatus: TaskDataStatus.ABORTED
            });

            expect(await context.tasks.deleteTask(privateTask.id)).toBe(true);
            expect(await context.tasks.getTask(privateTask.id)).toBeNull();
        });

        it("still triggers a private definition through TaskService", async () => {
            const context = await rawHandler.handle();

            const result = await context.container.resolve(TaskService).trigger({
                definition: PRIVATE_ID,
                name: "Internal private run",
                input: {}
            });

            expect(result.isOk()).toBe(true);
            expect(result.value).toMatchObject({
                definitionId: PRIVATE_ID,
                taskStatus: TaskDataStatus.PENDING
            });
        });
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/background-tasks/__tests__/graphql/getPrivateDefinitionIds.test.ts packages/background-tasks/__tests__/graphql/privateTasks.test.ts 2>&1 | tail -50`
Expected: FAIL. `getPrivateDefinitionIds.test.ts` does not load (`Cannot find module '~/api/graphql/getPrivateDefinitionIds'`). In `privateTasks.test.ts`: "answers a private task exactly like a missing one" (the task is returned), "leaves private tasks out, with a correct total", "paginates over public tasks only", "keeps the caller's own definitionId_not_in and still leaves private tasks out", "answers an explicit filter on the private definition with an empty list", the three private `listLogs` tests, "leaves out the logs of a task that no longer exists" (the orphan log is listed), "refuses a private task exactly like a missing one and leaves it pending" and "refuses a private task exactly like a missing one and keeps it" fail. The public, retired-definition and engine tests pass: they pin behaviour that must not change.

(`yarn test` by path only, no `test:os` run: the package is not storage-specific.)

- [ ] **Step 3: Implement the private check in the resolvers**

Create `packages/background-tasks/src/api/graphql/getPrivateDefinitionIds.ts`:

```ts
export interface IDefinitionPrivacy {
    id: string;
    isPrivate?: boolean;
}

/**
 * The ids of the private task definitions (R180). A pure function over plain data: the resolvers
 * read the registered definitions with `ListTaskDefinitionsUseCase` themselves and pass them in.
 * A task whose definition is not in the list (no longer registered) is not private.
 */
export const getPrivateDefinitionIds = (
    definitions: ReadonlyArray<IDefinitionPrivacy>
): string[] => {
    return definitions.filter(definition => definition.isPrivate === true).map(item => item.id);
};
```

In `packages/background-tasks/src/api/graphql/BackgroundTasksGraphQLSchema.ts`, change the imports (add `GetTaskUseCase`, `TaskNotFoundError`, `getPrivateDefinitionIds`):

```ts
import { ListTaskDefinitionsUseCase } from "~/api/features/ListTaskDefinitions/abstractions.js";
import { TriggerTaskUseCase } from "~/api/features/TriggerTask/abstractions.js";
import { GetRunnableTaskDefinitionUseCase } from "~/api/features/GetRunnableTaskDefinition/abstractions.js";
import { GetTaskUseCase } from "~/api/features/GetTask/abstractions.js";
import { TaskDefinitionNotFoundError, TaskNotFoundError } from "~/api/domain/errors.js";
import { AbortTaskUseCase } from "~/api/features/AbortTask/abstractions.js";
import { GetBackgroundTaskSettingsRepository } from "~/api/features/GetBackgroundTaskSettings/abstractions.js";
import { UpdateBackgroundTaskSettingsUseCase } from "~/api/features/UpdateBackgroundTaskSettings/abstractions.js";
import type { IUpdateBackgroundTaskSettingsInput } from "~/api/features/UpdateBackgroundTaskSettings/abstractions.js";
import { emptyResolver, resolve, resolveList } from "./utils.js";
import { checkPermissions } from "./checkPermissions.js";
import { getPrivateDefinitionIds } from "./getPrivateDefinitionIds.js";
```

Replace the `getTask`, `listTasks` and `listLogs` resolvers in `addQueryResolvers` (`listDefinitions` and `getSettings` stay as they are):

```ts
    builder.addResolver({
        path: "WebinyBackgroundTaskQuery.getTask",
        dependencies: [TasksCrud, ListTaskDefinitionsUseCase],
        resolver: (
            tasksCrud: TasksCrud.Interface,
            listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
        ) => {
            return ({ args, context }: IResolverParams<IGetTaskQueryParams>) => {
                return resolve(async () => {
                    await checkPermissions(context, { rwd: "r" });
                    const task = await tasksCrud.getTask(args.id);
                    // R180 (extends SEC-68): a private task is answered like a missing one.
                    const privateIds = getPrivateDefinitionIds(listTaskDefinitions.execute());
                    if (task && privateIds.includes(task.definitionId)) {
                        return null;
                    }
                    return task;
                });
            };
        }
    });

    builder.addResolver({
        path: "WebinyBackgroundTaskQuery.listTasks",
        dependencies: [TasksCrud, ListTaskDefinitionsUseCase],
        resolver: (
            tasksCrud: TasksCrud.Interface,
            listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
        ) => {
            return ({ args, context }: IResolverParams<IListTaskParams>) => {
                return resolveList(async () => {
                    await checkPermissions(context, { rwd: "r" });
                    // R180 (extends SEC-68): private tasks are filtered by the storage, so the
                    // cursor, `hasMoreItems` and `totalCount` only ever count public tasks. The
                    // caller's own `definitionId_not_in` is kept.
                    const privateIds = getPrivateDefinitionIds(listTaskDefinitions.execute());
                    if (privateIds.length === 0) {
                        return await tasksCrud.listTasks(args);
                    }
                    return await tasksCrud.listTasks({
                        ...args,
                        where: {
                            ...args?.where,
                            definitionId_not_in: [
                                ...(args?.where?.definitionId_not_in || []),
                                ...privateIds
                            ]
                        }
                    });
                });
            };
        }
    });
```

```ts
    builder.addResolver({
        path: "WebinyBackgroundTaskQuery.listLogs",
        dependencies: [TasksCrud, ListTaskDefinitionsUseCase],
        resolver: (
            tasksCrud: TasksCrud.Interface,
            listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
        ) => {
            return ({ args, context }: IResolverParams<IListTaskLogParams>) => {
                return resolveList(async () => {
                    await checkPermissions(context, { rwd: "r" });
                    const privateIds = getPrivateDefinitionIds(listTaskDefinitions.execute());
                    if (privateIds.length === 0) {
                        return await tasksCrud.listLogs(args);
                    }

                    // R180 (extends SEC-68). A query for one task: when it is private, or the read
                    // answers null (missing, or the read failed: fail closed), answer what a missing
                    // task answers, an empty list, without querying the logs.
                    const requestedTaskId = args.where?.task;
                    if (requestedTaskId) {
                        const requestedTask = await tasksCrud.getTask(requestedTaskId);
                        if (!requestedTask || privateIds.includes(requestedTask.definitionId)) {
                            return {
                                items: [],
                                meta: { cursor: null, hasMoreItems: false, totalCount: 0 }
                            };
                        }
                    }

                    // Any other query: drop the logs of private tasks, and of tasks whose read
                    // answers null (orphans, or a failed read: fail closed; hiding an orphan is
                    // harmless), from the page. A log only carries its task id, so the tasks of
                    // the page are read once each.
                    const result = await tasksCrud.listLogs(args);
                    const taskIds = Array.from(new Set(result.items.map(log => log.task)));
                    const tasks = await Promise.all(taskIds.map(id => tasksCrud.getTask(id)));
                    const hiddenTaskIds = new Set<string>();
                    taskIds.forEach((taskId, index) => {
                        const task = tasks[index];
                        if (!task || privateIds.includes(task.definitionId)) {
                            hiddenTaskIds.add(taskId);
                        }
                    });
                    if (hiddenTaskIds.size === 0) {
                        return result;
                    }

                    const items = result.items.filter(log => !hiddenTaskIds.has(log.task));
                    const dropped = result.items.length - items.length;
                    return {
                        items,
                        meta: { ...result.meta, totalCount: result.meta.totalCount - dropped }
                    };
                });
            };
        }
    });
```

Replace the `abortTask` and `deleteTask` resolvers in `addMutationResolvers` (`triggerTask` and `updateSettings` stay as they are):

```ts
    builder.addResolver({
        path: "WebinyBackgroundTaskMutation.abortTask",
        dependencies: [AbortTaskUseCase, GetTaskUseCase, ListTaskDefinitionsUseCase],
        resolver: (
            abortTask: AbortTaskUseCase.Interface,
            getTask: GetTaskUseCase.Interface,
            listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
        ) => {
            return async ({ args, context }: IResolverParams<IAbortTaskMutationParams>) => {
                await checkPermissions(context, { rwd: "w" });
                return resolve<ITask>(async () => {
                    // R180 (extends SEC-68): a private task is refused with the error a missing
                    // task gets from `TaskService.abort`. A null read (the task is missing or
                    // the read failed) is refused the same way without calling the use case:
                    // fail closed, and the answer is identical to the missing-task answer.
                    const task = await getTask.execute(args.id);
                    const privateIds = getPrivateDefinitionIds(listTaskDefinitions.execute());
                    if (!task || privateIds.includes(task.definitionId)) {
                        throw new TaskNotFoundError();
                    }

                    const result = await abortTask.execute(args);
                    if (result.isOk()) {
                        return result.value;
                    }

                    throw result.error;
                });
            };
        }
    });
```

```ts
    builder.addResolver({
        path: "WebinyBackgroundTaskMutation.deleteTask",
        dependencies: [TasksCrud, ListTaskDefinitionsUseCase],
        resolver: (
            tasksCrud: TasksCrud.Interface,
            listTaskDefinitions: ListTaskDefinitionsUseCase.Interface
        ) => {
            return async ({ args, context }: IResolverParams<IDeleteTaskMutationParams>) => {
                await checkPermissions(context, { rwd: "d" });
                return resolve(async () => {
                    // R180 (extends SEC-68): a private task is refused with the error a missing
                    // task gets from `TasksCrud.deleteTask`. A null read (missing, or the read
                    // failed) is refused the same way without calling `deleteTask`: fail closed.
                    const task = await tasksCrud.getTask(args.id);
                    const privateIds = getPrivateDefinitionIds(listTaskDefinitions.execute());
                    if (!task || privateIds.includes(task.definitionId)) {
                        throw new TaskNotFoundError();
                    }

                    return await tasksCrud.deleteTask(args.id);
                });
            };
        }
    });
```

`addFieldResolvers`, the schema factory class and the type definitions are unchanged.

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/background-tasks/__tests__/graphql/getPrivateDefinitionIds.test.ts packages/background-tasks/__tests__/graphql/privateTasks.test.ts 2>&1 | tail -50`
Expected: PASS (2 + 20 tests). If "paginates over public tasks only" or "keeps the caller's own definitionId_not_in and still leaves private tasks out" fail because the storage does not apply `definitionId_not_in`, stop and report: the fallback is a post-filter of `listTasks` (fetch with the caller's page size, drop private tasks, correct `totalCount`), but that must be decided with the user, not improvised.

- [ ] **Step 5: Run the existing tests covering the changed code**

Run: `yarn test packages/background-tasks/__tests__/graphql/tasks.test.ts packages/background-tasks/__tests__/graphql/logs.test.ts packages/background-tasks/__tests__/graphql/definitions.test.ts packages/background-tasks/__tests__/graphql/settings.test.ts packages/background-tasks/__tests__/graphql/triggerTaskPrivate.test.ts packages/background-tasks/__tests__/features/GetRunnableTaskDefinitionUseCase.test.ts packages/background-tasks/__tests__/crud/trigger.test.ts 2>&1 | tail -50`
Expected: PASS, with no expectation changed (no private definition is registered in those files, so the resolvers pass their arguments through untouched; `triggerTaskPrivate.test.ts` still proves the SEC-68 refusal and the internal trigger).

Run: `yarn check:test:types 2>&1 | grep -iE "background-tasks" | head`
Expected: no output.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/background-tasks` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
fix(background-tasks): treat private tasks as not found in the background tasks graphql

getTask, listTasks, listLogs, abortTask and deleteTask answer a task of a private definition
as they answer a task that does not exist. Engine code (TaskService and the use cases) is
unchanged. R180 (extends SEC-68).

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```

Then record the new SEC id in the gitignored `docs/.reports/security.md` (never in a committed file).
