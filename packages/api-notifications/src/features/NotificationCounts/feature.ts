import { createFeature } from "@webiny/feature/api";
import { NotificationCountsUseCase } from "./NotificationCountsUseCase.js";

export const NotificationCountsFeature = createFeature({
    name: "Notifications/NotificationCounts",
    register(container) {
        container.register(NotificationCountsUseCase);
    }
});
