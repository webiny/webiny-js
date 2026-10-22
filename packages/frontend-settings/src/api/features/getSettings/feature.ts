import { createFeature } from "@webiny/feature/api";
import { FrontendGetSettingsUseCase } from "./FrontendGetSettingsUseCase.js";
import { FrontendGetSettingsRepository } from "./FrontendGetSettingsRepository.js";

export const FrontendGetSettingsFeature = createFeature({
    name: "FrontendSettings/GetSettings",
    register(container) {
        container.register(FrontendGetSettingsUseCase);
        container.register(FrontendGetSettingsRepository);
    }
});
