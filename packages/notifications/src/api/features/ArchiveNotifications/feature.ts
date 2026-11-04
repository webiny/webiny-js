import { createFeature } from "@webiny/feature/api";
import { ArchiveNotificationUseCase } from "./ArchiveNotificationUseCase.js";
import { UnarchiveNotificationUseCase } from "./UnarchiveNotificationUseCase.js";

export const ArchiveNotificationsFeature = createFeature({
    name: "Notifications/ArchiveNotifications",
    register(container) {
        container.register(ArchiveNotificationUseCase);
        container.register(UnarchiveNotificationUseCase);
    }
});
