import { createFeature } from "@webiny/feature/api";
import { BackgroundTaskEventType } from "@webiny/event-handler-core";
import { InProcessBackgroundTasksLoop } from "~/loop/InProcessBackgroundTasksLoop.js";
import { InProcessTaskService } from "~/service/InProcessTaskService.js";
import { InProcessBackgroundTaskHandler } from "~/handlers/InProcessBackgroundTaskHandler.js";
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
        container.register(InProcessBackgroundTasksLoop).inSingletonScope();
        container.register(InProcessTaskService);

        /*
         * One shutdown signal for the life of the process, shared by every request. The claims also
         * need the process's `ProcessOwner`, which the server registers once for every feature.
         */
        container.register(ProcessShutdownSignal).inSingletonScope();
        container.register(KeyValueTaskClaim);
        container.register(KeyValueTaskRecoveries);

        container.register(TaskRecoverEventType);
        container.register(RecoverTasksHandler);
    }
});
