import { type Container, createFeature } from "@webiny/feature/api";
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";

export const BackgroundTasksDdbFeature = createFeature({
    name: "BackgroundTasksDdb",
    register(container: Container) {
        BackgroundTasksFeature.register(container);
    }
});
