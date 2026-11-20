import { createFeature } from "@webiny/feature/api";
import { UpdateSettingsRepositoryImplementation } from "./UpdateSettingsRepository.js";
import { UpdateSettingsUseCaseImplementation } from "./UpdateSettingsUseCase.js";

export const UpdateSettingsFeature = createFeature({
    name: "AiPowerUpsUpdateSettings",
    register(container) {
        container.register(UpdateSettingsRepositoryImplementation).inSingletonScope();
        container.register(UpdateSettingsUseCaseImplementation);
    }
});
