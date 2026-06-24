import { useContextHandler } from "@webiny/testing";
import type { UseContextHandlerParams } from "@webiny/testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import type { Context } from "~/types";
import { createHeadlessCmsEsTasks } from "~/index.js";

type Params = Omit<UseContextHandlerParams, "features">;

export const useHandler = <C extends Context = Context>(params: Params = {}) => {
    const inner = useContextHandler<C>({
        ...params,
        plugins: [
            createHeadlessCmsEsTasks(),
            ...[params.plugins].flat(Infinity as 1).filter(Boolean)
        ]
    });

    return {
        identity: inner.identity,
        tenant: inner.tenant,
        elasticsearch: createTestOpenSearchClient(),
        handler: inner.context
    };
};
