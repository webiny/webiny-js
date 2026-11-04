import { createFeature } from "@webiny/feature/api";
import { WorkflowApprovedNotificationHandler } from "./WorkflowApprovedNotificationHandler.js";
import { WorkflowRejectedNotificationHandler } from "./WorkflowRejectedNotificationHandler.js";

export const WorkflowNotificationsFeature = createFeature({
    name: "NotificationsIntegrations/Workflows",
    register(container) {
        container.register(WorkflowApprovedNotificationHandler);
        container.register(WorkflowRejectedNotificationHandler);
    }
});
