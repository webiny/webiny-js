import { describe, it, expect } from "vitest";
import { TaskRunner } from "~/api/runner";
import { createMockEvent } from "~tests/mocks";
import { ResponseErrorResult } from "~/api/response";
import { TaskDataStatus } from "~/api/types";
import { createLiveContextFactory } from "~tests/live";
import { testDefinitionPlugin, TASK_ID } from "~tests/runner/taskDefinition";
import { timerFactory } from "@webiny/utils/features/Timer/factory.js";
import { TaskEventValidation } from "~/api/runner/TaskEventValidation";
import { CreateTaskUseCase } from "~/api/features/CreateTask/index.js";
import { UpdateTaskUseCase } from "~/api/features/UpdateTask/index.js";

describe("task runner error in failed state", () => {
    const contextFactory = createLiveContextFactory({
        plugins: [testDefinitionPlugin]
    });

    it("should trigger a task run - error because task is already in a failed state", async () => {
        const context = await contextFactory();

        const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());

        const task = (
            await context.container.resolve(CreateTaskUseCase).execute({
                definitionId: TASK_ID,
                input: {},
                name: "My task name"
            })
        ).value;
        const updatedTask = (
            await context.container.resolve(UpdateTaskUseCase).execute(task.id, {
                taskStatus: TaskDataStatus.FAILED
            })
        ).value;

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
                message: "Task has failed, cannot run it again."
            }
        });
    });
});
