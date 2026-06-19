import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { createWebsiteBuilderScheduleContext } from "./context.js";

export const WebsiteBuilderSchedulerFeature = createFeature({
    name: "WebsiteBuilderScheduler",
    register(container: Container) {
        registerLegacyPluginsViaGqlContextEnhancer(container, [
            createWebsiteBuilderScheduleContext()
        ]);
    }
});
