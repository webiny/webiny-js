import { type Container, createFeature } from "@webiny/feature/api";
import { SchedulePrivateModel } from "./domain/SchedulePrivateModel.js";
import { SchedulerPermissionsFeature } from "~/features/permissions/feature.js";
import { SchedulerGraphQLFactoryFeature } from "~/graphql/feature.js";
import { NamespaceHandlerExecutionerFeature } from "~/features/NamespaceHandler/feature.js";
import { SchedulerModelContextualSchema } from "./SchedulerModelContextualSchema.js";
import { SchedulerFeature as SchedulerCoreFeature } from "~/features/SchedulerFeature.js";

export type { ISchedulerFeatureConfig } from "./SchedulerFeature.types.js";

export const SchedulerFeature = createFeature({
    name: "Scheduler",
    register(container: Container) {
        container.register(SchedulePrivateModel);
        SchedulerPermissionsFeature.register(container);
        SchedulerGraphQLFactoryFeature.register(container);
        NamespaceHandlerExecutionerFeature.register(container);
        SchedulerCoreFeature.register(container);
        container.register(SchedulerModelContextualSchema);
    }
});
