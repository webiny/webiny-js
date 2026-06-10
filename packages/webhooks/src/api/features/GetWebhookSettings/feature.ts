import { createFeature } from "@webiny/feature/api";
import { GetWebhookSettingsRepository } from "./GetWebhookSettingsRepository.js";

export const GetWebhookSettingsFeature = createFeature({
    name: "GetWebhookSettings",
    register(container) {
        container.register(GetWebhookSettingsRepository).inSingletonScope();
    }
});
