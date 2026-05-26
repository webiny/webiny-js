import { createFeature } from "@webiny/feature/api";
import { UpdateBackgroundTaskSettingsUseCase } from "./UpdateBackgroundTaskSettingsUseCase.js";
import { UpdateBackgroundTaskSettingsRepository } from "./UpdateBackgroundTaskSettingsRepository.js";

export const UpdateBackgroundTaskSettingsFeature = createFeature({
    name: "UpdateBackgroundTaskSettings",
    register(container) {
        container.register(UpdateBackgroundTaskSettingsUseCase);
        container.register(UpdateBackgroundTaskSettingsRepository).inSingletonScope();
    }
});
