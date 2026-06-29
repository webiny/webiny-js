import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { DbFeature } from "@webiny/handler-db";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import {
    createBackgroundTaskContext,
    createBackgroundTaskGraphQL
} from "@webiny/background-tasks/api";
import { createMockTaskServicePlugin } from "@webiny/project-utils/testing/tasks/mockTaskTriggerTransportPlugin.js";
import { createCmsTestHandler } from "@webiny/api-headless-cms/testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms/testing";
import type { Context } from "~/types";
import { createHeadlessCmsEsTasks } from "~/index.js";

type Params = Omit<CmsTestHandlerParams, "features"> & { plugins?: any };

export const useHandler = <C extends Context = Context>(params: Params = {}) => {
    const { plugins, ...rest } = params;

    const { getContext } = createCmsTestHandler({
        ...rest,
        features: container => {
            DbFeature.register(container, {
                documentClient: getDocumentClient(),
                table: process.env.DB_TABLE
            });

            // Background tasks (context.tasks, TriggerTaskUseCase) + a mock transport, then the
            // es-tasks task definitions and any test-supplied plugins.
            registerLegacyPluginsViaGqlContextualSchema(container, [
                createBackgroundTaskContext(),
                ...createBackgroundTaskGraphQL(),
                createMockTaskServicePlugin(),
                createHeadlessCmsEsTasks(),
                ...[plugins].flat(Infinity as 1).filter(Boolean)
            ]);
        }
    });

    return {
        identity: { id: "id-12345678", type: "admin", displayName: "John Doe" },
        tenant: { id: "root" },
        elasticsearch: createTestOpenSearchClient(),
        handler: () => getContext<C>()
    };
};
