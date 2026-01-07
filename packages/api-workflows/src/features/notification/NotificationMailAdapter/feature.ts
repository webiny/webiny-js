import { createFeature } from "@webiny/feature/api";
import { NotificationMailAdapter } from "./NotificationMailAdapter.js";

export const NotificationMailAdapterFeature = createFeature({
    name: "WorkflowNotifications/NotificationMailAdapter",
    register(container) {
        container.register(NotificationMailAdapter);
    }
});
