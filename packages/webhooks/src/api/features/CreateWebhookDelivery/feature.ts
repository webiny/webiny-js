import { createFeature } from "@webiny/feature/api";
import { CreateWebhookDeliveryRepository } from "./CreateWebhookDeliveryRepository.js";

export const CreateWebhookDeliveryFeature = createFeature({
    name: "CreateWebhookDelivery",
    register(container) {
        container.register(CreateWebhookDeliveryRepository).inSingletonScope();
    }
});
