import { createFeature } from "@webiny/feature/api";
import { ListNotificationsUseCase } from "./ListNotificationsUseCase.js";
import { ListNotificationsRepository } from "./ListNotificationsRepository.js";

export const ListNotificationsFeature = createFeature({
    name: "WorkflowNotifications/ListNotifications",
    register(container) {
        container.register(ListNotificationsRepository).inSingletonScope();
        container.register(ListNotificationsUseCase);
    }
});
