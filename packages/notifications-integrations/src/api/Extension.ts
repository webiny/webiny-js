import { createFeature } from "@webiny/feature/api";
import { CollaborationNotificationsFeature } from "./collaboration/feature.js";
import { WorkflowNotificationsFeature } from "./workflows/feature.js";

export const Extension = createFeature({
    name: "NotificationsIntegrations",
    register(container) {
        CollaborationNotificationsFeature.register(container);
        WorkflowNotificationsFeature.register(container);
    }
});
