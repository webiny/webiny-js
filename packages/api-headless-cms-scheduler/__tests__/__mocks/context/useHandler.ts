import { useContextHandler } from "@webiny/testing";
import type { UseContextHandlerParams } from "@webiny/testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { CmsSchedulerFeature } from "~/CmsSchedulerFeature.js";
import { SchedulerFeature, SchedulerService } from "@webiny/api-scheduler";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";

type Params = Omit<UseContextHandlerParams, "features">;

export const useHandler = <C extends CmsContext = CmsContext>(params: Params = {}) => {
    const inner = useContextHandler<C>({
        ...params,
        features: container => {
            SchedulerFeature.register(container);
            CmsSchedulerFeature.register(container);
            container.registerInstance(SchedulerService, new VoidSchedulerService());
        }
    });

    return {
        identity: inner.identity,
        tenant: inner.tenant,
        elasticsearch: createTestOpenSearchClient(),
        handler: inner.context
    };
};
