import { createFeature } from "@webiny/feature/admin";
import { ListScheduledActionsGateway } from "./ListScheduledActionsGateway.js";

export const ListScheduledActionsFeature = createFeature({
    name: "Scheduler/ListScheduledActions",
    register(container) {
        container.register(ListScheduledActionsGateway).inSingletonScope();
    }
});
