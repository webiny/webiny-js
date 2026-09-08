import { createFeature } from "@webiny/feature/api";
import { uuid } from "@webiny/stdlib";
import { WorkerService } from "~/service/WorkerTaskService.js";
import {
    BackgroundTaskRoute,
    BackgroundTaskRouteDefinition
} from "~/routes/BackgroundTaskRoute.js";
import { InternalToken } from "~/domain/InternalToken.js";
import { HttpRouteDefinition } from "@webiny/event-handler-core";

export const BackgroundTasksServerFeature = createFeature({
    name: "BackgroundTasksServer",
    register(container) {
        container.registerInstance(InternalToken, { value: uuid() });
        container.register(WorkerService);
        container.register(BackgroundTaskRoute);
        container.registerInstance(HttpRouteDefinition, BackgroundTaskRouteDefinition);
    }
});
