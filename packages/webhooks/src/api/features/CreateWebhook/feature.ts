import { createFeature } from "@webiny/feature/api";
import CreateWebhookUseCaseImpl from "./CreateWebhookUseCase.js";
import CreateWebhookRepositoryImpl from "./CreateWebhookRepository.js";

export const CreateWebhookFeature = createFeature({
    name: "CreateWebhook",
    register(container) {
        container.register(CreateWebhookUseCaseImpl);
        container.register(CreateWebhookRepositoryImpl).inSingletonScope();
    }
});
