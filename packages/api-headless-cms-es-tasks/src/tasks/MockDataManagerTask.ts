import type { Context } from "~/types.js";
import type {
    IMockDataManagerInput,
    IMockDataManagerOutput
} from "~/tasks/MockDataManager/types.js";
import { CARS_MODEL_ID } from "~/tasks/MockDataManager/constants.js";
import { enableIndexing } from "~/utils/index.js";
import { CmsModelOpenSearchIndex } from "@webiny/api-headless-cms-ddb-es/exports/api/cms/opensearch.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";

export const MOCK_DATA_MANAGER_TASK_ID = "mockDataManager";

class MockDataManagerTask implements TaskDefinition.Interface<
    IMockDataManagerInput,
    IMockDataManagerOutput
> {
    id = MOCK_DATA_MANAGER_TASK_ID;
    title = "Mock Data Manager";
    maxIterations = 500;

    selfCleanup = "always" as const;

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

    private async findModel() {
        return (await this.context.cms.listModels()).find(m => m.modelId === CARS_MODEL_ID);
    }

    async onError() {
        const model = await this.findModel();
        if (model) {
            await enableIndexing({
                client: this.context.opensearch,
                model,
                indexConfig: this.context.container.resolve(CmsModelOpenSearchIndex)
            });
        }
    }

    async onAbort() {
        const model = await this.findModel();
        if (model) {
            await enableIndexing({
                client: this.context.opensearch,
                model,
                indexConfig: this.context.container.resolve(CmsModelOpenSearchIndex)
            });
        }
    }
}

export const MockDataManagerTaskDefinition = TaskDefinition.createImplementation({
    implementation: MockDataManagerTask,
    dependencies: [CmsContext]
});
