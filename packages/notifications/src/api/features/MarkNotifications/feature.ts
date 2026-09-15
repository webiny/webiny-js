import { createFeature } from "@webiny/feature/api";
import { MarkNotificationReadUseCase } from "./MarkNotificationReadUseCase.js";
import { MarkAllNotificationsReadUseCase } from "./MarkAllNotificationsReadUseCase.js";

export const MarkNotificationsFeature = createFeature({
    name: "Notifications/MarkNotifications",
    register(container) {
        container.register(MarkNotificationReadUseCase);
        container.register(MarkAllNotificationsReadUseCase);
    }
});
