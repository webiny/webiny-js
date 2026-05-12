import { createFeature } from "@webiny/feature/api";
import WebhookSignPayloadImpl from "./WebhookSignPayloadImpl.js";

export const WebhookSignPayloadFeature = createFeature({
    name: "WebhookSignPayload",
    register(container) {
        container.register(WebhookSignPayloadImpl).inSingletonScope();
    }
});
