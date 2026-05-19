import { createFeature } from "@webiny/feature/api";
import { GetWebhookUseCase } from "./GetWebhookUseCase.js";
import { GetWebhookRepository } from "./GetWebhookRepository.js";

export const GetWebhookFeature = createFeature({
    name: "GetWebhook",
    register(container) {
        container.register(GetWebhookUseCase);
        container.register(GetWebhookRepository).inSingletonScope();
    }
});
