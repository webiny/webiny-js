import { createFeature } from "@webiny/feature/api";
import { GetBackgroundTaskSettingsRepository } from "./GetBackgroundTaskSettingsRepository.js";

export const GetBackgroundTaskSettingsFeature = createFeature({
    name: "GetBackgroundTaskSettings",
    register(container) {
        container.register(GetBackgroundTaskSettingsRepository).inSingletonScope();
    }
});
