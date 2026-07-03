import { createFeature } from "@webiny/feature/admin";
import { ScheduleUnpublishActionGateway } from "./ScheduleUnpublishActionGateway.js";

export const ScheduleUnpublishActionFeature = createFeature({
    name: "Scheduler/ScheduleUnpublishAction",
    register(container) {
        container.register(ScheduleUnpublishActionGateway).inSingletonScope();
    }
});
