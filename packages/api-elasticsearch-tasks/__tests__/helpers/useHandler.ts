import { useContextHandler } from "@webiny/testing";
import type { UseContextHandlerParams } from "@webiny/testing";
import {
    createTestOpenSearchClient,
    registerOpenSearchCoreForTests
} from "@webiny/api-opensearch/testing";
import { createElasticsearchBackgroundTasks } from "~/index";
import type { Context } from "~/types";

type Params = Omit<UseContextHandlerParams, "plugins">;

export const useHandler = <C extends Context = Context>(params: Params = {}) => {
    const inner = useContextHandler<C>({
        ...params,
        plugins: [
            registerOpenSearchCoreForTests(),
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
