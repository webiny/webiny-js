import { TaskRunner } from "~/runner";
import { createMockEvent } from "~tests/mocks";
import { ResponseErrorResult } from "~/response";
import { TaskDataStatus } from "~/types";
import { createLiveContextFactory } from "~tests/live";
import { taskDefinition } from "~tests/runner/taskDefinition";

describe("task runner error in success state", () => {
    const contextFactory = createLiveContextFactory({
        plugins: [taskDefinition]
    });

    it("should trigger a task run - error because task is already in success state", async () => {
        const context = await contextFactory();

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
});
