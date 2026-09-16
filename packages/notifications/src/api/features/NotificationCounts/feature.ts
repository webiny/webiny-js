import { createFeature } from "@webiny/feature/api";
import { CountNotificationsRepository } from "./CountNotificationsRepository.js";
import { NotificationCountsUseCase } from "./NotificationCountsUseCase.js";

export const NotificationCountsFeature = createFeature({
    name: "Notifications/NotificationCounts",
    register(container) {
        container.register(CountNotificationsRepository).inSingletonScope();
        container.register(NotificationCountsUseCase);
    }
});
