import { createFeature } from "@webiny/feature/api";
import { TaskHandlerResolver } from "./TaskHandlerResolver.js";

export const TaskHandlerResolverFeature = createFeature({
    name: "TaskHandlerResolver",
    register(container) {
        container.register(TaskHandlerResolver);
    }
});
