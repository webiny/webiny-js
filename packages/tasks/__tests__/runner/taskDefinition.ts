import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import { createContextPlugin } from "@webiny/api";

export const TASK_ID = "taskRunnerTask";

class TestingRunTask implements TaskDefinition.Interface {
    id = TASK_ID;
    title = "Task Runner Task";
    maxIterations = 2;
    constructor(private controller: TaskController.Interface) {}

    async run({ input }: TaskDefinition.RunParams) {
        if (this.controller.runtime.isAborted()) {
            return this.controller.response.aborted();
        } else if (this.controller.runtime.isCloseToTimeout()) {
            return this.controller.response.continue({
                ...input,
                continuing: true
            });
        }
        return this.controller.response.done("Task is done!", {
            myCustomOutput: "yes!"
        });
    }
}

export const TestTaskDefinition = TaskDefinition.createImplementation({
    implementation: TestingRunTask,
    dependencies: [TaskController]
});

export const testDefinitionPlugin = createContextPlugin(context => {
    context.container.register(TestTaskDefinition);
});
