import { createFeature } from "@webiny/feature/api";
import { ListNotificationsUseCase } from "./ListNotificationsUseCase.js";

export const ListNotificationsFeature = createFeature({
    name: "Notifications/ListNotifications",
    register(container) {
        container.register(ListNotificationsUseCase);
    }
});
