import { createFeature } from "@webiny/feature/api";
import { TaskExecutionContext } from "./TaskExecutionContext.js";

export const TaskExecutionContextFeature = createFeature({
    name: "TaskExecutionContext",
    register(container) {
        container.register(TaskExecutionContext).inSingletonScope();
    }
});
