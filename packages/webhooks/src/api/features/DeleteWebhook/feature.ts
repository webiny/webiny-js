import { createFeature } from "@webiny/feature/api";
import DeleteWebhookUseCaseImpl from "./DeleteWebhookUseCase.js";
import DeleteWebhookRepositoryImpl from "./DeleteWebhookRepository.js";

export const DeleteWebhookFeature = createFeature({
    name: "DeleteWebhook",
    register(container) {
        container.register(DeleteWebhookUseCaseImpl);
        container.register(DeleteWebhookRepositoryImpl).inSingletonScope();
    }
});
