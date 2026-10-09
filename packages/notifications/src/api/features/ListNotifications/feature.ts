import { createFeature } from "@webiny/feature/api";
import { ListNotificationsRepository } from "./ListNotificationsRepository.js";
import { ListNotificationsUseCase } from "./ListNotificationsUseCase.js";

export const ListNotificationsFeature = createFeature({
    name: "Notifications/ListNotifications",
    register(container) {
        container.register(ListNotificationsRepository).inSingletonScope();
        container.register(ListNotificationsUseCase);
    }
});
