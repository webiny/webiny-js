import { createFeature } from "@webiny/feature/api";
import { MailNotificationTransport } from "./MailNotificationTransport.js";

export const NotificationTransportFeature = createFeature({
    name: "WorkflowNotifications/NotificationTransport",
    register(container) {
        container.register(MailNotificationTransport);
    }
});
