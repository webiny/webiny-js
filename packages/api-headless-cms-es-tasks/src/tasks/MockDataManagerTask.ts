import type { Context } from "~/types.js";
import type {
    IMockDataManagerInput,
    IMockDataManagerOutput
} from "~/tasks/MockDataManager/types.js";
import { CARS_MODEL_ID } from "~/tasks/MockDataManager/constants.js";
import { enableIndexing } from "~/utils/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsModelOpenSearchIndexProvider } from "@webiny/api-headless-cms-ddb-es/features/CmsModelOpenSearchIndex/index.js";
import { MockDataManager } from "./MockDataManager/MockDataManager.js";

export const MOCK_DATA_MANAGER_TASK_ID = "mockDataManager";

class MockDataManagerTask implements TaskDefinition.Interface<
    IMockDataManagerInput,
    IMockDataManagerOutput
> {
    id = MOCK_DATA_MANAGER_TASK_ID;
    title = "Mock Data Manager";
    maxIterations = 500;

    selfCleanup = "always" as const;

    constructor(
        private readonly context: CmsContext.Interface,
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly indexProvider: CmsModelOpenSearchIndexProvider.Interface
    ) {}

    async run(params: TaskDefinition.RunParams<IMockDataManagerInput, IMockDataManagerOutput>) {
        const carsMock = new MockDataManager<IMockDataManagerInput, IMockDataManagerOutput>(
            this.context as Context,
            this.openSearchClient,
            this.indexProvider
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
                client: this.openSearchClient.use(),
                model,
                indexProvider: this.indexProvider
            });
        }
    }

    async onAbort() {
        const model = await this.findModel();
        if (model) {
            await enableIndexing({
                client: this.openSearchClient.use(),
                model,
                indexProvider: this.indexProvider
            });
        }
    }
}

export const MockDataManagerTaskDefinition = TaskDefinition.createImplementation({
    implementation: MockDataManagerTask,
    dependencies: [CmsContext, OpenSearchClient, CmsModelOpenSearchIndexProvider]
});
