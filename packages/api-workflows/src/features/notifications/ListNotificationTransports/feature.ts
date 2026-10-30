import { createFeature } from "@webiny/feature/api";
import { ListNotificationTransportsUseCase } from "./ListNotificationTransportsUseCase.js";
import { ListNotificationTransportsRepository } from "./ListNotificationTransportsRepository.js";

export const ListNotificationTransportsFeature = createFeature({
    name: "WorkflowNotifications/ListNotificationTransports",
    register(container) {
        container.register(ListNotificationTransportsRepository).inSingletonScope();
        container.register(ListNotificationTransportsUseCase);
    }
});
