import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { OpenSearchClientFeature } from "@webiny/api-opensearch/features/OpenSearchClient/feature.js";
import { BackgroundTasksFeature, TaskService, TasksCrud } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { TimerFeature } from "@webiny/utils/features/Timer/feature.js";
import { timerFactory } from "@webiny/utils/features/Timer/factory.js";
import { ProcessEnvFeature } from "@webiny/stdlib/node";
import { ElasticsearchTasksFeature } from "~/index";
import { DbRegistry } from "@webiny/db/exports/api/db.js";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { createOpenSearchTable, createOpenSearchEntity } from "@webiny/api-opensearch";
import type { Context } from "~/types";

type Params = Omit<CmsTestHandlerParams, "legacyPlugins" | "setup">;

const documentClient = getDocumentClient();
const esTable = createOpenSearchTable({ documentClient });
const esEntity = createOpenSearchEntity({ entityName: "CmsEntriesElasticsearch", table: esTable });

export const useHandler = <C extends Context = Context>(params: Params = {}) => {
    const opensearchClient = createTestOpenSearchClient();

    const inner = createCmsTestHandler({
        ...params,
        setup: container => {
            ProcessEnvFeature.register(container);
            OpenSearchClientFeature.register(container, opensearchClient);
            TimerFeature.register(container, timerFactory());
            BackgroundTasksFeature.register(container);
            ElasticsearchTasksFeature.register(container);
            container.registerInstance(TaskService, createMockTaskService());
        }
    });

    return {
        identity: inner.identity,
        tenant: inner.tenant,
        elasticsearch: opensearchClient,
        // DI-native source for the legacy `context.tasks` service-locator: resolve the CRUD
        // aggregate from the container and expose it on the captured context. See the "full-DI
        // tasks" cleanup note to retire this bridge.
        rawHandle: async () => {
            const ctx = await inner.getContext<C>();

            const dbRegistry = ctx.container.resolve(DbRegistry);
            if (!dbRegistry.getItem(i => i.app === "cms" && i.tags.includes("es"))) {
                dbRegistry.register({
                    item: esEntity,
                    app: "cms",
                    tags: ["es", esEntity.name]
                });
            }

            const [tasksCrud] = ctx.container.resolveAll(TasksCrud);
            if (tasksCrud) {
                ctx.tasks = tasksCrud;
            }
            return ctx;
        }
    };
};
