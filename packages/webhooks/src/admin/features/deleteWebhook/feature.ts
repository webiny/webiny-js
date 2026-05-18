import { createFeature } from "@webiny/feature/admin";
import { DeleteWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeleteWebhookUseCase } from "./DeleteWebhookUseCase.js";
import { DeleteWebhookGateway } from "./DeleteWebhookGateway.js";

export const DeleteWebhookFeature = createFeature({
    name: "Webhooks/DeleteWebhook",
    register(container) {
        container.register(DeleteWebhookUseCase);
        container.register(DeleteWebhookGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
