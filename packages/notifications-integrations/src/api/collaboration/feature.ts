import { createFeature } from "@webiny/feature/api";
import { ThreadCreatedNotificationHandler } from "./ThreadCreatedNotificationHandler.js";
import { ReplyAddedNotificationHandler } from "./ReplyAddedNotificationHandler.js";

export const CollaborationNotificationsFeature = createFeature({
    name: "NotificationsIntegrations/Collaboration",
    register(container) {
        container.register(ThreadCreatedNotificationHandler);
        container.register(ReplyAddedNotificationHandler);
    }
});
