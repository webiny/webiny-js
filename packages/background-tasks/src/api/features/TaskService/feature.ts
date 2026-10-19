import { createFeature } from "@webiny/feature/api";
import { BackgroundTaskService } from "./BackgroundTaskService.js";

export const BackgroundTaskServiceFeature = createFeature({
    name: "BackgroundTaskService",
    register(container) {
        container.register(BackgroundTaskService);
    }
});
