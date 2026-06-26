import { createFeature } from "@webiny/feature/admin";
import { SchedulePublishActionGateway } from "./SchedulePublishActionGateway.js";

export const SchedulePublishActionFeature = createFeature({
    name: "Scheduler/SchedulePublishAction",
    register(container) {
        container.register(SchedulePublishActionGateway).inSingletonScope();
    }
});
