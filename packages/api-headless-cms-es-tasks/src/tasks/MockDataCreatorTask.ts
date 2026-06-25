import type { Context } from "~/types.js";
import type {
    IMockDataCreatorInput,
    IMockDataCreatorOutput
} from "~/tasks/MockDataCreator/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { CmsContext } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { MockDataCreator } from "./MockDataCreator/MockDataCreator.js";
import { OpenSearchClient } from "@webiny/api-opensearch/exports/api/opensearch.js";

export const MOCK_DATA_CREATOR_TASK_ID = "mockDataCreator";

class MockDataCreatorTask implements TaskDefinition.Interface<
    IMockDataCreatorInput,
    IMockDataCreatorOutput
> {
    id = MOCK_DATA_CREATOR_TASK_ID;
    title = "Mock Data Creator";
    maxIterations = 500;

    selfCleanup = "always" as const;

    constructor(
        private readonly context: CmsContext.Interface,
        private readonly openSearchClient: OpenSearchClient.Interface
    ) {}

    async run(params: TaskDefinition.RunParams<IMockDataCreatorInput, IMockDataCreatorOutput>) {
        const carsMock = new MockDataCreator<IMockDataCreatorInput, IMockDataCreatorOutput>(
            this.context as Context,
            this.openSearchClient
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
    dependencies: [CmsContext, OpenSearchClient]
});
