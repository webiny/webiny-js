import { createFeature } from "@webiny/feature/api";
import { CreateNotificationRepository } from "./CreateNotificationRepository.js";
import { CreateNotificationUseCase } from "./CreateNotificationUseCase.js";

export const CreateNotificationFeature = createFeature({
    name: "Notifications/CreateNotification",
    register(container) {
        container.register(CreateNotificationRepository).inSingletonScope();
        container.register(CreateNotificationUseCase);
    }
});
