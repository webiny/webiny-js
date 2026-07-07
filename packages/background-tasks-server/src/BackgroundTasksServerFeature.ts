import { createFeature } from "@webiny/feature/api";
import { WorkerService } from "~/service/WorkerTaskService.js";
import { BackgroundTaskRoute } from "~/routes/BackgroundTaskRoute.js";

export const BackgroundTasksServerFeature = createFeature({
    name: "BackgroundTasksServer",
    register(container) {
        container.register(WorkerService);
        container.register(BackgroundTaskRoute);
    }
});
