import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { BackgroundTasksFeature, TaskService, TasksCrud } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { ElasticsearchTasksFeature } from "~/index";
import type { Context } from "~/types";

type Params = Omit<CmsTestHandlerParams, "plugins" | "features">;

export const useHandler = <C extends Context = Context>(params: Params = {}) => {
    const inner = createCmsTestHandler({
        ...params,
        features: container => {
            // Background tasks were registered globally by the retired useContextHandler; keep them
            // (rawHandle resolves the TasksCrud aggregate below) with the mock transport.
            BackgroundTasksFeature.register(container);
            ElasticsearchTasksFeature.register(container);
            container.registerInstance(TaskService, createMockTaskService());
        }
    });

    return {
        identity: inner.identity,
        tenant: inner.tenant,
        elasticsearch: createTestOpenSearchClient(),
        // DI-native source for the legacy `context.tasks` service-locator: resolve the CRUD
        // aggregate from the container and expose it on the captured context. See the "full-DI
        // tasks" cleanup note to retire this bridge.
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
