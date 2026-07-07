import { createFeature } from "@webiny/feature/api";
import { uuid } from "@webiny/stdlib";
import { WorkerService } from "~/service/WorkerTaskService.js";
import { BackgroundTaskRoute } from "~/routes/BackgroundTaskRoute.js";
import { InternalToken } from "~/domain/InternalToken.js";

export const BackgroundTasksServerFeature = createFeature({
    name: "BackgroundTasksServer",
    register(container) {
        container.registerInstance(InternalToken, { value: uuid() });
        container.register(WorkerService);
        container.register(BackgroundTaskRoute);
    }
});
