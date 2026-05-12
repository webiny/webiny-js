import { createFeature } from "@webiny/feature/api";
import CreateWebhookDeliveryRepositoryImpl from "./CreateWebhookDeliveryRepository.js";

export const CreateWebhookDeliveryFeature = createFeature({
    name: "CreateWebhookDelivery",
    register(container) {
        container.register(CreateWebhookDeliveryRepositoryImpl).inSingletonScope();
    }
});
