import { createFeature } from "@webiny/feature/admin";
import { GetScheduledActionGateway } from "./GetScheduledActionGateway.js";

export const GetScheduledActionFeature = createFeature({
    name: "Scheduler/GetScheduledAction",
    register(container) {
        container.register(GetScheduledActionGateway).inSingletonScope();
    }
});
