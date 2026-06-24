import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextualSchema } from "@webiny/handler-graphql";
import { createHeadlessCmsScheduleContext } from "./context.js";

export const CmsSchedulerFeature = createFeature({
    name: "CmsScheduler",
    register(container: Container) {
        registerLegacyPluginsViaGqlContextualSchema(container, [
            createHeadlessCmsScheduleContext()
        ]);
    }
});
