import { TaskRunner } from "~/runner";
import { createMockEvent } from "~tests/mocks";
import { ResponseAbortedResult } from "~/response";
import { createLiveContextFactory } from "~tests/live";
import { taskDefinition } from "~tests/runner/taskDefinition";

describe("task runner abort", () => {
    const contextFactory = createLiveContextFactory({
        plugins: [taskDefinition]
    });

    it("should trigger a task run - end with aborted state", async () => {
        const context = await contextFactory();

        const runner = new TaskRunner(
            {
                getRemainingTimeInMillis: () => {
                    return 5 * 60 * 1000;
                }
            },
            context
        );

        const task = await context.tasks.createTask({
            definitionId: taskDefinition.id,
            input: {},
            name: "My task name"
        });
        const abortedTask = await context.tasks.abort({
            id: task.id,
            message: "Testing the Abort functionality."
        });
        const result = await runner.run(
            createMockEvent({
                webinyTaskId: abortedTask.id,
                webinyTaskDefinitionId: taskDefinition.id
            })
        );
        expect(result).toBeInstanceOf(ResponseAbortedResult);
        expect(result).toEqual({
            status: "aborted",
            webinyTaskId: abortedTask.id,
            webinyTaskDefinitionId: taskDefinition.id,
            tenant: "root",
            locale: "en-US"
        });
    });
});
