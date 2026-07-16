import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { BackgroundTasksFeature, TaskService, TasksCrud } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { timerFactory } from "@webiny/handler-aws/utils";
import { TasksCrud } from "@webiny/background-tasks/api";
import { ElasticsearchTasksFeature } from "~/index";
import type { Context } from "~/types";

type Params = Omit<CmsTestHandlerParams, "plugins" | "features">;

export const useHandler = <C extends Context = Context>(params: Params = {}) => {
    const inner = createCmsTestHandler({
    const opensearchClient = getTestOpenSearchClient();

    const inner = useContextHandler<C>({
        ...params,
        features: container => {
            // Background tasks were registered globally by the retired useContextHandler; keep them
            // (rawHandle resolves the TasksCrud aggregate below) with the mock transport.
            BackgroundTasksFeature.register(container);
            ProcessEnvFeature.register(container);
            OpenSearchClientFeature.register(container, opensearchClient);
            TimerFeature.register(container, timerFactory());
            ElasticsearchTasksFeature.register(container);
            container.registerInstance(TaskService, createMockTaskService());
        }
    });

    return {
        identity: inner.identity,
        tenant: inner.tenant,
        elasticsearch: opensearchClient,
        rawHandle: async () => {
            const ctx = await inner.getContext<C>();
            const [tasksCrud] = ctx.container.resolveAll(TasksCrud);
            if (tasksCrud) {
                ctx.tasks = tasksCrud;
            }
            return ctx;
        }
    };
};
