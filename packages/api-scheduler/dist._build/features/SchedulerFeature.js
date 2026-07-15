import { createFeature } from "@webiny/feature/api";
import { ScheduleActionFeature } from "./ScheduleAction/feature.js";
import { GetScheduledActionFeature } from "./GetScheduledAction/feature.js";
import { GetTargetScheduledActionFeature } from "./GetTargetScheduledAction/feature.js";
import { ListScheduledActionsFeature } from "./ListScheduledActions/feature.js";
import { CancelScheduledActionFeature } from "./CancelScheduledAction/feature.js";
import { ExecuteScheduledActionFeature } from "./ExecuteScheduledAction/feature.js";
const SchedulerFeature = createFeature({
    name: "Scheduler",
    register (container) {
        ScheduleActionFeature.register(container);
        GetScheduledActionFeature.register(container);
        GetTargetScheduledActionFeature.register(container);
        ListScheduledActionsFeature.register(container);
        CancelScheduledActionFeature.register(container);
        ExecuteScheduledActionFeature.register(container);
    }
});
export { SchedulerFeature };

//# sourceMappingURL=SchedulerFeature.js.map