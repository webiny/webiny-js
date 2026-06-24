import { useContextHandler } from "@webiny/testing";
import type { UseContextHandlerParams } from "@webiny/testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import type { HcmsTasksContext } from "~/types";
import { HcmsTasksFeature } from "~/HcmsTasksFeature.js";

type Params = Omit<UseContextHandlerParams, "features">;

export const useHandler = <C extends HcmsTasksContext = HcmsTasksContext>(params: Params = {}) => {
    const inner = useContextHandler<C>({
        ...params,
        features: container => HcmsTasksFeature.register(container)
    });

    return {
        identity: inner.identity,
        tenant: inner.tenant,
        elasticsearch: createTestOpenSearchClient(),
        handler: inner.context
    };
};
