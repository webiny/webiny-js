import { createFeature } from "@webiny/feature/api";
import GetSettingsRepository from "./GetSettingsRepository.js";
import GetSettingsUseCase from "./GetSettingsUseCase.js";

export const GetSettingsFeature = createFeature({
    name: "AiPowerUpsGetSettings",
    register(container) {
        container.register(GetSettingsRepository).inSingletonScope();
        container.register(GetSettingsUseCase);
    }
});
