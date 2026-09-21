import { createFeature } from "@webiny/feature/api";
import { TaskHandlerResolver } from "./TaskHandlerResolver.js";

/**
 * Must be registered on the per-request container, which is what `registerApiRequestStack` does via
 * `BackgroundTasksFeature`. The resolver depends on `RequestContainer`; registered on the root it
 * would capture the root container and never see per-request registrations.
 */
export const TaskHandlerResolverFeature = createFeature({
    name: "TaskHandlerResolver",
    register(container) {
        container.register(TaskHandlerResolver);
    }
});
