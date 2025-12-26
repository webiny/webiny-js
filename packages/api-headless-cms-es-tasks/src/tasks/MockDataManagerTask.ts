import type { Context } from "~/types.js";
import type {
    IMockDataManagerInput,
    IMockDataManagerOutput
} from "~/tasks/MockDataManager/types.js";
import { CARS_MODEL_ID } from "~/tasks/MockDataManager/constants.js";
import { enableIndexing } from "~/utils/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";

export const MOCK_DATA_MANAGER_TASK_ID = "mockDataManager";

class MockDataManagerTask
    implements TaskDefinition.Interface<IMockDataManagerInput, IMockDataManagerOutput>
{
    id = MOCK_DATA_MANAGER_TASK_ID;
    title = "Mock Data Manager";
    maxIterations = 500;
    private readonly context: Context;

    constructor(context: CmsContext.Interface) {
        this.context = context as Context;
    }

    async run(params: TaskDefinition.RunParams<IMockDataManagerInput, IMockDataManagerOutput>) {
        const { MockDataManager } = await import(
            /* webpackChunkName: "MockDataManager" */ "./MockDataManager/MockDataManager.js"
        );

        const carsMock = new MockDataManager<IMockDataManagerInput, IMockDataManagerOutput>(
            this.context as Context
        );

        try {
            return await carsMock.execute({
                ...params,
                input: {
                    ...params.input,
                    modelId: CARS_MODEL_ID
                }
            });
        } catch (ex) {
            return params.controller.response.error(ex);
        }
    }
    async onError() {
        await enableIndexing({
            client: this.context.elasticsearch,
            model: {
                modelId: CARS_MODEL_ID,
                tenant: "root"
            }
        });
    }

    async onAbort() {
        await enableIndexing({
            client: this.context.elasticsearch,
            model: {
                modelId: CARS_MODEL_ID,
                tenant: "root"
            }
        });
    }
}

export const MockDataManagerTaskDefinition = TaskDefinition.createImplementation({
    implementation: MockDataManagerTask,
    dependencies: [CmsContext]
});
