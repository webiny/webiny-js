import { createFeature } from "@webiny/feature/api";
import { ListWebhookDeliveriesUseCase } from "./ListWebhookDeliveriesUseCase.js";
import { ListWebhookDeliveriesRepository } from "./ListWebhookDeliveriesRepository.js";

export const ListWebhookDeliveriesFeature = createFeature({
    name: "ListWebhookDeliveries",
    register(container) {
        container.register(ListWebhookDeliveriesUseCase);
        container.register(ListWebhookDeliveriesRepository).inSingletonScope();
    }
});
