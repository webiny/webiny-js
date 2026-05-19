import { createFeature } from "@webiny/feature/api";
import { WebhookVerifyPayload } from "./WebhookVerifyPayload.js";

export const WebhookVerifyPayloadFeature = createFeature({
    name: "WebhookVerifyPayload",
    register(container) {
        container.register(WebhookVerifyPayload).inSingletonScope();
    }
});
