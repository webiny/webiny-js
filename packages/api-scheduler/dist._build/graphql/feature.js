import { createFeature } from "@webiny/feature/api";
import { SchedulerGraphQLFactory } from "./SchedulerGraphQLFactory.js";
const SchedulerGraphQLFactoryFeature = createFeature({
    name: "SchedulerGraphQLFactory",
    register (container) {
        container.register(SchedulerGraphQLFactory);
    }
});
export { SchedulerGraphQLFactoryFeature };

//# sourceMappingURL=feature.js.map