import { createFeature } from "@webiny/feature/api";
import { GetWebhookDeliveryUseCase } from "./GetWebhookDeliveryUseCase.js";
import { GetWebhookDeliveryRepository } from "./GetWebhookDeliveryRepository.js";

export const GetWebhookDeliveryFeature = createFeature({
    name: "GetWebhookDelivery",
    register(container) {
        container.register(GetWebhookDeliveryUseCase);
        container.register(GetWebhookDeliveryRepository).inSingletonScope();
    }
});
