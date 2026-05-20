import { createFeature } from "@webiny/feature/api";
import { UpdateWebhookDeliveryRepository } from "./UpdateWebhookDeliveryRepository.js";

export const UpdateWebhookDeliveryFeature = createFeature({
    name: "UpdateWebhookDelivery",
    register(container) {
        container.register(UpdateWebhookDeliveryRepository).inSingletonScope();
    }
});
