import { createFeature } from "@webiny/feature/api";
import { WebhookSignPayload } from "./WebhookSignPayload.js";

export const WebhookSignPayloadFeature = createFeature({
    name: "WebhookSignPayload",
    register(container) {
        container.register(WebhookSignPayload).inSingletonScope();
    }
});
