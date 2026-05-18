import { createFeature } from "@webiny/feature/api";
import { DeleteWebhookUseCase } from "./DeleteWebhookUseCase.js";
import { DeleteWebhookRepository } from "./DeleteWebhookRepository.js";

export const DeleteWebhookFeature = createFeature({
    name: "DeleteWebhook",
    register(container) {
        container.register(DeleteWebhookUseCase);
        container.register(DeleteWebhookRepository).inSingletonScope();
    }
});
