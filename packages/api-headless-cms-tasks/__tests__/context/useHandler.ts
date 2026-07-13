import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { DbFeature } from "@webiny/handler-db";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
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
            // cms-tasks resolves the DI DbInstance (key-value store). The shared cms-ddb storage
            // preset only sets the legacy ctx.db via dbPlugins, so register DbFeature here.
            DbFeature.register(container, {
                documentClient: getDocumentClient(),
                table: process.env.DB_TABLE
            });
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
