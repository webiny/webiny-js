import { createFeature } from "@webiny/feature/api";
import { BackgroundTaskEventType } from "@webiny/event-handler-core";
import { DispatchingTaskLoop } from "~/loop/DispatchingTaskLoop.js";
import { InProcessTaskService } from "~/service/InProcessTaskService.js";
import { InProcessBackgroundTaskHandler } from "~/handlers/InProcessBackgroundTaskHandler.js";
import { RandomProcessOwner } from "~/claim/RandomProcessOwner.js";
import { KeyValueTaskClaim } from "~/claim/KeyValueTaskClaim.js";
import { KeyValueTaskRecoveries } from "~/claim/KeyValueTaskRecoveries.js";
import { TaskRecoverEventType } from "~/recovery/TaskRecoverEventType.js";
import { RecoverTasksHandler } from "~/recovery/RecoverTasksHandler.js";
import { ProcessShutdownSignal } from "~/shutdown/ProcessShutdownSignal.js";

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

        // One owner and one shutdown signal for the life of the process, shared by every request.
        container.register(RandomProcessOwner).inSingletonScope();
        container.register(ProcessShutdownSignal).inSingletonScope();
        container.register(KeyValueTaskClaim);
        container.register(KeyValueTaskRecoveries);

        container.register(TaskRecoverEventType);
        container.register(RecoverTasksHandler);
    }
});
