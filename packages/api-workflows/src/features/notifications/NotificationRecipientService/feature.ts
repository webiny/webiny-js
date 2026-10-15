import { createFeature } from "@webiny/feature/api";
import { NotificationRecipientService } from "./NotificationRecipientService.js";

export const NotificationRecipientServiceFeature = createFeature({
    name: "WorkflowNotifications/NotificationRecipientService",
    register(container) {
        container.register(NotificationRecipientService);
    }
});
