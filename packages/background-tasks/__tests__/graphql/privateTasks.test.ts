import { describe, expect, it } from "vitest";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { useGraphQLHandler } from "~tests/helpers/useGraphQLHandler";
import { useRawHandler } from "~tests/helpers/useRawHandler";
import { createTaskDefinition } from "~tests/helpers/createTaskDefinition";
import { createMockTaskDefinitions } from "~tests/mocks/definition";
import { GetTaskUseCase } from "~/api/features/GetTask/index.js";
import { ListTasksUseCase } from "~/api/features/ListTasks/index.js";
import { TaskDataStatus, type ITask } from "~/api/types";

const PRIVATE_ID = "privateTestingTask";
const RETIRED_ID = "retiredPrivateTestingTask";
const MISSING_ID = "aTaskThatDoesNotExist";
const PUBLIC_ID = "myCustomTaskNumber1";
const OTHER_PUBLIC_ID = "myCustomTaskNumber2";

interface INamedItem {
    name: string;
}

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

describe("graphql - private tasks are invisible (R180)", () => {
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
                    .map((item: INamedItem) => {
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

            expect(firstList.data.map((item: INamedItem) => item.name)).toEqual(["Public 1"]);
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

            expect(secondList.data.map((item: INamedItem) => item.name)).toEqual(["Public 2"]);
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
                result.data.backgroundTasks.listTasks.data.map((item: INamedItem) => {
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
                result.data.backgroundTasks.listTasks.data.map((item: INamedItem) => {
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
            expect(listed.items.map((item: ITask) => item.id)).toEqual([privateTask.id]);

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
