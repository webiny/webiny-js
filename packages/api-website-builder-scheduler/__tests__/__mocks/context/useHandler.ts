import { useContextHandler } from "@webiny/testing";
import type { UseContextHandlerParams } from "@webiny/testing";
import { createTestOpenSearchClient } from "@webiny/api-opensearch/testing";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import { WebsiteBuilderSchedulerFeature } from "~/WebsiteBuilderSchedulerFeature.js";
import { SchedulerFeature, SchedulerService } from "@webiny/api-scheduler";
import { VoidSchedulerService } from "@webiny/api-scheduler/features/SchedulerService/VoidSchedulerService.js";
import { PageModelPlugin } from "@webiny/api-website-builder/domain/page/page.model.js";
import { RedirectModelPlugin } from "@webiny/api-website-builder/domain/redirect/redirect.model.js";
import { createWebsiteBuilder } from "@webiny/api-website-builder";
import { createMockBackgroundTasks } from "../mockBackgroundTasks.js";

type Params = Omit<UseContextHandlerParams, "features">;

export const useHandler = <C extends ApiCoreContext = ApiCoreContext>(params: Params = {}) => {
    const inner = useContextHandler<C>({
        ...params,
        plugins: [
            createWebsiteBuilder(),
            createMockBackgroundTasks(),
            ...[params.plugins].flat(Infinity as 1).filter(Boolean)
        ],
        features: container => {
            container.register(PageModelPlugin);
            container.register(RedirectModelPlugin);
            SchedulerFeature.register(container);
            WebsiteBuilderSchedulerFeature.register(container);
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
