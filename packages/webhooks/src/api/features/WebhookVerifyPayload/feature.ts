import { createFeature } from "@webiny/feature/api";
import WebhookVerifyPayloadImpl from "./WebhookVerifyPayloadImpl.js";

export const WebhookVerifyPayloadFeature = createFeature({
    name: "WebhookVerifyPayload",
    register(container) {
        container.register(WebhookVerifyPayloadImpl).inSingletonScope();
    }
});
