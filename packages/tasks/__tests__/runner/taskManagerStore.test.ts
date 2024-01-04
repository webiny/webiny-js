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

        const store = new TaskManagerStore(context, task);

        expect(store.getTask()).toEqual(task);
    });

    it("should update task values", async () => {
        const mockTask = createMockTask();

        const { handle } = useHandler({
            plugins: [...createMockTaskDefinitions()]
        });
        const context = await handle();

        const task = await context.tasks.createTask({
            ...mockTask,
            definitionId: "myCustomTaskNumber1"
        });

        const store = new TaskManagerStore(context, task);
        const values = {
            test: "test"
        };
        await store.updateValues({ ...values });
        expect(store.getValues()).toEqual(values);
        expect(store.getTask()).toEqual({
            ...task,
            values: {
                ...task.values,
                ...values
            },
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/)
        });

        await store.updateValues(values => {
            return {
                ...values,
                anotherOne: true
            };
        });
        expect(store.getValues()).toEqual({
            ...values,
            anotherOne: true
        });
        expect(store.getTask()).toEqual({
            ...task,
            values: {
                ...task.values,
                ...values,
                anotherOne: true
            },
            createdOn: expect.stringMatching(/^20/),
            savedOn: expect.stringMatching(/^20/)
        });
    });

    it("should not update values", async () => {
        const mockTask = createMockTask();

        const { handle } = useHandler({
            plugins: [...createMockTaskDefinitions()]
        });
        const context = await handle();

        const task = await context.tasks.createTask({
            ...mockTask,
            definitionId: "myCustomTaskNumber1"
        });
        const store = new TaskManagerStore(context, task);

        await store.updateValues({ ...task.values });
        expect(store.getValues()).toEqual(task.values);

        await store.updateValues({});
        expect(store.getValues()).toEqual(task.values);

        await store.updateValues(values => {
            return values;
        });
        expect(store.getValues()).toEqual(task.values);
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
        const store = new TaskManagerStore(context, task);
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
