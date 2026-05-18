import { createFeature } from "@webiny/feature/admin";
import { UpdateWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateWebhookUseCase } from "./UpdateWebhookUseCase.js";
import { UpdateWebhookGateway } from "./UpdateWebhookGateway.js";

export const UpdateWebhookFeature = createFeature({
    name: "Webhooks/UpdateWebhook",
    register(container) {
        container.register(UpdateWebhookUseCase);
        container.register(UpdateWebhookGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
