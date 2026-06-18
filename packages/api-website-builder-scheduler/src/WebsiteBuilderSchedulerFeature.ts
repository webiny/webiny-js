import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPlugins } from "@webiny/handler-graphql";
import { createWebsiteBuilderScheduleContext } from "./context.js";

export const WebsiteBuilderSchedulerFeature = createFeature({
    name: "WebsiteBuilderScheduler",
    register(container: Container) {
        registerLegacyPlugins(container, [createWebsiteBuilderScheduleContext()]);
    }
});
