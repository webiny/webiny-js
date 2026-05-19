import { createFeature } from "@webiny/feature/api";
import { UpdateWebhookUseCase } from "./UpdateWebhookUseCase.js";
import { UpdateWebhookRepository } from "./UpdateWebhookRepository.js";

export const UpdateWebhookFeature = createFeature({
    name: "UpdateWebhook",
    register(container) {
        container.register(UpdateWebhookUseCase);
        container.register(UpdateWebhookRepository).inSingletonScope();
    }
});
