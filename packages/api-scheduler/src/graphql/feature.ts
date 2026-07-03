import { createFeature } from "@webiny/feature/api";
import { SchedulerGraphQLFactory } from "./SchedulerGraphQLFactory.js";

export const SchedulerGraphQLFactoryFeature = createFeature({
    name: "SchedulerGraphQLFactory",
    register(container) {
        container.register(SchedulerGraphQLFactory);
    }
});
