import { useContextHandler } from "@webiny/testing";
import type { UseContextHandlerParams } from "@webiny/testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { TasksCrud } from "@webiny/background-tasks/api";
import { ElasticsearchTasksFeature } from "~/index";
import type { Context } from "~/types";

type Params = Omit<UseContextHandlerParams, "plugins" | "features">;

export const useHandler = <C extends Context = Context>(params: Params = {}) => {
    const inner = useContextHandler<C>({
        ...params,
        features: container => {
            ElasticsearchTasksFeature.register(container);
        }
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
