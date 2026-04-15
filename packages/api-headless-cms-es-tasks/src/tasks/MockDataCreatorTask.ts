import type { Context } from "~/types.js";
import type {
    IMockDataCreatorInput,
    IMockDataCreatorOutput
} from "~/tasks/MockDataCreator/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";

export const MOCK_DATA_CREATOR_TASK_ID = "mockDataCreator";

class MockDataCreatorTask
    implements TaskDefinition.Interface<IMockDataCreatorInput, IMockDataCreatorOutput>
{
    id = MOCK_DATA_CREATOR_TASK_ID;
    title = "Mock Data Creator";
    maxIterations = 500;

    constructor(private context: CmsContext.Interface) {}

    async run(params: TaskDefinition.RunParams<IMockDataCreatorInput, IMockDataCreatorOutput>) {
        const { MockDataCreator } = await import(
            /* webpackChunkName: "MockDataCreator" */ "./MockDataCreator/MockDataCreator.js"
        );

        const carsMock = new MockDataCreator<IMockDataCreatorInput, IMockDataCreatorOutput>(
            this.context as Context
        );

        try {
            return await carsMock.execute(params);
        } catch (ex) {
            return params.controller.response.error(ex);
        }
    }
}

export const MockDataCreatorTaskDefinition = TaskDefinition.createImplementation({
    implementation: MockDataCreatorTask,
    dependencies: [CmsContext]
});
