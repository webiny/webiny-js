import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { registerSchedulerExtension } from "./context.js";

export type { ISchedulerFeatureConfig } from "./SchedulerFeature.types.js";

export const SchedulerFeature = createFeature({
    name: "Scheduler",
    register(container: Container) {
        registerLegacyPluginsViaGqlContextEnhancer(container, [...registerSchedulerExtension()]);
    }
});
