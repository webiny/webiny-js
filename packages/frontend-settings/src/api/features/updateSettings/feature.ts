import { createFeature } from "@webiny/feature/api";
import { FrontendUpdateSettingsUseCase } from "./FrontendUpdateSettingsUseCase.js";
import { FrontendUpdateSettingsRepository } from "./FrontendUpdateSettingsRepository.js";

export const FrontendUpdateSettingsFeature = createFeature({
    name: "FrontendSettings/UpdateSettings",
    register(container) {
        container.register(FrontendUpdateSettingsUseCase);
        container.register(FrontendUpdateSettingsRepository);
    }
});
