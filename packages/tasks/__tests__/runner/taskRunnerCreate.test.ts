import { TaskRunner } from "~/runner";
import { createLiveContextFactory } from "~tests/live";
import { taskDefinition } from "~tests/runner/taskDefinition";
import { timerFactory } from "~/timer";
import { TaskEventValidation } from "~/runner/TaskEventValidation";

describe("task runner create", () => {
    const contextFactory = createLiveContextFactory({
        plugins: [taskDefinition]
    });

    it("should create a task runner", async () => {
        const context = await contextFactory();

        const runner = new TaskRunner(context, timerFactory(), new TaskEventValidation());
        expect(runner).toBeInstanceOf(TaskRunner);
    });
});
