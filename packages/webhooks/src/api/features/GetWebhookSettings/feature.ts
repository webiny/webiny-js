import { createFeature } from "@webiny/feature/api";
import { GetWebhookSettingsRepository } from "./GetWebhookSettingsRepository.js";
import { GetWebhookSettingsUseCase } from "./GetWebhookSettingsUseCase.js";

export const GetWebhookSettingsFeature = createFeature({
    name: "GetWebhookSettings",
    register(container) {
        container.register(GetWebhookSettingsUseCase);
        container.register(GetWebhookSettingsRepository).inSingletonScope();
    }
});
