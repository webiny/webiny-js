import { createFeature } from "@webiny/feature/api";
import { WebhookDeliver } from "./WebhookDeliver.js";

export const WebhookDeliverFeature = createFeature({
    name: "Webhooks/WebhookDeliver",
    register(container) {
        container.register(WebhookDeliver).inSingletonScope();
    }
});
