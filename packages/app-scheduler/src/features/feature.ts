import { createFeature } from "@webiny/feature/admin";
import { ListScheduledActionsFeature } from "./listScheduledActions/feature.js";
import { GetScheduledActionFeature } from "./getScheduledAction/feature.js";
import { SchedulePublishActionFeature } from "./schedulePublishAction/feature.js";
import { ScheduleUnpublishActionFeature } from "./scheduleUnpublishAction/feature.js";
import { CancelScheduledActionFeature } from "./cancelScheduledAction/feature.js";

export const SchedulerFeature = createFeature({
    name: "Scheduler",
    register(container) {
        ListScheduledActionsFeature.register(container);
        GetScheduledActionFeature.register(container);
        SchedulePublishActionFeature.register(container);
        ScheduleUnpublishActionFeature.register(container);
        CancelScheduledActionFeature.register(container);
    }
});
