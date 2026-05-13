import { createFeature } from "@webiny/feature/api";
import UpdateWebhookDeliveryRepositoryImpl from "./UpdateWebhookDeliveryRepository.js";

export const UpdateWebhookDeliveryFeature = createFeature({
    name: "UpdateWebhookDelivery",
    register(container) {
        container.register(UpdateWebhookDeliveryRepositoryImpl).inSingletonScope();
    }
});
