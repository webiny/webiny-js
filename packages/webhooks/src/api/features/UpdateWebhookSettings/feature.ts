import { createFeature } from "@webiny/feature/api";
import { UpdateWebhookSettingsUseCase } from "./UpdateWebhookSettingsUseCase.js";
import { UpdateWebhookSettingsRepository } from "./UpdateWebhookSettingsRepository.js";

export const UpdateWebhookSettingsFeature = createFeature({
    name: "UpdateWebhookSettings",
    register(container) {
        container.register(UpdateWebhookSettingsUseCase);
        container.register(UpdateWebhookSettingsRepository).inSingletonScope();
    }
});
