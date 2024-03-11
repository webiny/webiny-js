import { TaskRunner } from "~/runner";
import { createMockEvent } from "~tests/mocks";
import { ResponseErrorResult } from "~/response";
import { createLiveContextFactory } from "~tests/live";
import { taskDefinition } from "~tests/runner/taskDefinition";

describe("task runner task not found", () => {
    const contextFactory = createLiveContextFactory({
        plugins: [taskDefinition]
    });

    it("should trigger a task run - error because task is not found", async () => {
        const context = await contextFactory();

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
});
