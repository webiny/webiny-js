import type { StorageCmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { Context } from "~/types.js";
import type {
    IMockDataManagerInput,
    IMockDataManagerOutput
} from "~/tasks/MockDataManager/types.js";
import { CARS_MODEL_ID } from "~/tasks/MockDataManager/constants.js";
import { enableIndexing } from "~/utils/index.js";
import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";
import { CmsModelOpenSearchIndexProvider } from "@webiny/api-headless-cms-utils-os/exports/api/cms/opensearch.js";
import { MockDataManager } from "./MockDataManager/MockDataManager.js";

export const MOCK_DATA_MANAGER_TASK_ID = "mockDataManager";

class MockDataManagerTaskHandlerImpl implements TaskHandler.Interface<
    IMockDataManagerInput,
    IMockDataManagerOutput
> {
    constructor(
        private readonly context: CmsContext.Interface,
        private readonly openSearchClient: OpenSearchClient.Interface,
        private readonly indexProvider: CmsModelOpenSearchIndexProvider.Interface
    ) {}

    async run(params: TaskHandler.RunParams<IMockDataManagerInput, IMockDataManagerOutput>) {
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
    async onError() {
        await enableIndexing({
            client: this.openSearchClient.use(),
            model: {
                modelId: CARS_MODEL_ID,
                tenant: "root"
            } as StorageCmsModel,
            indexProvider: this.indexProvider
        });
    }

    async onAbort() {
        await enableIndexing({
            client: this.openSearchClient.use(),
            model: {
                modelId: CARS_MODEL_ID,
                tenant: "root"
            } as StorageCmsModel,
            indexProvider: this.indexProvider
        });
    }
}

const MockDataManagerTaskHandler = TaskHandler.createImplementation({
    implementation: MockDataManagerTaskHandlerImpl,
    dependencies: [CmsContext, OpenSearchClient, CmsModelOpenSearchIndexProvider]
});

class MockDataManagerTask implements TaskDefinition.Interface {
    id = MOCK_DATA_MANAGER_TASK_ID;
    title = "Mock Data Manager";
    maxIterations = 500;

    selfCleanup = "always" as const;

    handler = MockDataManagerTaskHandler;
}

export const MockDataManagerTaskDefinition = TaskDefinition.createImplementation({
    implementation: MockDataManagerTask,
    dependencies: []
});
