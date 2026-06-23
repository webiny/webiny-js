import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { registerSchedulerExtension } from "./context.js";
import { SchedulePrivateModel } from "./domain/SchedulePrivateModel.js";

export type { ISchedulerFeatureConfig } from "./SchedulerFeature.types.js";

export const SchedulerFeature = createFeature({
    name: "Scheduler",
    register(container: Container) {
        // Register at registration time so ModelCache is populated with wbySchedule when
        // first accessed during enhance() — registering only inside extensionPlugin arrives too late.
        container.register(SchedulePrivateModel);
        registerLegacyPluginsViaGqlContextEnhancer(container, [...registerSchedulerExtension()]);
    }
});
