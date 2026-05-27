import { createFeature } from "@webiny/feature/api";
import { ResendWebhookDeliveryUseCase } from "./ResendWebhookDeliveryUseCase.js";

export const ResendWebhookDeliveryFeature = createFeature({
    name: "ResendWebhookDelivery",
    register(container) {
        container.register(ResendWebhookDeliveryUseCase);
    }
});
