import { createFeature } from "@webiny/feature/api";
import { BackgroundTaskInputType } from "@webiny/kernel-core";
import { InProcessBackgroundTasksLoop } from "~/loop/InProcessBackgroundTasksLoop.js";
import { InProcessTaskService } from "~/service/InProcessTaskService.js";
import { InProcessBackgroundTaskHandler } from "~/handlers/InProcessBackgroundTaskHandler.js";
import { KeyValueTaskClaim } from "~/claim/KeyValueTaskClaim.js";
import { KeyValueTaskRecoveries } from "~/claim/KeyValueTaskRecoveries.js";
import { TaskRecoverInputType } from "~/recovery/TaskRecoverInputType.js";
import { RecoverTasksHandler } from "~/recovery/RecoverTasksHandler.js";
import { ProcessShutdownSignal } from "~/shutdown/ProcessShutdownSignal.js";

/**
 * Background tasks for the standalone server. Register at the root container: the loop is one
 * long-lived object for the whole process, and it needs the root's `InputDispatcher`.
 */
export const BackgroundTasksStandaloneFeature = createFeature({
    name: "BackgroundTasksServer",
    register(container) {
        container.register(BackgroundTaskInputType);
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

        container.register(TaskRecoverInputType);
        container.register(RecoverTasksHandler);
    }
});
