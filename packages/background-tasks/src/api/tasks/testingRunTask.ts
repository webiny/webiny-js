import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";

class TestingRunTaskHandler implements TaskHandler.Interface {
    async run({ controller }: TaskHandler.RunParams) {
        return controller.response.done("Task successfully finished.");
    }
}

export const TestingRunTaskHandlerImplementation = TaskHandler.createImplementation({
    implementation: TestingRunTaskHandler,
    dependencies: []
});

class TestingRunTask implements TaskDefinition.Interface {
    id = "testingRun";
    title = "Test Step Function Permissions";
    description = "A task to test the step function permissions.";
    handler = TestingRunTaskHandlerImplementation;
}

export const TestingRunTaskDefinition = TaskDefinition.createImplementation({
    implementation: TestingRunTask,
    dependencies: []
});
