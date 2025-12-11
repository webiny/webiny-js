import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

class TestingRunTask implements TaskDefinition.Interface {
    id = "testingRun";
    title = "A mock task to test run the step function permissions.";

    async run({  controller }: TaskDefinition.RunParams) {
        return controller.response.done("Task successfully finished.");
    }
}

export const TestingRunTaskDefinition = TaskDefinition.createImplementation({
    implementation: TestingRunTask,
    dependencies: []
});
