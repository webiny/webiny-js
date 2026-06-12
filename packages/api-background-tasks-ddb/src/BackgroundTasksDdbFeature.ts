import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { BackgroundTasksFeature } from "@webiny/background-tasks/api";

export const BackgroundTasksDdbFeature = createFeature({
    name: "BackgroundTasksDdb",
    register(container: Container) {
        BackgroundTasksFeature.register(container);
    }
});
