import { describe, it, expect } from "vitest";
import { TaskRunner } from "~/runner";
import { createMockEvent } from "~tests/mocks";
import { ResponseErrorResult } from "~/response";
import { TaskDataStatus } from "~/types";
import { createLiveContextFactory } from "~tests/live";
import { testDefinitionPlugin, TASK_ID } from "~tests/runner/taskDefinition";
import { timerFactory } from "@webiny/handler-aws/utils";
import { TaskEventValidation } from "~/runner/TaskEventValidation";

describe("task runner error in success state", () => {
    const contextFactory = createLiveContextFactory({
        plugins: [testDefinitionPlugin]
    });

    it("should trigger a task run - error because task is already in success state", async () => {
        const context = await contextFactory();

        const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());

        const task = await context.tasks.createTask({
            definitionId: TASK_ID,
            input: {},
            name: "My task name"
        });
        const updatedTask = await context.tasks.updateTask(task.id, {
            taskStatus: TaskDataStatus.SUCCESS
        });

        const result = await runner.run(
            createMockEvent({
                webinyTaskId: updatedTask.id,
                webinyTaskDefinitionId: TASK_ID
            })
        );
        expect(result).toBeInstanceOf(ResponseErrorResult);
        expect(result).toEqual({
            status: "error",
            webinyTaskId: updatedTask.id,
            webinyTaskDefinitionId: TASK_ID,
            tenant: "root",
            error: {
                message: "Task is already done, cannot run it again."
            }
        });
    });
});
