import { createFeature } from "@webiny/feature/admin";
import { ResendWebhookDeliveryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ResendWebhookDeliveryUseCase } from "./ResendWebhookDeliveryUseCase.js";
import { ResendWebhookDeliveryGateway } from "./ResendWebhookDeliveryGateway.js";

export const ResendWebhookDeliveryFeature = createFeature({
    name: "Webhooks/ResendWebhookDelivery",
    register(container) {
        container.register(ResendWebhookDeliveryUseCase);
        container.register(ResendWebhookDeliveryGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
