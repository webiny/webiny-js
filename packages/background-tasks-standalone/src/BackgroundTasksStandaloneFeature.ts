import { createFeature } from "@webiny/feature/api";
import { BackgroundTaskEventType } from "@webiny/event-handler-core";
import { DispatchingTaskLoop } from "~/loop/DispatchingTaskLoop.js";
import { InProcessTaskService } from "~/service/InProcessTaskService.js";
import { InProcessBackgroundTaskHandler } from "~/handlers/InProcessBackgroundTaskHandler.js";

/**
 * Background tasks for the standalone server. Register at the root container: the loop is one
 * long-lived object for the whole process, and it needs the root's `EventDispatcher`.
 */
export const BackgroundTasksStandaloneFeature = createFeature({
    name: "BackgroundTasksServer",
    register(container) {
        container.register(BackgroundTaskEventType);
        container.register(InProcessBackgroundTaskHandler);
        container.register(DispatchingTaskLoop).inSingletonScope();
        container.register(InProcessTaskService);
    }
});
