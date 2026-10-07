import { type Container, createFeature } from "@webiny/feature/api";
import { SchedulePrivateModel } from "./domain/SchedulePrivateModel.js";
import { SchedulerPermissionsResolver } from "~/features/permissions/SchedulerPermissionsResolver.js";
import { SchedulerGraphQLFactoryFeature } from "~/graphql/feature.js";
import { NamespaceHandlerExecutionerFeature } from "~/features/NamespaceHandler/feature.js";
import { ScheduledActionModelProvider } from "~/features/ScheduledActionModelProvider.js";
import { SchedulerFeature as SchedulerCoreFeature } from "~/features/SchedulerFeature.js";

export const SchedulerFeature = createFeature({
    name: "Scheduler",
    register(container: Container) {
        container.register(SchedulePrivateModel);
        container.register(SchedulerPermissionsResolver);
        SchedulerGraphQLFactoryFeature.register(container);
        NamespaceHandlerExecutionerFeature.register(container);
        SchedulerCoreFeature.register(container);
        container.register(ScheduledActionModelProvider);
    }
});
