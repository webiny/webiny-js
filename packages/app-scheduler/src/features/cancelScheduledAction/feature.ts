import { createFeature } from "@webiny/feature/admin";
import { CancelScheduledActionGateway } from "./CancelScheduledActionGateway.js";

export const CancelScheduledActionFeature = createFeature({
    name: "Scheduler/CancelScheduledAction",
    register(container) {
        container.register(CancelScheduledActionGateway).inSingletonScope();
    }
});
