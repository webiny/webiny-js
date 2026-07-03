import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { DbFeature } from "@webiny/handler-db";
import { getDocumentClient } from "@webiny/project-utils/testing/dynamodb/index.js";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import {
    createBackgroundTaskContext,
    createBackgroundTaskGraphQL,
    TaskServiceTransport,
    TasksCrud
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

            // Background tasks (context.tasks, TriggerTaskUseCase) + a mock transport (DI), then the
            // es-tasks task definitions and any test-supplied plugins.
            registerLegacyPluginsViaGqlContextualSchema(container, [
                createBackgroundTaskContext(),
                ...createBackgroundTaskGraphQL(),
                createHeadlessCmsEsTasks(),
                ...[plugins].flat(Infinity as 1).filter(Boolean)
            ]);
            container.registerInstance(TaskServiceTransport, createMockTaskServicePlugin()[0]);
        }
    });

    return {
        identity: { id: "id-12345678", type: "admin", displayName: "John Doe" },
        tenant: { id: "root" },
        elasticsearch: createTestOpenSearchClient(),
        // DI-native source for the legacy `context.tasks` service-locator: resolve the CRUD
        // aggregate from the container and expose it on the captured context. See the "full-DI
        // tasks" cleanup note to retire this bridge.
        handler: async () => {
            const ctx = await getContext<C>();
            const [tasksCrud] = (ctx as any).container.resolveAll(TasksCrud);
            if (tasksCrud) {
                (ctx as any).tasks = tasksCrud;
            }
            return ctx;
        }
    };
};
