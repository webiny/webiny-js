import { createFeature } from "@webiny/feature/api";
import GetWebhookUseCaseImpl from "./GetWebhookUseCase.js";
import GetWebhookRepositoryImpl from "./GetWebhookRepository.js";

export const GetWebhookFeature = createFeature({
    name: "GetWebhook",
    register(container) {
        container.register(GetWebhookUseCaseImpl);
        container.register(GetWebhookRepositoryImpl).inSingletonScope();
    }
});
