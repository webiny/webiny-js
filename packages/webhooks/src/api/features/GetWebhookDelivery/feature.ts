import { createFeature } from "@webiny/feature/api";
import GetWebhookDeliveryUseCaseImpl from "./GetWebhookDeliveryUseCase.js";
import GetWebhookDeliveryRepositoryImpl from "./GetWebhookDeliveryRepository.js";

export const GetWebhookDeliveryFeature = createFeature({
    name: "GetWebhookDelivery",
    register(container) {
        container.register(GetWebhookDeliveryUseCaseImpl);
        container.register(GetWebhookDeliveryRepositoryImpl).inSingletonScope();
    }
});
