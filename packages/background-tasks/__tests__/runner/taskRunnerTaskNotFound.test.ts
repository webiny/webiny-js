import { describe, it, expect } from "vitest";
import { TaskRunner } from "~/api/runner";
import { createMockEvent } from "~tests/mocks";
import { ResponseErrorResult } from "~/api/response";
import { createLiveContextFactory } from "~tests/live";
import { testDefinitionPlugin } from "~tests/runner/taskDefinition";
import { timerFactory } from "@webiny/handler-aws/utils";
import { TaskEventValidation } from "~/api/runner/TaskEventValidation";

describe("task runner task not found", () => {
    const contextFactory = createLiveContextFactory({
        plugins: [testDefinitionPlugin]
    });

    it("should trigger a task run - error because task is not found", async () => {
        const context = await contextFactory();

        const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());

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
            error: {
                message: 'Task "unknownTaskId" cannot be executed because it does not exist.',
                code: "TASK_NOT_FOUND"
            }
        });
    });
});
