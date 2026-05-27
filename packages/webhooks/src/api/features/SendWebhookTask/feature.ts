import { createFeature } from "@webiny/feature/api";
import { SendWebhookTask } from "./SendWebhookTask.js";

export const SendWebhookTaskFeature = createFeature({
    name: "SendWebhookTask",
    register(container) {
        container.register(SendWebhookTask);
    }
});
