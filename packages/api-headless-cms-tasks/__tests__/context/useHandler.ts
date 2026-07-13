import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { HcmsTasksContext } from "~/types";
import { HcmsTasksFeature } from "~/HcmsTasksFeature.js";

type Params = Omit<CmsTestHandlerParams, "features">;

const identity = {
    id: "id-12345678",
    type: "admin",
    displayName: "John Doe"
};

const tenant = { id: "root" };

export const useHandler = <C extends HcmsTasksContext = HcmsTasksContext>(params: Params = {}) => {
    const { getContext } = createCmsTestHandler({
        identity,
        ...params,
        features: container => {
            // The delete-model store is backed by the api-core key-value store, which the shared
            // cms-ddb preset already registers — no extra storage wiring needed here.
            HcmsTasksFeature.register(container);

            // Background tasks are DI-native (TriggerTaskUseCase etc.); a mock trigger transport (DI)
            // keeps the task from actually dispatching to AWS during tests.
            BackgroundTasksFeature.register(container);
            container.registerInstance(TaskService, createMockTaskService());
        }
    });

    return {
        identity,
        tenant,
        elasticsearch: createTestOpenSearchClient(),
        handler: () => getContext<C>()
    };
};
