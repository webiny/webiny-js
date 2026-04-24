import { createFeature } from "@webiny/feature/api";
import { ListNotificationTypesUseCase } from "./ListNotificationTypesUseCase.js";
import { ListNotificationTypesRepository } from "./ListNotificationTypesRepository.js";

export const ListNotificationTypesFeature = createFeature({
    name: "WorkflowNotifications/ListNotificationTypes",
    register(container) {
        container.register(ListNotificationTypesRepository).inSingletonScope();
        container.register(ListNotificationTypesUseCase);
    }
});
