import { createFeature } from "@webiny/feature/admin";
import { CreateWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { CreateWebhookUseCase } from "./CreateWebhookUseCase.js";
import { CreateWebhookGateway } from "./CreateWebhookGateway.js";

export const CreateWebhookFeature = createFeature({
    name: "Webhooks/CreateWebhook",
    register(container) {
        container.register(CreateWebhookUseCase);
        container.register(CreateWebhookGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCaseAbstraction)
        };
    }
});
