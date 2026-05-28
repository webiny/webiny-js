import { createFeature } from "@webiny/feature/api";
import { WebhookTransformer } from "./WebhookTransformer.js";
import { WebhookDeliveryTransformer } from "./WebhookDeliveryTransformer.js";

export const WebhooksTransformerFeature = createFeature({
    name: "Webhooks/Transformer",
    register(container) {
        container.register(WebhookTransformer).inSingletonScope();
        container.register(WebhookDeliveryTransformer).inSingletonScope();
    }
});
