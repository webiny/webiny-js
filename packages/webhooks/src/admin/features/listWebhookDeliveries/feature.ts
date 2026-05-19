import { createFeature } from "@webiny/feature/admin";
import { ListWebhookDeliveriesUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListWebhookDeliveriesUseCase } from "./ListWebhookDeliveriesUseCase.js";
import { ListWebhookDeliveriesGateway } from "./ListWebhookDeliveriesGateway.js";

export const ListWebhookDeliveriesFeature = createFeature({
    name: "Webhooks/ListWebhookDeliveries",
    register(container) {
        container.register(ListWebhookDeliveriesUseCase);
        container.register(ListWebhookDeliveriesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
