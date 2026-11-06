import { createFeature } from "@webiny/feature/api";
import { GetWebhookSettingsUseCase } from "./GetWebhookSettingsUseCase.js";
import { GetWebhookSettingsRepository } from "./GetWebhookSettingsRepository.js";

export const GetWebhookSettingsFeature = createFeature({
    name: "GetWebhookSettings",
    register(container) {
        container.register(GetWebhookSettingsUseCase);
        container.register(GetWebhookSettingsRepository).inSingletonScope();
    }
});
