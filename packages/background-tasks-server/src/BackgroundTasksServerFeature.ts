import { createFeature } from "@webiny/feature/api";
import { WorkerService } from "~/service/WorkerTaskService.js";

export const BackgroundTasksServerFeature = createFeature({
    name: "BackgroundTasksServer",
    register(container) {
        container.register(WorkerService);
    }
});
