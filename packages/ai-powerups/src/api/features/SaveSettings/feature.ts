import { createFeature } from "@webiny/feature/api";
import { SaveSettingsRepositoryImplementation } from "./SaveSettingsRepository.js";
import { SaveSettingsUseCaseImplementation } from "./SaveSettingsUseCase.js";

export const SaveSettingsFeature = createFeature({
    name: "AiPowerupsSaveSettings",
    register(container) {
        container.register(SaveSettingsRepositoryImplementation).inSingletonScope();
        container.register(SaveSettingsUseCaseImplementation);
    }
});
