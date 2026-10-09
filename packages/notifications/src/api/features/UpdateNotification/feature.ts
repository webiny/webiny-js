import { createFeature } from "@webiny/feature/api";
import { UpdateNotificationRepository } from "./UpdateNotificationRepository.js";
import { UpdateNotificationUseCase } from "./UpdateNotificationUseCase.js";

export const UpdateNotificationFeature = createFeature({
    name: "Notifications/UpdateNotification",
    register(container) {
        container.register(UpdateNotificationRepository).inSingletonScope();
        container.register(UpdateNotificationUseCase);
    }
});
