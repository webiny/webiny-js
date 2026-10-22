import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { DynamoDBCoreFeature } from "@webiny/db-dynamodb";
import { getDocumentClient } from "@webiny/db-dynamodb/testing/getDocumentClient.js";
import { BackgroundTasksFeature, TaskService } from "@webiny/background-tasks/api";
import { createMockTaskService } from "@webiny/background-tasks/testing/index.js";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { Context } from "~/types";
import { HeadlessCmsEsTasksFeature } from "~/index.js";
import { CmsModelOpenSearchIndexFeature } from "@webiny/api-headless-cms-utils-os/features/CmsModelOpenSearchIndex/feature.js";

type Params = Omit<CmsTestHandlerParams, "setup"> & { plugins?: any };

export const useHandler = <C extends Context = Context>(params: Params = {}) => {
    const { plugins, ...rest } = params;

    const { getContext } = createCmsTestHandler({
        ...rest,
        setup: container => {
            DynamoDBCoreFeature.register(container, {
                documentClient: getDocumentClient()
            });

            // Background tasks + es-tasks are DI-native. Register the features, then override
            // TaskService with a mock transport for triggering.
            BackgroundTasksFeature.register(container);
            CmsModelOpenSearchIndexFeature.register(container);
            HeadlessCmsEsTasksFeature.register(container);
            container.registerInstance(TaskService, createMockTaskService());

            // DI-native plugins are plain `container => {}` functions; call them directly.
            for (const plugin of [plugins].flat(Infinity as 1).filter(Boolean)) {
                (plugin as (container: any) => void)(container);
            }
        }
    });

    return {
        identity: { id: "id-12345678", type: "admin", displayName: "John Doe" },
        tenant: { id: "root" },
        elasticsearch: createTestOpenSearchClient(),
        handler: () => getContext<C>()
    };
};
