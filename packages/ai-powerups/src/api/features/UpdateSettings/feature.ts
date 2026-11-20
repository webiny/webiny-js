import { createFeature } from "@webiny/feature/api";
import UpdateSettingsRepository from "./UpdateSettingsRepository.js";
import UpdateSettingsUseCase from "./UpdateSettingsUseCase.js";

export const UpdateSettingsFeature = createFeature({
    name: "AiPowerUpsUpdateSettings",
    register(container) {
        container.register(UpdateSettingsRepository).inSingletonScope();
        container.register(UpdateSettingsUseCase);
    }
});
