import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { createCmsTestHandler } from "@webiny/api-headless-cms/testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms/testing";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { CmsSchedulerFeature } from "~/CmsSchedulerFeature.js";
import { SchedulerFeature, SchedulerService } from "@webiny/api-scheduler";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";

type Params = Omit<CmsTestHandlerParams, "features">;

export const useHandler = <C extends CmsContext = CmsContext>(params: Params = {}) => {
    const { getContext } = createCmsTestHandler({
        ...params,
        features: container => {
            SchedulerFeature.register(container);
            CmsSchedulerFeature.register(container);
            container.registerInstance(SchedulerService, new VoidSchedulerService());
        }
    });

    return {
        identity: { id: "id-12345678", type: "admin", displayName: "John Doe" },
        tenant: { id: "root" },
        elasticsearch: createTestOpenSearchClient(),
        handler: () => getContext<C>()
    };
};
