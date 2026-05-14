import { createFeature } from "@webiny/feature/api";
import { CmsEntryToWebhookTransformer } from "./CmsEntryToWebhookTransformer.js";
import { CmsEntryToWebhookDeliveryTransformer } from "./CmsEntryToWebhookDeliveryTransformer.js";

export const WebhooksTransformerFeature = createFeature({
    name: "Webhooks/Transformer",
    register(container) {
        container.register(CmsEntryToWebhookTransformer).inSingletonScope();
        container.register(CmsEntryToWebhookDeliveryTransformer).inSingletonScope();
    }
});
