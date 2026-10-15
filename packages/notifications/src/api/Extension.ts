import { createFeature } from "@webiny/feature/api";
import { NotificationModel } from "./domain/notification/notificationModel.js";
import { NotificationMapper } from "./domain/notification/NotificationMapper.js";
import { GetNotificationFeature } from "./features/GetNotification/feature.js";
import { UpdateNotificationFeature } from "./features/UpdateNotification/feature.js";
import { CreateNotificationFeature } from "./features/CreateNotification/feature.js";
import { ListNotificationsFeature } from "./features/ListNotifications/feature.js";
import { NotificationCountsFeature } from "./features/NotificationCounts/feature.js";
import { MarkNotificationsFeature } from "./features/MarkNotifications/feature.js";
import { ArchiveNotificationsFeature } from "./features/ArchiveNotifications/feature.js";
import { NotificationsSchema } from "./graphql/notifications.js";

export const Extension = createFeature({
    name: "Notifications",
    register(container) {
        container.register(NotificationModel);
        container.register(NotificationMapper);

        // Features
        GetNotificationFeature.register(container);
        UpdateNotificationFeature.register(container);
        CreateNotificationFeature.register(container);
        ListNotificationsFeature.register(container);
        NotificationCountsFeature.register(container);
        MarkNotificationsFeature.register(container);
        ArchiveNotificationsFeature.register(container);

        // GraphQL
        container.register(NotificationsSchema);
    }
});
