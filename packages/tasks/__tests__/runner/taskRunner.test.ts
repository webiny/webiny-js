import { TaskRunner } from "~/runner";
import { useHandler } from "~tests/helpers/useHandler";
import { createMockEvent } from "~tests/mocks";
import { ResponseDoneResult, ResponseErrorResult } from "~/response";
import { createTaskDefinition } from "~/task";
import { TaskDataStatus } from "~/types";

const taskDefinition = createTaskDefinition({
    id: "taskRunnerTask",
    title: "Task Runner Task",
    maxIterations: 2,
    run: async ({ response }) => {
        return response.done("Task is done!", {
            myCustomOutput: "yes!"
        });
    }
});

describe("task runner", () => {
    const { handle } = useHandler({
        plugins: [taskDefinition]
    });

    it("should create a task runner", async () => {
        const context = await handle();

        const runner = new TaskRunner(
            {
                getRemainingTimeInMillis: () => {
                    return 100000;
                }
            },
            context
        );
        expect(runner).toBeInstanceOf(TaskRunner);
    });

    it("should trigger a task run - error because task is not found", async () => {
        const context = await handle();

        const runner = new TaskRunner(
            {
                getRemainingTimeInMillis: () => {
                    return 100000;
                }
            },
            context
        );

        const result = await runner.run(
            createMockEvent({
                webinyTaskId: "unknownTaskId"
            })
        );
        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            status: "error",
            webinyTaskId: "unknownTaskId",
            webinyTaskDefinitionId: "myCustomTaskDefinition",
            tenant: "root",
            locale: "en-US",
            error: {
                status: "error",
                webinyTaskId: "unknownTaskId",
                webinyTaskDefinitionId: "myCustomTaskDefinition",
                tenant: "root",
                locale: "en-US",
                error: {
                    message: 'Task "unknownTaskId" cannot be executed because it does not exist.',
                    code: "TASK_NOT_FOUND"
                }
            }
        });
    });

    it("should trigger a task run - error because task is already in success state", async () => {
        const context = await handle();

        const runner = new TaskRunner(
            {
                getRemainingTimeInMillis: () => {
                    return 100000;
                }
            },
            context
        );

        const task = await context.tasks.createTask({
            definitionId: taskDefinition.id,
            input: {},
            name: "My task name"
        });
        const updatedTask = await context.tasks.updateTask(task.id, {
            taskStatus: TaskDataStatus.SUCCESS
        });

        const result = await runner.run(
            createMockEvent({
                webinyTaskId: updatedTask.id,
                webinyTaskDefinitionId: taskDefinition.id
            })
        );
        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            status: "error",
            webinyTaskId: updatedTask.id,
            webinyTaskDefinitionId: taskDefinition.id,
            tenant: "root",
            locale: "en-US",
            error: {
                message: "Task is already done, cannot run it again."
            }
        });
    });

    it("should trigger a task run - error because task is already in failed state", async () => {
        const context = await handle();

        const runner = new TaskRunner(
            {
                getRemainingTimeInMillis: () => {
                    return 100000;
                }
            },
            context
        );

        const task = await context.tasks.createTask({
            definitionId: taskDefinition.id,
            input: {},
            name: "My task name"
        });
        const updatedTask = await context.tasks.updateTask(task.id, {
            taskStatus: TaskDataStatus.FAILED
        });

        const result = await runner.run(
            createMockEvent({
                webinyTaskId: updatedTask.id,
                webinyTaskDefinitionId: taskDefinition.id
            })
        );
        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            status: "error",
            webinyTaskId: updatedTask.id,
            webinyTaskDefinitionId: taskDefinition.id,
            tenant: "root",
            locale: "en-US",
            error: {
                message: "Task has failed, cannot run it again."
            }
        });
    });

    it("should trigger a task run and end it successfully", async () => {
        const context = await handle();

        const runner = new TaskRunner(
            {
                getRemainingTimeInMillis: () => {
                    return 100000;
                }
            },
            context
        );

        const task = await context.tasks.createTask({
            definitionId: taskDefinition.id,
            input: {},
            name: "My task name"
        });

        const result = await runner.run(
            createMockEvent({
                webinyTaskId: task.id,
                webinyTaskDefinitionId: taskDefinition.id
            })
        );

        expect(result).toBeInstanceOf(ResponseDoneResult);
        expect(result).toEqual({
            status: "done",
            webinyTaskId: task.id,
            webinyTaskDefinitionId: taskDefinition.id,
            tenant: "root",
            locale: "en-US",
            message: "Task is done!",
            output: {
                myCustomOutput: "yes!"
            }
        });

        const doneTask = await context.tasks.getTask(task.id);
        expect(doneTask?.taskStatus).toBe(TaskDataStatus.SUCCESS);
        expect(doneTask?.output).toEqual({
            myCustomOutput: "yes!"
        });

        const { items, meta } = await context.tasks.listLogs({
            where: {
                task: task.id
            }
        });
        expect(items).toHaveLength(1);
        expect(items[0].items[1].message).toBe("Task is done!");
        expect(meta.totalCount).toBe(1);
    });
});
