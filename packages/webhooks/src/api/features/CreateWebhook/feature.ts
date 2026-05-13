import { createFeature } from "@webiny/feature/api";
import { CreateWebhookUseCase } from "./CreateWebhookUseCase.js";
import { CreateWebhookRepository } from "./CreateWebhookRepository.js";

export const CreateWebhookFeature = createFeature({
    name: "CreateWebhook",
    register(container) {
        container.register(CreateWebhookUseCase);
        container.register(CreateWebhookRepository).inSingletonScope();
    }
});
