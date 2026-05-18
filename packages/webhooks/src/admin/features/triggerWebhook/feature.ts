import { createFeature } from "@webiny/feature/admin";
import { TriggerWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TriggerWebhookUseCase } from "./TriggerWebhookUseCase.js";
import { TriggerWebhookGateway } from "./TriggerWebhookGateway.js";

export const TriggerWebhookFeature = createFeature({
    name: "Webhooks/TriggerWebhook",
    register(container) {
        container.register(TriggerWebhookUseCase);
        container.register(TriggerWebhookGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
