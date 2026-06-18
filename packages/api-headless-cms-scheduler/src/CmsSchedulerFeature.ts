import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { createHeadlessCmsScheduleContext } from "./context.js";

export const CmsSchedulerFeature = createFeature({
    name: "CmsScheduler",
    register(container: Container) {
        registerLegacyPluginsViaGqlContextEnhancer(container, [createHeadlessCmsScheduleContext()]);
    }
});
