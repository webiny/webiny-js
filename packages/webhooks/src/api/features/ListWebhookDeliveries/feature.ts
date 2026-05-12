import { createFeature } from "@webiny/feature/api";
import ListWebhookDeliveriesUseCaseImpl from "./ListWebhookDeliveriesUseCase.js";
import ListWebhookDeliveriesRepositoryImpl from "./ListWebhookDeliveriesRepository.js";

export const ListWebhookDeliveriesFeature = createFeature({
    name: "ListWebhookDeliveries",
    register(container) {
        container.register(ListWebhookDeliveriesUseCaseImpl);
        container.register(ListWebhookDeliveriesRepositoryImpl).inSingletonScope();
    }
});
