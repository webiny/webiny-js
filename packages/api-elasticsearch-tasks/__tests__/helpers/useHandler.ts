import { useContextHandler } from "@webiny/testing";
import type { UseContextHandlerParams } from "@webiny/testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { createBackgroundTaskContext, TasksCrud } from "@webiny/background-tasks/api";
import { createElasticsearchBackgroundTasks } from "~/index";
import type { Context } from "~/types";

type Params = Omit<UseContextHandlerParams, "plugins">;

export const useHandler = <C extends Context = Context>(params: Params = {}) => {
    const inner = useContextHandler<C>({
        ...params,
        // OpenSearch core is already registered by useContextHandler's cmsStorage (DDB-OS preset);
        // registering it again here throws "OpenSearch core must not be loaded more than once".
        plugins: [
            ...createBackgroundTaskContext(),
            createElasticsearchBackgroundTasks(),
            ...[params.plugins].flat(Infinity as 1).filter(Boolean)
        ]
    });

    return {
        identity: inner.identity,
        tenant: inner.tenant,
        elasticsearch: createTestOpenSearchClient(),
        // DI-native source for the legacy `context.tasks` service-locator: resolve the CRUD
        // aggregate from the container and expose it on the captured context. See the "full-DI
        // tasks" cleanup note to retire this bridge.
        rawHandle: async (input?: Parameters<typeof inner.context>[0]) => {
            const ctx = await inner.context(input);
            const [tasksCrud] = ctx.container.resolveAll(TasksCrud);
            if (tasksCrud) {
                ctx.tasks = tasksCrud;
            }
            return ctx;
        }
    };
};
