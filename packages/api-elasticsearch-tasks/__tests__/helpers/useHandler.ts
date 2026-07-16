import { useContextHandler } from "@webiny/testing";
import type { UseContextHandlerParams } from "@webiny/testing";
import { getTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { OpenSearchClientFeature } from "@webiny/api-opensearch/features/OpenSearchClient/feature.js";
import { TimerFeature } from "@webiny/utils/features/Timer/feature.js";
import { ProcessEnvFeature } from "@webiny/stdlib/node";
import { timerFactory } from "@webiny/utils/features/Timer/factory.js";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { BackgroundTasksFeature, TaskService, TasksCrud } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { timerFactory } from "@webiny/handler-aws/utils";
import { TasksCrud } from "@webiny/background-tasks/api";
import { ElasticsearchTasksFeature } from "~/index";
import type { Context } from "~/types";
import { DbRegistryFeature } from "@webiny/db/features/DbRegistry/feature.js";
import { DbRegistry } from "@webiny/db/exports/api/db.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createOpenSearchTable, createOpenSearchEntity } from "@webiny/api-opensearch";

type Params = Omit<CmsTestHandlerParams, "plugins" | "features">;

const documentClient = getDocumentClient();
const esTable = createOpenSearchTable({ documentClient });
const esEntity = createOpenSearchEntity({ entityName: "CmsEntriesElasticsearch", table: esTable });

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
            DbRegistryFeature.register(container);
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
