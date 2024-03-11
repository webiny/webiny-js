import { TaskRunner } from "~/runner";
import { createLiveContextFactory } from "~tests/live";
import { taskDefinition } from "~tests/runner/taskDefinition";

describe("task runner create", () => {
    const contextFactory = createLiveContextFactory({
        plugins: [taskDefinition]
    });

    it("should create a task runner", async () => {
        const context = await contextFactory();

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
});
