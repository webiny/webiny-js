import { useContextHandler } from "@webiny/testing";
import type { UseContextHandlerParams } from "@webiny/testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { createBackgroundTaskContext } from "@webiny/background-tasks/api";
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
        rawHandle: inner.context
    };
};
