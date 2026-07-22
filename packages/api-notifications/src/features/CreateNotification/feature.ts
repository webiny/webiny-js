import { createFeature } from "@webiny/feature/api";
import { CreateNotificationUseCase } from "./CreateNotificationUseCase.js";

export const CreateNotificationFeature = createFeature({
    name: "Notifications/CreateNotification",
    register(container) {
        container.register(CreateNotificationUseCase);
    }
});
