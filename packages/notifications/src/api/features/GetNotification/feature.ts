import { createFeature } from "@webiny/feature/api";
import { GetNotificationRepository } from "./GetNotificationRepository.js";
import { GetNotificationUseCase } from "./GetNotificationUseCase.js";

export const GetNotificationFeature = createFeature({
    name: "Notifications/GetNotification",
    register(container) {
        container.register(GetNotificationRepository).inSingletonScope();
        container.register(GetNotificationUseCase);
    }
});
