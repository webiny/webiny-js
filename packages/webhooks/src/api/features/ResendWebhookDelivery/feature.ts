import { createFeature } from "@webiny/feature/api";
import ResendWebhookDeliveryUseCaseImpl from "./ResendWebhookDeliveryUseCase.js";

export const ResendWebhookDeliveryFeature = createFeature({
    name: "ResendWebhookDelivery",
    register(container) {
        container.register(ResendWebhookDeliveryUseCaseImpl);
    }
});
