import { createFeature } from "@webiny/feature/api";
import UpdateWebhookUseCaseImpl from "./UpdateWebhookUseCase.js";
import UpdateWebhookRepositoryImpl from "./UpdateWebhookRepository.js";

export const UpdateWebhookFeature = createFeature({
    name: "UpdateWebhook",
    register(container) {
        container.register(UpdateWebhookUseCaseImpl);
        container.register(UpdateWebhookRepositoryImpl).inSingletonScope();
    }
});
