import { describe, it, expect } from "vitest";
import { TaskRunner } from "~/api/runner";
import { createMockEvent } from "~tests/mocks";
import { ResponseAbortedResult } from "~/api/response";
import { createLiveContextFactory } from "~tests/live";
import { testDefinitionPlugin, TASK_ID } from "~tests/runner/taskDefinition";
import { timerFactory } from "@webiny/handler-aws/utils";
import { TaskEventValidation } from "~/api/runner/TaskEventValidation";

describe("task runner abort", () => {
    const contextFactory = createLiveContextFactory({
        plugins: [testDefinitionPlugin]
    });

    it("should trigger a task run - end with aborted state", async () => {
        const context = await contextFactory();

        const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());

        const task = await context.tasks.createTask({
            definitionId: TASK_ID,
            input: {},
            name: "My task name"
        });
        const abortResult = await context.tasks.abort({
            id: task.id,
            message: "Testing the Abort functionality."
        });

        const abortedTask = abortResult.value;

        const result = await runner.run(
            createMockEvent({
                webinyTaskId: abortedTask.id,
                webinyTaskDefinitionId: TASK_ID
            })
        );
        expect(result).toBeInstanceOf(ResponseAbortedResult);
        expect(result).toEqual({
            status: "aborted",
            webinyTaskId: abortedTask.id,
            webinyTaskDefinitionId: TASK_ID,
            tenant: "root"
        });
    });
});
