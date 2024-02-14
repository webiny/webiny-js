import { TaskManagerStore } from "~/runner/TaskManagerStore";
import { createMockTask } from "~tests/mocks/task";
import { useHandler } from "~tests/helpers/useHandler";
import { createMockTaskDefinitions } from "~tests/mocks/definition";

describe("task manager store", () => {
    it("should get task", async () => {
        const mockTask = createMockTask();

        const { handle } = useHandler({
            plugins: [...createMockTaskDefinitions()]
        });
        const context = await handle();

        const task = await context.tasks.createTask({
            ...mockTask,
            definitionId: "myCustomTaskNumber1"
        });

        const log = await context.tasks.createLog(task, {
            executionName: task.executionName,
            iteration: 1
        });

        const store = new TaskManagerStore(context, task, log);

        expect(store.getTask()).toEqual(task);
    });

    it("should update task input", async () => {
        const mockTask = createMockTask();

        const { handle } = useHandler({
            plugins: [...createMockTaskDefinitions()]
        });
        const context = await handle();

        const task = await context.tasks.createTask({
            ...mockTask,
            definitionId: "myCustomTaskNumber1"
        });

        const log = await context.tasks.createLog(task, {
            executionName: task.executionName,
            iteration: 1
        });

        const store = new TaskManagerStore(context, task, log);
        const input = {
            test: "test"
        };
        await store.updateInput({ ...input });
        expect(store.getInput()).toEqual(input);
        expect(store.getTask()).toEqual({
            ...task,
            input: {
                ...task.input,
                ...input
            },
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/)
        });

        await store.updateInput(input => {
            return {
                ...input,
                anotherOne: true
            };
        });
        expect(store.getInput()).toEqual({
            ...input,
            anotherOne: true
        });
        expect(store.getTask()).toEqual({
            ...task,
            input: {
                ...task.input,
                ...input,
                anotherOne: true
            },
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/)
        });
    });

    it("should not update input", async () => {
        const mockTask = createMockTask();

        const { handle } = useHandler({
            plugins: [...createMockTaskDefinitions()]
        });
        const context = await handle();

        const task = await context.tasks.createTask({
            ...mockTask,
            definitionId: "myCustomTaskNumber1"
        });

        const log = await context.tasks.createLog(task, {
            executionName: task.executionName,
            iteration: 1
        });

        const store = new TaskManagerStore(context, task, log);

        await store.updateInput({ ...task.input });
        expect(store.getInput()).toEqual(task.input);

        await store.updateInput({});
        expect(store.getInput()).toEqual(task.input);

        await store.updateInput(input => {
            return input;
        });
        expect(store.getInput()).toEqual(task.input);
    });

    it("should update task", async () => {
        const mockTask = createMockTask();

        const { handle } = useHandler({
            plugins: [...createMockTaskDefinitions()]
        });
        const context = await handle();

        const task = await context.tasks.createTask({
            ...mockTask,
            definitionId: "myCustomTaskNumber1"
        });
        const log = await context.tasks.createLog(task, {
            executionName: task.executionName,
            iteration: 1
        });

        const store = new TaskManagerStore(context, task, log);
        expect(store.getTask()).toEqual(task);

        await store.updateTask(() => {
            return {
                executionName: "a test execution name"
            };
        });
        expect(store.getTask()).toEqual({
            ...task,
            savedOn: expect.stringMatching(/^20/),
            executionName: "a test execution name"
        });
    });
});
