import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import { createCmsTestHandler } from "@webiny/api-headless-cms-testing";
import type { CmsTestHandlerParams } from "@webiny/api-headless-cms-testing";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { WebsiteBuilderSchedulerFeature } from "~/WebsiteBuilderSchedulerFeature.js";
import { SchedulerFeature, SchedulerService } from "@webiny/api-scheduler";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import { WebsiteBuilderFeature } from "@webiny/api-website-builder";
import { registerMockBackgroundTasks } from "../mockBackgroundTasks.js";

type Params = Omit<CmsTestHandlerParams, "features">;

export const useHandler = <C extends ApiCoreContext = ApiCoreContext>(params: Params = {}) => {
    const { getContext } = createCmsTestHandler({
        ...params,
        plugins: [...[params.plugins].flat(Infinity as 1).filter(Boolean)],
        features: container => {
            registerMockBackgroundTasks(container);
            WebsiteBuilderFeature.register(container);
            SchedulerFeature.register(container);
            WebsiteBuilderSchedulerFeature.register(container);
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
