import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskController } from "@webiny/api-core/features/task/TaskController/index.js";
import type { Container } from "@webiny/di";

export const TASK_ID = "taskRunnerTask";

class TestingRunTaskHandler implements TaskHandler.Interface {
    constructor(private controller: TaskController.Interface) {}

    async run({ input }: TaskHandler.RunParams) {
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

export const TestTaskHandler = TaskHandler.createImplementation({
    implementation: TestingRunTaskHandler,
    dependencies: [TaskController]
});

class TestingRunTask implements TaskDefinition.Interface {
    id = TASK_ID;
    title = "Task Runner Task";
    maxIterations = 2;
    databaseLogs = true;
    handler = TestTaskHandler;
}

export const TestTaskDefinition = TaskDefinition.createImplementation({
    implementation: TestingRunTask,
    dependencies: []
});

export const testDefinitionPlugin = (container: Container) => {
    container.register(TestTaskDefinition);
};
