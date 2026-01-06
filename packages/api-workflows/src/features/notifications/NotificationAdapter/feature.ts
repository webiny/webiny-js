import { createFeature } from "@webiny/feature/api";
import { MailNotificationAdapter } from "./MailNotificationAdapter.js";

export const NotificationAdapterFeature = createFeature({
    name: "WorkflowNotifications/NotificationAdapter",
    register(container) {
        container.register(MailNotificationAdapter);
    }
});
